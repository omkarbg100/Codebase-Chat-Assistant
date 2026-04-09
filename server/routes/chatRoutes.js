const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const auth = require('../middleware/auth');

router.post('/ask', auth, chatController.askQuestion);
router.get('/history/:repoId', auth, chatController.getChatHistory);

module.exports = router;
