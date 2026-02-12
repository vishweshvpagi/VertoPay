const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const request = require('supertest');
const mongoose = require('mongoose');
const connectDB = require('../src/config/database');

let app;
beforeAll(async () => {
  await connectDB();
  app = require('../server');
}, 20000);

afterAll(async () => {
  await mongoose.connection.close();
});

const unique = () => `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

describe('VertoPay Backend API', () => {
  describe('GET /api/health', () => {
    it('should return 200 and status OK', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'OK');
      expect(res.body).toHaveProperty('message', 'VertoPay Backend Running');
    });
  });

  describe('POST /api/auth/register/student', () => {
    it('should register a new student and return token and user', async () => {
      const email = `${unique()}@student.test`;
      const res = await request(app)
        .post('/api/auth/register/student')
        .send({
          name: 'Test Student',
          email,
          password: 'password123',
          phone: '0000000000',
        });
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.token).toMatch(/^eyJ/);
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.email).toBe(email);
      expect(res.body.user.role).toBe('student');
      expect(res.body.user).not.toHaveProperty('password');
      expect(res.body.user).toHaveProperty('studentId');
      expect(res.body.user).toHaveProperty('balance', 500);
    });

    it('should reject duplicate email with 400', async () => {
      const email = `${unique()}@student2.test`;
      await request(app)
        .post('/api/auth/register/student')
        .send({
          name: 'First',
          email,
          password: 'password123',
          phone: '0000000000',
        });
      const res = await request(app)
        .post('/api/auth/register/student')
        .send({
          name: 'Second',
          email,
          password: 'password456',
          phone: '0000000000',
        });
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/already exists/i);
    });
  });

  describe('POST /api/auth/register/merchant', () => {
    it('should register a new merchant and return token and user', async () => {
      const email = `${unique()}@merchant.test`;
      const res = await request(app)
        .post('/api/auth/register/merchant')
        .send({
          shopName: 'Test Cafe',
          ownerName: 'Test Owner',
          email,
          password: 'password123',
          phone: '0000000000',
          category: 'canteen',
        });
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.token).toMatch(/^eyJ/);
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.email).toBe(email);
      expect(res.body.user.role).toBe('merchant');
      expect(res.body.user).not.toHaveProperty('password');
      expect(res.body.user).toHaveProperty('merchantId');
      expect(res.body.user.shopName).toBe('Test Cafe');
    });
  });

  describe('POST /api/auth/login', () => {
    const studentEmail = `${unique()}@login.test`;
    const studentPassword = 'loginpass123';

    beforeAll(async () => {
      await request(app).post('/api/auth/register/student').send({
        name: 'Login Test Student',
        email: studentEmail,
        password: studentPassword,
        phone: '0000000000',
      });
    });

    it('should login with email and password (no role) and return token and user', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: studentEmail, password: studentPassword });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.email).toBe(studentEmail);
      expect(res.body.user.role).toBe('student');
    });

    it('should reject wrong password with 401', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: studentEmail, password: 'wrongpassword' });
      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/invalid credentials/i);
    });

    it('should reject unknown email with 401', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nonexistent@test.com', password: 'any' });
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return 401 without token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });

    it('should return current user with valid Bearer token', async () => {
      const email = `${unique()}@me.test`;
      const reg = await request(app).post('/api/auth/register/student').send({
        name: 'Me Test',
        email,
        password: 'pass123',
        phone: '0000000000',
      });
      expect(reg.status).toBe(201);
      const token = reg.body.token;
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.email).toBe(email);
    });
  });
});
