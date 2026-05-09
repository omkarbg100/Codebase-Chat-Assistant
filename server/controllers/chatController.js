const Chat = require('../models/Chat');
const Repo = require('../models/Repo');
const axios = require('axios');

exports.askQuestion = async (req, res) => {
  try {
    let { query, repoId } = req.body;
    if (!query || !repoId) {
        return res.status(400).json({ message: 'Query and repoId are required' });
    }

    // 1. Get existing chat or create new one
    let chat = await Chat.findOne({ userId: req.user.id, repoId: repoId });
    if (!chat) {
      chat = new Chat({ userId: req.user.id, repoId: repoId, messages: [] });
    }

    // 2. Prepare context (previous messages)
    const history = chat.messages.slice(-5).map(m => ({
        role: m.role,
        content: m.content
    }));

    // Helper function to call AI service
    const askAiService = async () => {
        return await axios.post(`${process.env.AI_SERVICE_URL}/ask`, {
            query: query,
            repo_id: repoId,
            chat_history: history
        });
    };

    // 3. Call AI Service with auto-recovery for missing VectorDB
    let aiResponse;
    try {
        aiResponse = await askAiService();
    } catch (aiError) {
        // Check if the error is a 404 (Repo not found in vector db)
        const isVectorDbMissing = aiError.response?.status === 404 || 
            String(aiError.response?.data?.detail).toLowerCase().includes('not found') ||
            String(aiError.response?.data?.detail).toLowerCase().includes('collection');

        if (isVectorDbMissing) {
            console.log(`[Auto-Recovery] Vector DB missing for ${repoId}. Attempting to reload...`);
            
            // Look up the repo URL in MongoDB
            const repo = await Repo.findOne({ repoId: repoId });
            if (!repo || !repo.repoUrl) {
                return res.status(404).json({ message: 'Repository not found in database. Cannot recover Vector DB.' });
            }

            try {
                // Call load-repo to recreate the vector database
                const loadResponse = await axios.post(`${process.env.AI_SERVICE_URL}/load-repo`, {
                    repo_url: repo.repoUrl
                });
                
                const newRepoId = loadResponse.data.repo_id;
                console.log(`[Auto-Recovery] Successfully reloaded repo. Old ID: ${repoId}, New ID: ${newRepoId}. Retrying query...`);
                
                // Update the Repo database with the new ID
                repo.repoId = newRepoId;
                await repo.save();

                // Update the Chat database with the new ID
                chat.repoId = newRepoId;

                // Update the local repoId so askAiService() uses the new one
                repoId = newRepoId;
                
                // Retry the original query with the updated repoId
                aiResponse = await askAiService();
            } catch (recoveryError) {
                console.error('AI Service Error during auto-recovery:', recoveryError.response?.data || recoveryError.message);
                return res.status(500).json({ 
                    message: 'AI Service failed to recreate vector database during auto-recovery', 
                    error: recoveryError.response?.data?.detail || recoveryError.message 
                });
            }
        } else {
            console.error('AI Service Error:', aiError.response?.data || aiError.message);
            return res.status(500).json({ 
                message: 'AI Service failed to generate response', 
                error: aiError.response?.data?.detail || aiError.message 
            });
        }
    }

    const { answer, sources } = aiResponse.data;

    // 4. Save messages to history
    chat.messages.push({ role: 'user', content: query });
    chat.messages.push({ 
        role: 'assistant', 
        content: answer,
        sources: sources 
    });
    chat.updatedAt = Date.now();
    await chat.save();

    res.status(200).json({
        answer,
        sources,
        chatId: chat._id,
        updatedRepoId: repoId // Send the potentially updated repoId back to the client
    });

  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

exports.getChatHistory = async (req, res) => {
    try {
        const { repoId } = req.params;
        const chat = await Chat.findOne({ userId: req.user.id, repoId: repoId });
        res.status(200).json(chat || { messages: [] });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch chat history' });
    }
};
