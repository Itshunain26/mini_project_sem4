const express = require('express');
const router = express.Router();
const { getStats, getAllUsers, toggleUserStatus, deleteUser } = require('../controllers/adminController');
const { protect, roleCheck } = require('../middleware/auth');

router.use(protect, roleCheck('admin'));

router.get('/stats', getStats);
router.get('/users', getAllUsers);
router.put('/users/:id/toggle', toggleUserStatus);
router.delete('/users/:id', deleteUser);

module.exports = router;
