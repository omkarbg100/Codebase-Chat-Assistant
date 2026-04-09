const express = require('express');
const router = express.Router();
const repoController = require('../controllers/repoController');
const auth = require('../middleware/auth');

router.post('/upload', auth, repoController.uploadRepo);
router.get('/list', auth, repoController.getUserRepos);

module.exports = router;
