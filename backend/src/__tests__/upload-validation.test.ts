import { describe, it, expect } from 'vitest';
import request from 'supertest';
import path from 'path';
import fs from 'fs';

import { app } from '../app';

describe('POST /api/images/upload — validation', () => {
  it('should return 400 when no file is provided', async () => {
    const res = await request(app).post('/api/images/upload');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('No image file');
  });

  it('should return 400 for non-image file types', async () => {
    // Create a temporary text file
    const tmpFile = path.join(__dirname, 'test.txt');
    fs.writeFileSync(tmpFile, 'not an image');

    const res = await request(app)
      .post('/api/images/upload')
      .attach('image', tmpFile);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('Unsupported file type');

    fs.unlinkSync(tmpFile);
  });

  it('should include requestId in error responses', async () => {
    const res = await request(app).post('/api/images/upload');

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('requestId');
    expect(typeof res.body.requestId).toBe('string');
    expect(res.body.requestId.length).toBeGreaterThan(0);
  });

  it('should set X-Request-ID header on responses', async () => {
    const res = await request(app).get('/health');

    expect(res.headers['x-request-id']).toBeDefined();
    expect(typeof res.headers['x-request-id']).toBe('string');
  });
});
