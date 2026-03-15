import { describe, it, expect } from 'vitest';
import request from 'supertest';

import { app } from '../app';

describe('API Routes', () => {
  describe('GET /api/images/:imageId', () => {
    it('should return 404 for non-existent image', async () => {
      const res = await request(app).get('/api/images/non-existent-id');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('not found');
    });
  });

  describe('DELETE /api/images/:imageId', () => {
    it('should return error response with requestId for invalid credentials', async () => {
      const res = await request(app).delete('/api/images/non-existent-id');

      // With test credentials, Cloudinary rejects — verify error is handled gracefully
      expect(res.body.success).toBe(false);
      expect(res.body).toHaveProperty('requestId');
      expect(typeof res.body.requestId).toBe('string');
    });
  });

  describe('404 handling', () => {
    it('should return 404 for unknown routes', async () => {
      const res = await request(app).get('/api/unknown');

      expect(res.status).toBe(404);
    });
  });
});
