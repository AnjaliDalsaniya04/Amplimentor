'use strict';
const express = require('express');
const { User, Payment, Subscription } = require('../models');
const { requireAuthApi, requireRoleApi } = require('../middleware/auth');
const router = express.Router();

// Stripe is optional
const stripe = process.env.STRIPE_SECRET_KEY
  ? require('stripe')(process.env.STRIPE_SECRET_KEY)
  : null;

// GET /api/payments/config
router.get('/config', (req, res) => {
  res.json({ publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '' });
});

// GET /api/payments/history
router.get('/history', requireAuthApi, async (req, res) => {
  try {
    const payments = await Payment.findAll({
      where: { studentId: req.session.userId },
      include: [{ model: User, as: 'mentor', attributes: ['id','name','email'] }],
      order: [['createdAt', 'DESC']],
    });
    const subscriptions = await Subscription.findAll({
      where: { studentId: req.session.userId },
      include: [{ model: User, as: 'mentor', attributes: ['id','name','email'] }],
      order: [['createdAt', 'DESC']],
    });
    res.json({ payments, subscriptions });
  } catch { res.status(500).json({ message: 'Server error.' }); }
});

// POST /api/payments/create-payment-intent
router.post('/create-payment-intent', requireRoleApi('student'), async (req, res) => {
  if (!stripe) return res.status(503).json({ message: 'Payment system not configured.' });
  const { mentorId, sessionId, amount, description } = req.body;
  if (!mentorId || !amount)
    return res.status(400).json({ message: 'mentorId and amount are required.' });
  try {
    let stripeCustomerId = req.currentUser.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({ email: req.currentUser.email, name: req.currentUser.name });
      stripeCustomerId = customer.id;
      await User.update({ stripeCustomerId }, { where: { id: req.session.userId } });
    }
    const intent = await stripe.paymentIntents.create({
      amount: parseInt(amount),
      currency: 'inr',
      customer: stripeCustomerId,
      description: description || 'Mentoring session',
      metadata: { mentorId, sessionId: sessionId || '', studentId: req.session.userId },
    });
    const payment = await Payment.create({
      studentId: req.session.userId, mentorId,
      sessionId: sessionId || null,
      amount: parseInt(amount), description,
      stripePaymentIntentId: intent.id, status: 'pending',
    });
    res.json({ clientSecret: intent.client_secret, paymentId: payment.id });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error.' }); }
});

// POST /api/payments/confirm
router.post('/confirm', requireAuthApi, async (req, res) => {
  if (!stripe) return res.status(503).json({ message: 'Payment system not configured.' });
  const { paymentIntentId, paymentId } = req.body;
  try {
    const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
    const status = intent.status === 'succeeded' ? 'completed' : 'failed';
    await Payment.update({ status }, { where: { id: paymentId } });
    res.json({ message: status === 'completed' ? 'Payment confirmed.' : 'Payment failed.' });
  } catch { res.status(500).json({ message: 'Server error.' }); }
});

// POST /api/payments/create-subscription
router.post('/create-subscription', requireRoleApi('student'), async (req, res) => {
  if (!stripe) return res.status(503).json({ message: 'Payment system not configured.' });
  const { mentorId, plan, interval, priceId, amount, sessionsPerMonth } = req.body;
  if (!mentorId || !plan || !priceId)
    return res.status(400).json({ message: 'mentorId, plan, and priceId are required.' });
  try {
    let stripeCustomerId = req.currentUser.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({ email: req.currentUser.email, name: req.currentUser.name });
      stripeCustomerId = customer.id;
      await User.update({ stripeCustomerId }, { where: { id: req.session.userId } });
    }
    const stripeSub = await stripe.subscriptions.create({
      customer: stripeCustomerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
    });
    const sub = await Subscription.create({
      studentId: req.session.userId, mentorId, plan,
      interval: interval || 'monthly',
      amount: amount || 0,
      stripeSubscriptionId: stripeSub.id, stripePriceId: priceId,
      stripeCustomerId, sessionsPerMonth: sessionsPerMonth || 4,
      status: 'active',
      currentPeriodStart: new Date(stripeSub.current_period_start * 1000),
      currentPeriodEnd:   new Date(stripeSub.current_period_end   * 1000),
    });
    res.json({
      subscriptionId: sub.id,
      clientSecret: stripeSub.latest_invoice.payment_intent.client_secret,
    });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error.' }); }
});

// POST /api/payments/cancel-subscription
router.post('/cancel-subscription', requireRoleApi('student'), async (req, res) => {
  if (!stripe) return res.status(503).json({ message: 'Payment system not configured.' });
  const { subscriptionId } = req.body;
  try {
    const sub = await Subscription.findByPk(subscriptionId);
    if (!sub) return res.status(404).json({ message: 'Subscription not found.' });
    if (sub.studentId !== req.session.userId)
      return res.status(403).json({ message: 'Access denied.' });
    await stripe.subscriptions.update(sub.stripeSubscriptionId, { cancel_at_period_end: true });
    await sub.update({ cancelAtPeriodEnd: true });
    res.json({ message: 'Subscription will be cancelled at end of billing period.' });
  } catch { res.status(500).json({ message: 'Server error.' }); }
});

// POST /api/payments/webhook  — Stripe webhook (raw body)
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!stripe) return res.status(503).json({ message: 'Payment system not configured.' });
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET || '');
  } catch (err) {
    return res.status(400).json({ message: `Webhook Error: ${err.message}` });
  }
  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await Payment.update({ status: 'completed' }, { where: { stripePaymentIntentId: event.data.object.id } });
        break;
      case 'payment_intent.payment_failed':
        await Payment.update({ status: 'failed' }, { where: { stripePaymentIntentId: event.data.object.id } });
        break;
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const s = event.data.object;
        const statusMap = { active: 'active', canceled: 'cancelled', past_due: 'past_due' };
        await Subscription.update(
          { status: statusMap[s.status] || 'expired', cancelAtPeriodEnd: s.cancel_at_period_end },
          { where: { stripeSubscriptionId: s.id } }
        );
        break;
      }
    }
    res.json({ received: true });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Webhook handler error.' }); }
});

module.exports = router;
