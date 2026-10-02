const line = require("@line/bot-sdk");
const { processReceiptImage, formatReceiptReply } = require("./lib/receipt-core");
const { saveReceipt, getMonthlySummary, getPendingCount } = require("./lib/supabase-client");

async function handleEvent(event, config) {
  const client = new line.messagingApi.MessagingApiClient({
    channelAccessToken: config.channelAccessToken,
  });

  if (event.type !== "message") return null;

  if (event.message.type === "image") {
    return handleImageMessage(client, event);
  }

  if (event.message.type === "text") {
    return handleTextMessage(client, event);
  }

  return null;
}

async function handleImageMessage(client, event) {
  let ocrData;
  try {
    const imageBase64 = await downloadImageAsBase64(event.message.id);
    ocrData = await processReceiptImage(imageBase64);
    await saveReceipt(ocrData, null);
  } catch (err) {
    console.error("Image processing error:", err);
    return client.replyMessage({
      replyToken: event.replyToken,
      messages: [{ type: "text", text: "⚠️ 処理中にエラーが発生しました。もう一度お試しください。" }],
    });
  }

  return client.replyMessage({
    replyToken: event.replyToken,
    messages: [{ type: "text", text: formatReceiptReply(ocrData) }],
  });
}

async function handleTextMessage(client, event) {
  const text = event.message.text.trim();
  let reply;

  if (/^(ヘルプ|help|使い方)$/i.test(text)) {
    reply = buildHelpMessage();
  } else if (/^集計( \d{4}-\d{2})?$/.test(text)) {
    const match = text.match(/(\d{4}-\d{2})/);
    const month = match ? match[1] : currentYearMonth();
    reply = await buildSummaryMessage(month);
  } else if (text === "未処理") {
    reply = await buildPendingMessage();
  } else {
    reply = buildReply(text).text;
  }

  return client.replyMessage({
    replyToken: event.replyToken,
    messages: [{ type: "text", text: reply }],
  });
}

// LINE API から画像を取得して base64 に変換
async function downloadImageAsBase64(messageId) {
  const res = await fetch(
    `https://api-data.line.me/v2/bot/message/${messageId}/content`,
    { headers: { Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}` } }
  );
  if (!res.ok) throw new Error(`LINE image fetch failed: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  return buf.toString("base64");
}

function buildHelpMessage() {
  return [
    "📖 使い方",
    "",
    "📷 領収書の写真を送る",
    "　→ OCRで自動抽出してSupabaseに保存",
    "",
    "「集計」",
    "　→ 今月の部門別サマリー",
    "",
    "「集計 2026-05」",
    "　→ 指定月のサマリー",
    "",
    "「未処理」",
    "　→ 税理士未共有の件数確認",
    "",
    "「ヘルプ」",
    "　→ このメッセージ",
  ].join("\n");
}

async function buildSummaryMessage(month) {
  const rows = await getMonthlySummary(month);
  if (rows.length === 0) return `📊 ${month} の領収書データがまだありません。`;

  const total = rows.reduce((s, r) => s + (r.total_amount ?? 0), 0);
  return [
    `📊 ${month} 部門別サマリー`,
    "",
    ...rows.map((r) => `${r.department}：${(r.total_amount ?? 0).toLocaleString("ja-JP")}円（${r.count}件）`),
    "",
    `合計：${total.toLocaleString("ja-JP")}円`,
  ].join("\n");
}

async function buildPendingMessage() {
  const rows = await getPendingCount();
  if (rows.length === 0) return "✅ 税理士未共有の領収書はありません。";

  return [
    "📋 税理士未共有の領収書",
    "",
    ...rows.map((r) => `${r.month}：${r.pending_count}件（${(r.pending_amount ?? 0).toLocaleString("ja-JP")}円）`),
    "",
    "Supabaseで shared_with_accountant を true にすると件数が減ります。",
  ].join("\n");
}

function buildReply(text) {
  return {
    type: "text",
    text: `領収書の写真を送ってください📷\n\nコマンド一覧は「ヘルプ」と送ると確認できます。\n（受信：${text}）`,
  };
}

function currentYearMonth() {
  return new Date().toISOString().substring(0, 7);
}

module.exports = { handleEvent, buildReply };
