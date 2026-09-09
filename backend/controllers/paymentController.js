'use strict';
const paymentService = require('../services/paymentService');

async function getConfig(req, res, next) {
  try {
    const config = await paymentService.getConfig();
    res.json(config);
  } catch (err) {
    next(err);
  }
}

async function getHistory(req, res, next) {
  try {
    const history = await paymentService.getPaymentHistory(req.currentUser.id);
    res.json(history);
  } catch (err) {
    next(err);
  }
}

async function createPaymentIntent(req, res, next) {
  try {
    const result = await paymentService.createPaymentIntent(req.currentUser.id, req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function confirmPayment(req, res, next) {
  try {
    const result = await paymentService.confirmPayment(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function createSubscription(req, res, next) {
  try {
    const result = await paymentService.createSubscription(req.currentUser.id, req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function cancelSubscription(req, res, next) {
  try {
    const result = await paymentService.cancelSubscription(req.currentUser.id, req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function webhook(req, res, next) {
  try {
    const payload = req.rawBody || req.body;
    const result = await paymentService.handleWebhook(payload, req.headers['stripe-signature']);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { getConfig, getHistory, createPaymentIntent, confirmPayment, createSubscription, cancelSubscription, webhook };