import * as crypto from 'crypto';

const LINE_API = 'https://api.line.me/v2/bot';

export function verifySignature(rawBody: string, signature: string): boolean {
  const secret = process.env.LINE_CHANNEL_SECRET ?? '';
  const digest = crypto.createHmac('SHA256', secret).update(rawBody).digest('base64');
  return digest === signature;
}

export async function replyText(replyToken: string, text: string): Promise<void> {
  const res = await fetch(`${LINE_API}/message/reply`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      replyToken,
      messages: [{ type: 'text', text }],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`LINE reply failed: ${res.status} ${body}`);
  }
}

export async function getImageAsBase64(messageId: string): Promise<string> {
  const res = await fetch(`${LINE_API}/message/${messageId}/content`, {
    headers: { Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}` },
  });

  if (!res.ok) {
    throw new Error(`LINE image fetch failed: ${res.status}`);
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  return buffer.toString('base64');
}
