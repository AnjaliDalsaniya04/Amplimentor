'use strict';
const bcrypt = require('bcrypt');
const { User } = require('../models');

async function register({ name, email, password, role }) {
  if (!name || !email || !password || !role)
    throw Object.assign(new Error('All fields are required.'), { status: 400 });
  if (!['student', 'mentor'].includes(role))
    throw Object.assign(new Error('Role must be student or mentor.'), { status: 400 });

  const existing = await User.findOne({ where: { email } });
  if (existing)
    throw Object.assign(new Error('Email already registered.'), { status: 409 });

  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, password: hashed, role });
  return user;
}

async function login({ email, password }) {
  if (!email || !password)
    throw Object.assign(new Error('Email and password are required.'), { status: 400 });

  const user = await User.findOne({ where: { email } });
  if (!user) throw Object.assign(new Error('Invalid email or password.'), { status: 401 });

  const match = await bcrypt.compare(password, user.password);
  if (!match) throw Object.assign(new Error('Invalid email or password.'), { status: 401 });

  return user;
}

module.exports = { register, login };