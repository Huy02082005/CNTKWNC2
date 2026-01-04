const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

router.get('/stats', dashboardController.getDashboardStats);

router.get('/recent-orders', dashboardController.getRecentOrders);

router.get('/recent-customers', dashboardController.getRecentCustomers);

module.exports = router;