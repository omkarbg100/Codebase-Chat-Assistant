const Chat = require('../models/Chat');
const axios = require('axios');

exports.askQuestion = async (req, res) => {
  try {
    const { query, repoId } = req.body;
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

    // 3. Call AI Service
    try {
        const aiResponse = await axios.post(`${process.env.AI_SERVICE_URL}/ask`, {
            query: query,
            repo_id: repoId,
            chat_history: history
        });

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
            chatId: chat._id
        });

    } catch (aiError) {
        console.error('AI Service Error:', aiError.response?.data || aiError.message);
        res.status(500).json({ 
            message: 'AI Service failed to generate response', 
            error: aiError.response?.data?.detail || aiError.message 
        });
    }

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
