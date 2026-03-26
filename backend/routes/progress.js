const express = require('express');
const router = express.Router();
const { getGoals, createGoal, updateGoal, deleteGoal, getProgressSummary } = require('../controllers/progressController');
const { protect, roleCheck } = require('../middleware/auth');

router.get('/', protect, getGoals);
router.get('/summary', protect, getProgressSummary);
router.post('/', protect, roleCheck('student'), createGoal);
router.put('/:id', protect, roleCheck('student'), updateGoal);
router.delete('/:id', protect, roleCheck('student'), deleteGoal);

module.exports = router;
