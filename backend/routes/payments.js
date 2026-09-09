'use strict';
const { requireAuthApi, requireRoleApi } = require('../middleware/auth');
const paymentController = require('../controllers/paymentController');
const router = require('express').Router();

router.get('/config', paymentController.getConfig);
router.get('/history', requireAuthApi, paymentController.getHistory);
router.post('/create-payment-intent', requireRoleApi('student'), paymentController.createPaymentIntent);
router.post('/confirm', requireAuthApi, paymentController.confirmPayment);
router.post('/create-subscription', requireRoleApi('student'), paymentController.createSubscription);
router.post('/cancel-subscription', requireRoleApi('student'), paymentController.cancelSubscription);
router.post('/webhook', paymentController.webhook);

module.exports = router;
