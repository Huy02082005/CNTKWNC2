const express = require('express');
const router = express.Router();
const statisticsController = require('../controllers/statisticsController');

router.get('/statistics', statisticsController.getDetailedStatistics);
router.post('/export-report', statisticsController.exportReport);

module.exports = router;