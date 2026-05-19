import { NextRequest, NextResponse } from 'next/server';
import { verifySignature, replyText, getImageAsBase64 } from '@/lib/line-client';
import { processReceiptImage, formatReceiptReply } from '@/lib/receipt-core';
import { uploadReceiptImage } from '@/lib/supabase-storage';
import { saveReceipt, getMonthlySummary, getPendingCount } from '@/lib/supabase-client';

// Vercel Pro で OCR の処理時間を許容する
export const maxDuration = 30;

export async function GET() {
  return NextResponse.json({ status: 'ok', service: 'ryoshusho-shori' });
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get('x-line-signature') ?? '';

  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const body = JSON.parse(rawBody) as { events: LineEvent[] };

  // LINE は 200 を素早く返すことを期待するため、処理は非同期で流す
  void Promise.all(body.events.map(handleEvent));

  return NextResponse.json({ ok: true });
}

// --- LINE イベント型 ---

interface LineEvent {
  type: string;
  replyToken?: string;
  message?: {
    type: string;
    id: string;
    text?: string;
  };
}

async function handleEvent(event: LineEvent): Promise<void> {
  if (!event.replyToken || event.type !== 'message') return;

  try {
    if (event.message?.type === 'image') {
      await handleImageMessage(event.replyToken, event.message.id);
    } else if (event.message?.type === 'text' && event.message.text) {
      await handleTextMessage(event.replyToken, event.message.text.trim());
    }
  } catch (err) {
    console.error('handleEvent error:', err);
    await replyText(event.replyToken, '⚠️ エラーが発生しました。もう一度お試しください。').catch(() => {});
  }
}

async function handleImageMessage(replyToken: string, messageId: string): Promise<void> {
  await replyText(replyToken, '📷 領収書を受け取りました。OCR処理中です…（10秒ほどかかります）');

  const imageBase64 = await getImageAsBase64(messageId);
  const ocrData = await processReceiptImage(imageBase64);

  let imageUrl: string | null = null;
  try {
    imageUrl = await uploadReceiptImage(imageBase64, ocrData.department, ocrData.date);
  } catch (err) {
    // 画像保存失敗は致命的ではない。OCR結果は保存する
    console.error('Storage upload failed:', err);
  }

  await saveReceipt(ocrData, imageUrl);

  // replyToken は1回しか使えないため、処理結果は別途 push か、
  // MVP段階ではユーザーが再度コマンドで確認する運用とする
  // TODO Phase 2: Push API で非同期返信に変更
  const replyText2 = formatReceiptReply(ocrData);
  console.log('OCR result (reply already sent):', replyText2);
}

async function handleTextMessage(replyToken: string, text: string): Promise<void> {
  const normalized = text.replace(/\s+/g, ' ');

  if (/^(ヘルプ|help|使い方)$/i.test(normalized)) {
    await replyText(replyToken, buildHelpMessage());
    return;
  }

  if (/^集計( \d{4}-\d{2})?$/.test(normalized)) {
    const monthMatch = normalized.match(/(\d{4}-\d{2})/);
    const month = monthMatch?.[1] ?? currentYearMonth();
    await replyText(replyToken, await buildSummaryMessage(month));
    return;
  }

  if (normalized === '未処理') {
    await replyText(replyToken, await buildPendingMessage());
    return;
  }

  await replyText(replyToken, '領収書の写真を送ってください📷\n\nコマンド一覧は「ヘルプ」と送ると確認できます。');
}

// --- メッセージ生成ヘルパー ---

function buildHelpMessage(): string {
  return [
    '📖 使い方',
    '',
    '📷 領収書の写真を送る',
    '　→ OCRで自動抽出してSupabaseに保存',
    '',
    '「集計」',
    '　→ 今月の部門別サマリー',
    '',
    '「集計 2026-05」',
    '　→ 指定月のサマリー',
    '',
    '「未処理」',
    '　→ 税理士未共有の件数確認',
    '',
    '「ヘルプ」',
    '　→ このメッセージ',
  ].join('\n');
}

async function buildSummaryMessage(month: string): Promise<string> {
  const rows = await getMonthlySummary(month);

  if (rows.length === 0) {
    return `📊 ${month} の領収書データがまだありません。`;
  }

  const totalAmount = rows.reduce((sum, r) => sum + (r.total_amount ?? 0), 0);
  const lines = [
    `📊 ${month} 部門別サマリー`,
    '',
    ...rows.map(r =>
      `${r.department}：${(r.total_amount ?? 0).toLocaleString()}円（${r.count}件）`
    ),
    '',
    `合計：${totalAmount.toLocaleString()}円`,
  ];

  return lines.join('\n');
}

async function buildPendingMessage(): Promise<string> {
  const rows = await getPendingCount();

  if (rows.length === 0) {
    return '✅ 税理士未共有の領収書はありません。';
  }

  const lines = [
    '📋 税理士未共有の領収書',
    '',
    ...rows.map(r =>
      `${r.month}：${r.pending_count}件（${(r.pending_amount ?? 0).toLocaleString()}円）`
    ),
    '',
    '税理士に共有したら Supabase で shared_with_accountant を true に更新してください。',
  ];

  return lines.join('\n');
}

function currentYearMonth(): string {
  return new Date().toISOString().substring(0, 7);
}
