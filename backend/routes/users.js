const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, updateStudentProfile, getCategories } = require('../controllers/userController');
const { protect } = require('../middleware/auth');

router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.put('/student-profile', protect, updateStudentProfile);
router.get('/categories', getCategories);

module.exports = router;
