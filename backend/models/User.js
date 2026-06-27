'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('student', 'mentor'),
      allowNull: false,
    },

    // Profile
    photo:   { type: DataTypes.STRING },
    bio:     { type: DataTypes.TEXT },
    phoneNumber: { type: DataTypes.STRING },
    address: { type: DataTypes.STRING },
    dateOfBirth: { type: DataTypes.DATEONLY },

    // Professional links
    linkedIn:  { type: DataTypes.STRING },
    github:    { type: DataTypes.STRING },
    portfolio: { type: DataTypes.STRING },

    // Student-specific
    studentId:  { type: DataTypes.STRING },
    standard:   { type: DataTypes.ENUM('9', '10', '11', '12') },
    university: { type: DataTypes.STRING },
    subjects:   { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
    gpa:        { type: DataTypes.STRING },
    careerGoals: { type: DataTypes.TEXT },
    skillsToDevelop: { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
    areasOfInterest: { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
    meetingFrequency: { type: DataTypes.STRING },
    communicationPreference: { type: DataTypes.STRING },

    // Mentor-specific
    company:    { type: DataTypes.STRING },
    experience: { type: DataTypes.STRING },
    location:   { type: DataTypes.STRING },
    expertiseAreas:  { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
    technicalSkills: { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
    industry:    { type: DataTypes.STRING },
    mentoringStyle: { type: DataTypes.STRING },
    availability:   { type: DataTypes.STRING },
    maxStudents:    { type: DataTypes.STRING },
    education:      { type: DataTypes.TEXT },
    certifications: { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },

    // Pricing (stored in paise/cents)
    hourlyRate:  { type: DataTypes.INTEGER, defaultValue: 50000 },
    sessionRate: { type: DataTypes.INTEGER, defaultValue: 2000 },
    subscriptionPlans: { type: DataTypes.JSONB, defaultValue: [] },

    // Stripe
    stripeCustomerId: { type: DataTypes.STRING },
    paymentMethods:   { type: DataTypes.JSONB, defaultValue: [] },
    billingAddress:   { type: DataTypes.JSONB },
  }, {
    tableName: 'users',
    timestamps: true,
    indexes: [
      { unique: true, fields: ['email'] },
      { fields: ['role'] },
    ],
  });

  return User;
};
