'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id:       { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      name:     { type: Sequelize.STRING, allowNull: false },
      email:    { type: Sequelize.STRING, allowNull: false, unique: true },
      password: { type: Sequelize.STRING, allowNull: false },
      role:     { type: Sequelize.ENUM('student', 'mentor'), allowNull: false },
      photo:    { type: Sequelize.STRING },
      bio:      { type: Sequelize.TEXT },
      phoneNumber: { type: Sequelize.STRING },
      address:  { type: Sequelize.STRING },
      dateOfBirth: { type: Sequelize.DATEONLY },
      linkedIn: { type: Sequelize.STRING },
      github:   { type: Sequelize.STRING },
      portfolio:{ type: Sequelize.STRING },
      // Student fields
      studentId:  { type: Sequelize.STRING },
      standard:   { type: Sequelize.ENUM('9', '10', '11', '12') },
      university: { type: Sequelize.STRING },
      subjects:   { type: Sequelize.ARRAY(Sequelize.STRING), defaultValue: [] },
      gpa:        { type: Sequelize.STRING },
      careerGoals: { type: Sequelize.TEXT },
      skillsToDevelop: { type: Sequelize.ARRAY(Sequelize.STRING), defaultValue: [] },
      areasOfInterest: { type: Sequelize.ARRAY(Sequelize.STRING), defaultValue: [] },
      meetingFrequency: { type: Sequelize.STRING },
      communicationPreference: { type: Sequelize.STRING },
      // Mentor fields
      company:    { type: Sequelize.STRING },
      experience: { type: Sequelize.STRING },
      location:   { type: Sequelize.STRING },
      expertiseAreas:  { type: Sequelize.ARRAY(Sequelize.STRING), defaultValue: [] },
      technicalSkills: { type: Sequelize.ARRAY(Sequelize.STRING), defaultValue: [] },
      industry:    { type: Sequelize.STRING },
      mentoringStyle: { type: Sequelize.STRING },
      availability:   { type: Sequelize.STRING },
      maxStudents:    { type: Sequelize.STRING },
      education:      { type: Sequelize.TEXT },
      certifications: { type: Sequelize.ARRAY(Sequelize.STRING), defaultValue: [] },
      // Pricing
      hourlyRate:  { type: Sequelize.INTEGER, defaultValue: 50000 },
      sessionRate: { type: Sequelize.INTEGER, defaultValue: 2000 },
      subscriptionPlans: { type: Sequelize.JSONB, defaultValue: [] },
      // Stripe
      stripeCustomerId: { type: Sequelize.STRING },
      paymentMethods:   { type: Sequelize.JSONB, defaultValue: [] },
      billingAddress:   { type: Sequelize.JSONB },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('users', ['role']);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('users');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_users_role";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_users_standard";');
  },
};
