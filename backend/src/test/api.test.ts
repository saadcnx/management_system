import request from 'supertest';
import { describe, it, expect } from 'vitest';
import { app } from '../index';
import { User } from '../models/User';
import { createLabWithAdmin, authCookie } from './helpers';

const patient = { name: 'John', phone: '123', gender: 'MALE', dateOfBirth: '1990-01-01' };

describe('auth', () => {
  it('logs in, rejects bad password and refreshes', async () => {
    const { admin } = await createLabWithAdmin('login');
    const agent = request.agent(app);
    const ok = await agent.post('/api/auth/login').send({ email: admin.email, password: 'password123' });
    expect(ok.status).toBe(200);
    expect(ok.headers['set-cookie']).toBeDefined();
    const refreshed = await agent.post('/api/auth/refresh');
    expect(refreshed.status).toBe(200);
    const bad = await request(app).post('/api/auth/login').send({ email: admin.email, password: 'nope' });
    expect(bad.status).toBe(401);
  });
});

describe('tenancy and roles', () => {
  it('isolates tenants, generates codes and enforces roles', async () => {
    const a = await createLabWithAdmin('a');
    const b = await createLabWithAdmin('b');
    const cookieA = authCookie(String(a.admin._id));
    const cookieB = authCookie(String(b.admin._id));

    const created = await request(app).post('/api/patients').set('Cookie', cookieA).send(patient);
    expect(created.status).toBe(201);
    expect(created.body.data.patientCode).toBe('PT-0001');

    const cross = await request(app).get(`/api/patients/${created.body.data._id}`).set('Cookie', cookieB);
    expect(cross.status).toBe(404);

    const listB = await request(app).get('/api/patients').set('Cookie', cookieB);
    expect(listB.body.total).toBe(0);

    const doctor = await User.create({
      name: 'Doc',
      email: 'doc@test.com',
      password: 'password123',
      role: 'DOCTOR',
      tenantId: a.lab._id,
    });
    const forbidden = await request(app)
      .post('/api/patients')
      .set('Cookie', authCookie(String(doctor._id)))
      .send(patient);
    expect(forbidden.status).toBe(403);

    const labs = await request(app).get('/api/labs').set('Cookie', cookieA);
    expect(labs.status).toBe(403);
  });
});