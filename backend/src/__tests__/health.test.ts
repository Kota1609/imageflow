import { describe, it, expect } from 'vitest';
import request from 'supertest';

import { app } from '../app';

describe('GET /health', () => {
  it('should return status ok with timestamp and uptime', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body).toHaveProperty('timestamp');
    expect(res.body).toHaveProperty('uptime');
    expect(typeof res.body.uptime).toBe('number');
  });
});
