import { describe, expect, it, vi } from 'vitest';

// Mock @supabase/supabase-js to avoid WebSocket initialization
// which requires Node.js 22+ but CI runs Node.js 20
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      then: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    },
  })),
}));

import { handler as researchHandler } from '../../agents/research';
import { handler as curationHandler } from '../../agents/curation';
import { handler as validationHandler } from '../../agents/validation';
import { handler as responseHandler } from '../../agents/response';

const handlers = [
  ['research', researchHandler],
  ['curation', curationHandler],
  ['validation', validationHandler],
  ['response', responseHandler],
] as const;

describe.each(handlers)('%s agent handler', (_name, handler) => {
  it('rejects unsupported methods', async () => {
    const response = await handler({ httpMethod: 'GET', headers: {} });
    expect(response.statusCode).toBe(405);
  });

  it('requires a request ID', async () => {
    const response = await handler({
      httpMethod: 'POST',
      headers: { 'x-internal-token': 'test-internal-key' },
      body: '{}',
    });
    expect(response.statusCode).toBe(400);
  });
});
