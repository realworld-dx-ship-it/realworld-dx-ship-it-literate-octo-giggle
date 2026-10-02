const OpenAI = require("openai");

// 部門判定キーワード。.claude/memory/learning/dept_rules.md に蓄積していく
const DEPARTMENT_KEYWORDS = {
  "car-sales": ["新車", "ディーラー", "納車", "車両販売", "トヨタ", "ホンダ", "日産", "マツダ", "スバル"],
  "lease": ["リース", "リース料", "オリックス自動車", "月額リース"],
  "subsc": ["サブスク", "月会費", "利用料", "サービス料", "サブスクリプション"],
  "used-car": ["中古車", "査定", "買取", "オークション", "ガリバー", "ユーポス"],
};

async function processReceiptImage(imageBase64) {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const response = await client.chat.completions.create({
    model: "gpt-4o",
    messages: [{
      role: "user",
      content: [
        {
          type: "image_url",
          image_url: { url: `data:image/jpeg;base64,${imageBase64}`, detail: "high" },
        },
        {
          type: "text",
          text: `この領収書から以下の情報をJSONで抽出してください。
読み取れない項目はnullにしてください。金額はカンマなしの整数で返してください。
confidenceは0.0〜1.0で全体的な読み取り確度を示してください。

{
  "date": "YYYY-MM-DD形式、または null",
  "merchant": "取引先名、または null",
  "amount": 税込金額の整数または null,
  "taxAmount": 消費税額の整数または null,
  "taxRate": "10%" または "8%" または "0%"、または null,
  "description": "品目・摘要、または null",
  "confidence": 0.0〜1.0の数値
}

JSONのみを返してください。説明文は不要です。`,
        },
      ],
    }],
    max_tokens: 500,
  });

  const content = response.choices[0].message.content ?? "";
  return parseOcrResponse(content);
}

function parseOcrResponse(content) {
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return buildFallback(content);

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      date: parsed.date ?? null,
      merchant: parsed.merchant ?? null,
      amount: typeof parsed.amount === "number" ? parsed.amount : null,
      taxAmount: typeof parsed.taxAmount === "number" ? parsed.taxAmount : null,
      taxRate: parsed.taxRate ?? null,
      department: inferDepartment(parsed.merchant ?? "", parsed.description ?? ""),
      description: parsed.description ?? null,
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.5,
      rawText: content,
    };
  } catch {
    return buildFallback(content);
  }
}

function inferDepartment(merchant, description) {
  const text = `${merchant} ${description}`;
  for (const [dept, keywords] of Object.entries(DEPARTMENT_KEYWORDS)) {
    if (keywords.some((kw) => text.includes(kw))) return dept;
  }
  return "common";
}

function buildFallback(rawText) {
  return {
    date: null, merchant: null, amount: null, taxAmount: null,
    taxRate: null, department: "common", description: null,
    confidence: 0, rawText,
  };
}

function formatReceiptReply(data) {
  const icon = data.confidence >= 0.8 ? "✅" : data.confidence >= 0.5 ? "⚠️" : "❌";
  const lines = [
    `${icon} 領収書を読み取りました`,
    "",
    `📅 日付：${data.date ?? "読み取り不可"}`,
    `🏪 取引先：${data.merchant ?? "読み取り不可"}`,
    `💴 金額：${data.amount != null ? `${data.amount.toLocaleString("ja-JP")}円` : "読み取り不可"}`,
    `🏷️ 部門：${data.department}`,
    `📝 摘要：${data.description ?? "—"}`,
    "",
    "✔ Supabaseに保存しました。",
  ];

  if (data.confidence < 0.5) {
    lines.push("", "❌ 読み取り精度が低いです。鮮明な写真で再送してください。");
  } else if (data.confidence < 0.8) {
    lines.push("", "⚠️ 一部読み取れない項目があります。内容を確認してください。");
  }

  return lines.join("\n");
}

module.exports = { processReceiptImage, formatReceiptReply, parseOcrResponse, inferDepartment };
