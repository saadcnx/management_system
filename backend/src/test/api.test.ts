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

describe('lab workflow', () => {
  it('takes an order from catalog to verified and paid', async () => {
    const a = await createLabWithAdmin('wf');
    const c = authCookie(String(a.admin._id));
    const pat = await request(app).post('/api/patients').set('Cookie', c).send(patient);
    const t = await request(app)
      .post('/api/tests')
      .set('Cookie', c)
      .send({ name: 'Hemoglobin', code: 'hb', sampleType: 'Blood', unit: 'g/dL', price: 500, refMin: 12, refMax: 16 });
    expect(t.status).toBe(201);
    const o = await request(app)
      .post('/api/orders')
      .set('Cookie', c)
      .send({ patientId: pat.body.data._id, testIds: [t.body.data._id], discount: 100 });
    expect(o.status).toBe(201);
    expect(o.body.data.orderNumber).toBe('ORD-0001');
    expect(o.body.data.total).toBe(400);
    const id = o.body.data._id;
    const collected = await request(app).patch(`/api/orders/${id}/collect`).set('Cookie', c);
    expect(collected.status).toBe(200);
    const r = await request(app)
      .patch(`/api/orders/${id}/results`)
      .set('Cookie', c)
      .send({ results: [{ itemId: o.body.data.items[0]._id, result: '18' }] });
    expect(r.body.data.items[0].flag).toBe('HIGH');
    expect(r.body.data.status).toBe('RESULTS_ENTERED');
    const v = await request(app).patch(`/api/orders/${id}/verify`).set('Cookie', c);
    expect(v.body.data.status).toBe('VERIFIED');
    const p = await request(app).post(`/api/orders/${id}/payments`).set('Cookie', c).send({ amount: 400, method: 'CASH' });
    expect(p.body.data.paymentStatus).toBe('PAID');
  });
});