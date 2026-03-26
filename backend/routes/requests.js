const express = require('express');
const router = express.Router();
const { sendRequest, getRequests, respondToRequest, cancelRequest } = require('../controllers/requestController');
const { protect, roleCheck } = require('../middleware/auth');

router.post('/', protect, roleCheck('student'), sendRequest);
router.get('/', protect, getRequests);
router.put('/:id', protect, roleCheck('mentor'), respondToRequest);
router.delete('/:id', protect, roleCheck('student'), cancelRequest);

module.exports = router;
