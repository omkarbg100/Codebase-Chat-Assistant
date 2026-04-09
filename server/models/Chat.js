const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  repoId: { type: String, required: true },
  messages: [
    {
      role: { type: String, enum: ['user', 'assistant'], required: true },
      content: { type: String, required: true },
      sources: [
        {
          file_path: String,
          language: String,
          content: String
        }
      ],
      timestamp: { type: Date, default: Date.now }
    }
  ],
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Chat', chatSchema);
