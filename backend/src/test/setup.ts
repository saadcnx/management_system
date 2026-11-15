import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { beforeAll, afterAll } from 'vitest';

let mongo: MongoMemoryServer;

beforeAll(async () => {
  process.env.JWT_ACCESS_SECRET = 'test-access';
  process.env.JWT_REFRESH_SECRET = 'test-refresh';
  process.env.CORS_ORIGIN = 'http://localhost:3000';
  process.env.NODE_ENV = 'test';
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  await mongo.stop();
});