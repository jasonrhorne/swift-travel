import { describe, expect, it } from 'vitest';
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
