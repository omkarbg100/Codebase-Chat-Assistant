const Repo = require('../models/Repo');
const axios = require('axios');

exports.uploadRepo = async (req, res) => {
  try {
    const { repo_url } = req.body;
    if (!repo_url) return res.status(400).json({ message: 'Repository URL is required' });

    // 1. Create a placeholder record
    const newRepo = new Repo({
      userId: req.user.id,
      repoUrl: repo_url,
      repoId: 'temp', // Updated once AI service responds
      status: 'processing'
    });
    await newRepo.save();

    // 2. Call AI Service
    try {
      const aiResponse = await axios.post(`${process.env.AI_SERVICE_URL}/load-repo`, {
        repo_url: repo_url
      });

      // 3. Update record with generated repo_id
      newRepo.repoId = aiResponse.data.repo_id;
      newRepo.status = 'completed';
      newRepo.name = repo_url.split('/').pop().replace('.git', '');
      await newRepo.save();

      res.status(200).json({
        message: 'Repository indexed successfully',
        repo: newRepo
      });

    } catch (aiError) {
      newRepo.status = 'failed';
      await newRepo.save();
      console.error('AI Service Error:', aiError.response?.data || aiError.message);
      res.status(500).json({
        message: 'AI Service failed to index repository',
        error: aiError.response?.data?.detail || aiError.message
      });
    }

  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

exports.getUserRepos = async (req, res) => {
  try {
    const repos = await Repo.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json(repos);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch repositories' });
  }
};
