const express = require('express');
const router = express.Router();
const { getMentors, getMentorById, updateMentorProfile, getMyMentorProfile } = require('../controllers/mentorController');
const { protect, roleCheck } = require('../middleware/auth');

router.get('/', getMentors);
router.get('/profile/me', protect, roleCheck('mentor'), getMyMentorProfile);
router.get('/:id', getMentorById);
router.put('/profile', protect, roleCheck('mentor'), updateMentorProfile);

module.exports = router;
