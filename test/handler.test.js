const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { buildReply } = require("../src/handler");
const { parseOcrResponse, inferDepartment, formatReceiptReply } = require("../src/lib/receipt-core");

describe("buildReply", () => {
  it("returns a LINE text message object for unknown input", () => {
    const reply = buildReply("hello");
    assert.strictEqual(reply.type, "text");
    assert.ok(reply.text.includes("ヘルプ"));
  });

  it("handles empty string", () => {
    const reply = buildReply("");
    assert.strictEqual(reply.type, "text");
  });
});

describe("inferDepartment", () => {
  it("detects car-sales from トヨタ", () => {
    assert.strictEqual(inferDepartment("トヨタ販売店", ""), "car-sales");
  });

  it("detects lease from リース", () => {
    assert.strictEqual(inferDepartment("オリックス自動車", "リース料"), "lease");
  });

  it("detects used-car from 中古車", () => {
    assert.strictEqual(inferDepartment("中古車センター", "査定"), "used-car");
  });

  it("falls back to common for unknown merchant", () => {
    assert.strictEqual(inferDepartment("コンビニXYZ", "ペン"), "common");
  });
});

describe("parseOcrResponse", () => {
  it("parses valid JSON from OCR content", () => {
    const content = JSON.stringify({
      date: "2026-05-10",
      merchant: "ガソリンスタンドABC",
      amount: 8800,
      taxAmount: 800,
      taxRate: "10%",
      description: "ガソリン代",
      confidence: 0.95,
    });
    const result = parseOcrResponse(content);
    assert.strictEqual(result.date, "2026-05-10");
    assert.strictEqual(result.amount, 8800);
    assert.strictEqual(result.confidence, 0.95);
    assert.strictEqual(result.department, "common");
  });

  it("returns fallback for invalid JSON", () => {
    const result = parseOcrResponse("not json at all");
    assert.strictEqual(result.department, "common");
    assert.strictEqual(result.confidence, 0);
    assert.strictEqual(result.amount, null);
  });
});

describe("formatReceiptReply", () => {
  const base = {
    date: "2026-05-10", merchant: "ABC", amount: 8800,
    taxAmount: 800, taxRate: "10%", department: "car-sales",
    description: "ガソリン代", confidence: 0.95,
  };

  it("shows ✅ for high confidence", () => {
    assert.ok(formatReceiptReply(base).includes("✅"));
  });

  it("shows ⚠️ for medium confidence", () => {
    assert.ok(formatReceiptReply({ ...base, confidence: 0.6 }).includes("⚠️"));
  });

  it("shows ❌ for low confidence", () => {
    assert.ok(formatReceiptReply({ ...base, confidence: 0.3 }).includes("❌"));
  });

  it("shows 読み取り不可 for null amount", () => {
    assert.ok(formatReceiptReply({ ...base, amount: null }).includes("読み取り不可"));
  });
});
