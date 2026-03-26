const express = require('express');
const router = express.Router();
const { createSession, getSessions, updateSession, submitFeedback } = require('../controllers/sessionController');
const { protect, roleCheck } = require('../middleware/auth');

router.post('/', protect, roleCheck('mentor'), createSession);
router.get('/', protect, getSessions);
router.put('/:id', protect, updateSession);
router.post('/:id/feedback', protect, submitFeedback);

module.exports = router;
