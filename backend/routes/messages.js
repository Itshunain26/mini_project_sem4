const express = require('express');
const router = express.Router();
const { getConversations, getThread, sendMessage } = require('../controllers/messageController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getConversations);
router.get('/:userId', protect, getThread);
router.post('/', protect, sendMessage);

module.exports = router;
