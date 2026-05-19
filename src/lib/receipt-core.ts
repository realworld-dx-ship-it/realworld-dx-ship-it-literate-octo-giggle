import OpenAI from 'openai';

export type Department = 'car-sales' | 'lease' | 'subsc' | 'used-car' | 'common';
export type TaxRate = '10%' | '8%' | '0%';

export interface ReceiptData {
  date: string | null;
  merchant: string | null;
  amount: number | null;
  taxAmount: number | null;
  taxRate: TaxRate | null;
  department: Department;
  description: string | null;
  confidence: number;
  rawText?: string;
}

// 部門判定キーワード辞書。実運用で .claude/memory/learning/dept_rules.md に蓄積していく
const DEPARTMENT_KEYWORDS: Record<Department, string[]> = {
  'car-sales': ['新車', 'ディーラー', '納車', '車両販売', 'トヨタ', 'ホンダ', '日産', 'マツダ', 'スバル'],
  'lease': ['リース', 'リース料', 'オリックス', '月額リース'],
  'subsc': ['サブスク', '月会費', '利用料', 'サービス料', '月額', 'サブスクリプション'],
  'used-car': ['中古車', '査定', '買取', 'オークション', 'ユーポス', 'ガリバー'],
  'common': [],
};

export async function processReceiptImage(imageBase64: string): Promise<ReceiptData> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: {
              url: `data:image/jpeg;base64,${imageBase64}`,
              detail: 'high',
            },
          },
          {
            type: 'text',
            text: `この領収書から以下の情報をJSONで抽出してください。
読み取れない項目はnullにしてください。金額はカンマなしの整数で返してください。
confidenceは0.0〜1.0で全体的な読み取り確度を示してください。

{
  "date": "YYYY-MM-DD形式、または null",
  "merchant": "取引先名、または null",
  "amount": 税込金額の整数、または null,
  "taxAmount": 消費税額の整数、または null,
  "taxRate": "10%" または "8%" または "0%"、または null,
  "description": "品目・摘要、または null",
  "confidence": 0.0〜1.0の数値
}

JSONのみを返してください。説明文は不要です。`,
          },
        ],
      },
    ],
    max_tokens: 500,
  });

  const content = response.choices[0].message.content ?? '';
  return parseOcrResponse(content);
}

function parseOcrResponse(content: string): ReceiptData {
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return buildFallbackResult(content);
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    const department = inferDepartment(parsed.merchant ?? '', parsed.description ?? '');
    return {
      date: parsed.date ?? null,
      merchant: parsed.merchant ?? null,
      amount: typeof parsed.amount === 'number' ? parsed.amount : null,
      taxAmount: typeof parsed.taxAmount === 'number' ? parsed.taxAmount : null,
      taxRate: parsed.taxRate ?? null,
      department,
      description: parsed.description ?? null,
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.5,
      rawText: content,
    };
  } catch {
    return buildFallbackResult(content);
  }
}

function inferDepartment(merchant: string, description: string): Department {
  const text = `${merchant} ${description}`;
  for (const [dept, keywords] of Object.entries(DEPARTMENT_KEYWORDS) as [Department, string[]][]) {
    if (dept === 'common') continue;
    if (keywords.some(kw => text.includes(kw))) return dept;
  }
  return 'common';
}

function buildFallbackResult(rawText: string): ReceiptData {
  return {
    date: null,
    merchant: null,
    amount: null,
    taxAmount: null,
    taxRate: null,
    department: 'common',
    description: null,
    confidence: 0,
    rawText,
  };
}

export function formatReceiptReply(data: ReceiptData): string {
  const confidenceLabel = data.confidence >= 0.8 ? '✅' : data.confidence >= 0.5 ? '⚠️' : '❌';
  const lines = [
    `${confidenceLabel} 領収書を読み取りました`,
    '',
    `📅 日付：${data.date ?? '読み取り不可'}`,
    `🏪 取引先：${data.merchant ?? '読み取り不可'}`,
    `💴 金額：${data.amount != null ? `${data.amount.toLocaleString()}円` : '読み取り不可'}`,
    `🏷️ 部門：${data.department}`,
    `📝 摘要：${data.description ?? '—'}`,
  ];

  if (data.confidence < 0.5) {
    lines.push('', '❌ 読み取り精度が低いです。鮮明な写真で再送してください。');
  } else if (data.confidence < 0.8) {
    lines.push('', '⚠️ 一部読み取れない項目があります。内容を確認してください。');
  }

  lines.push('', '✔ Supabase に保存しました。');
  return lines.join('\n');
}
