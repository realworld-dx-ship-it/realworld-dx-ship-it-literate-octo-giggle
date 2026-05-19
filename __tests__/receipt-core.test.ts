import { formatReceiptReply } from '../src/lib/receipt-core';
import type { ReceiptData } from '../src/lib/receipt-core';

const BASE: ReceiptData = {
  date: '2026-05-10',
  merchant: 'ガソリンスタンドABC',
  amount: 8800,
  taxAmount: 800,
  taxRate: '10%',
  department: 'car-sales',
  description: 'ガソリン代',
  confidence: 0.95,
};

describe('formatReceiptReply', () => {
  it('高確度の場合は ✅ マーク', () => {
    const reply = formatReceiptReply(BASE);
    expect(reply).toContain('✅');
    expect(reply).toContain('8,800円');
    expect(reply).toContain('car-sales');
    expect(reply).toContain('2026-05-10');
  });

  it('中確度（0.6）の場合は ⚠️ マーク', () => {
    const reply = formatReceiptReply({ ...BASE, confidence: 0.6 });
    expect(reply).toContain('⚠️');
  });

  it('低確度（0.3）の場合は ❌ マーク＋警告', () => {
    const reply = formatReceiptReply({ ...BASE, confidence: 0.3 });
    expect(reply).toContain('❌');
    expect(reply).toContain('再送してください');
  });

  it('null 項目を「読み取り不可」と表示', () => {
    const reply = formatReceiptReply({ ...BASE, date: null, merchant: null, amount: null });
    expect(reply).toMatch(/日付：読み取り不可/);
    expect(reply).toMatch(/取引先：読み取り不可/);
    expect(reply).toMatch(/金額：読み取り不可/);
  });
});
