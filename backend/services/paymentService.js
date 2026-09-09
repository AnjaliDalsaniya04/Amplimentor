'use strict';
const { User, Payment, Subscription } = require('../models');

const stripe = process.env.STRIPE_SECRET_KEY
  ? require('stripe')(process.env.STRIPE_SECRET_KEY)
  : null;

async function getConfig() {
  return { publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '' };
}

async function getPaymentHistory(userId) {
  const payments = await Payment.findAll({
    where: { studentId: userId },
    include: [{ model: User, as: 'mentor', attributes: ['id','name','email'] }],
    order: [['createdAt', 'DESC']],
  });
  const subscriptions = await Subscription.findAll({
    where: { studentId: userId },
    include: [{ model: User, as: 'mentor', attributes: ['id','name','email'] }],
    order: [['createdAt', 'DESC']],
  });
  return { payments, subscriptions };
}

async function createPaymentIntent(userId, body) {
  if (!stripe) throw Object.assign(new Error('Payment system not configured.'), { status: 503 });
  const { mentorId, sessionId, amount, description } = body;
  if (!mentorId || !amount)
    throw Object.assign(new Error('mentorId and amount are required.'), { status: 400 });

  const user = await User.findByPk(userId);
  let stripeCustomerId = user.stripeCustomerId;
  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({ email: user.email, name: user.name });
    stripeCustomerId = customer.id;
    await User.update({ stripeCustomerId }, { where: { id: userId } });
  }

  const intent = await stripe.paymentIntents.create({
    amount: parseInt(amount, 10),
    currency: 'inr',
    customer: stripeCustomerId,
    description: description || 'Mentoring session',
    metadata: { mentorId, sessionId: sessionId || '', studentId: userId },
  });

  const payment = await Payment.create({
    studentId: userId,
    mentorId,
    sessionId: sessionId || null,
    amount: parseInt(amount, 10),
    description,
    stripePaymentIntentId: intent.id,
    status: 'pending',
  });

  return { clientSecret: intent.client_secret, paymentId: payment.id };
}

async function confirmPayment(body) {
  if (!stripe) throw Object.assign(new Error('Payment system not configured.'), { status: 503 });
  const { paymentIntentId, paymentId } = body;
  if (!paymentIntentId || !paymentId)
    throw Object.assign(new Error('paymentIntentId and paymentId are required.'), { status: 400 });

  const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
  const status = intent.status === 'succeeded' ? 'completed' : 'failed';
  await Payment.update({ status }, { where: { id: paymentId } });
  return { message: status === 'completed' ? 'Payment confirmed.' : 'Payment failed.' };
}

async function createSubscription(userId, body) {
  if (!stripe) throw Object.assign(new Error('Payment system not configured.'), { status: 503 });
  const { mentorId, plan, interval, priceId, amount, sessionsPerMonth } = body;
  if (!mentorId || !plan || !priceId)
    throw Object.assign(new Error('mentorId, plan, and priceId are required.'), { status: 400 });

  const user = await User.findByPk(userId);
  let stripeCustomerId = user.stripeCustomerId;
  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({ email: user.email, name: user.name });
    stripeCustomerId = customer.id;
    await User.update({ stripeCustomerId }, { where: { id: userId } });
  }

  const stripeSub = await stripe.subscriptions.create({
    customer: stripeCustomerId,
    items: [{ price: priceId }],
    payment_behavior: 'default_incomplete',
    expand: ['latest_invoice.payment_intent'],
  });

  const sub = await Subscription.create({
    studentId: userId,
    mentorId,
    plan,
    interval: interval || 'monthly',
    amount: amount || 0,
    stripeSubscriptionId: stripeSub.id,
    stripePriceId: priceId,
    stripeCustomerId,
    sessionsPerMonth: sessionsPerMonth || 4,
    status: 'active',
    currentPeriodStart: new Date(stripeSub.current_period_start * 1000),
    currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
  });

  return {
    subscriptionId: sub.id,
    clientSecret: stripeSub.latest_invoice.payment_intent.client_secret,
  };
}

async function cancelSubscription(userId, body) {
  if (!stripe) throw Object.assign(new Error('Payment system not configured.'), { status: 503 });
  const { subscriptionId } = body;
  if (!subscriptionId)
    throw Object.assign(new Error('subscriptionId is required.'), { status: 400 });

  const sub = await Subscription.findByPk(subscriptionId);
  if (!sub) throw Object.assign(new Error('Subscription not found.'), { status: 404 });
  if (sub.studentId !== userId) throw Object.assign(new Error('Access denied.'), { status: 403 });

  await stripe.subscriptions.update(sub.stripeSubscriptionId, { cancel_at_period_end: true });
  await sub.update({ cancelAtPeriodEnd: true });
  return { message: 'Subscription will be cancelled at end of billing period.' };
}

async function handleWebhook(rawBody, sig) {
  if (!stripe) throw Object.assign(new Error('Payment system not configured.'), { status: 503 });
  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET || '');
  } catch (err) {
    throw Object.assign(new Error(`Webhook Error: ${err.message}`), { status: 400 });
  }

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

  return { received: true };
}

module.exports = {
  getConfig,
  getPaymentHistory,
  createPaymentIntent,
  confirmPayment,
  createSubscription,
  cancelSubscription,
  handleWebhook,
};