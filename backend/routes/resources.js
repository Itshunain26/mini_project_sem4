const express = require('express');
const router = express.Router();
const { getResources, addResource, deleteResource, incrementView } = require('../controllers/resourceController');
const { protect } = require('../middleware/auth');

router.get('/', getResources);
router.post('/', protect, addResource);
router.delete('/:id', protect, deleteResource);
router.post('/:id/view', incrementView);

module.exports = router;
