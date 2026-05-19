-- receipts テーブル
CREATE TABLE IF NOT EXISTS receipts (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date                  DATE,
  merchant              TEXT,
  amount                INTEGER,             -- 税込金額（円）
  tax_amount            INTEGER,             -- 消費税額（円）
  tax_rate              TEXT,                -- '10%' / '8%' / '0%'
  department            TEXT NOT NULL CHECK (
    department IN ('car-sales', 'lease', 'subsc', 'used-car', 'common')
  ),
  description           TEXT,
  image_url             TEXT,
  confidence            DECIMAL(3,2),        -- OCR確度 0.00〜1.00
  shared_with_accountant BOOLEAN NOT NULL DEFAULT FALSE,
  raw_text              TEXT,                -- OCRの生テキスト（デバッグ用）
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_receipts_date       ON receipts(date);
CREATE INDEX IF NOT EXISTS idx_receipts_department ON receipts(department);
CREATE INDEX IF NOT EXISTS idx_receipts_shared     ON receipts(shared_with_accountant);
CREATE INDEX IF NOT EXISTS idx_receipts_created    ON receipts(created_at);

-- 月次・部門別サマリービュー（/cashflow-review や「集計」コマンドが参照）
CREATE OR REPLACE VIEW v_monthly_summary AS
SELECT
  TO_CHAR(date, 'YYYY-MM')  AS month,
  department,
  COUNT(*)                   AS count,
  SUM(amount)                AS total_amount,
  SUM(tax_amount)            AS total_tax,
  ROUND(AVG(confidence), 2)  AS avg_confidence
FROM receipts
WHERE date IS NOT NULL
GROUP BY TO_CHAR(date, 'YYYY-MM'), department
ORDER BY month DESC, department;

-- 税理士未共有ビュー（「未処理」コマンドが参照）
CREATE OR REPLACE VIEW v_pending_share AS
SELECT
  TO_CHAR(date, 'YYYY-MM')  AS month,
  COUNT(*)                   AS pending_count,
  SUM(amount)                AS pending_amount
FROM receipts
WHERE shared_with_accountant = FALSE
  AND date IS NOT NULL
GROUP BY TO_CHAR(date, 'YYYY-MM')
ORDER BY month DESC;
