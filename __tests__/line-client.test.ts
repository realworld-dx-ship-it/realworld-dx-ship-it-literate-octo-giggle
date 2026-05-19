import * as crypto from 'crypto';
import { verifySignature } from '../src/lib/line-client';

describe('verifySignature', () => {
  const SECRET = 'test-secret';
  const BODY = '{"events":[]}';

  function makeSignature(body: string, secret: string): string {
    return crypto.createHmac('SHA256', secret).update(body).digest('base64');
  }

  beforeEach(() => {
    process.env.LINE_CHANNEL_SECRET = SECRET;
  });

  it('正しい署名を受け入れる', () => {
    const sig = makeSignature(BODY, SECRET);
    expect(verifySignature(BODY, sig)).toBe(true);
  });

  it('不正な署名を拒否する', () => {
    expect(verifySignature(BODY, 'invalid-signature')).toBe(false);
  });

  it('改ざんされたボディを拒否する', () => {
    const sig = makeSignature(BODY, SECRET);
    expect(verifySignature('{"events":[{"tampered":true}]}', sig)).toBe(false);
  });
});
