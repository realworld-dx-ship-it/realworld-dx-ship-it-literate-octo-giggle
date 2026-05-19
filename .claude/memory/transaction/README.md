# Memory / transaction — 取引記録テンプレート

このディレクトリは個々の取引（領収書・請求書・銀行明細）の処理記録を管理する。

## ファイル命名規則

```
YYYY-MM-DD_取引先_金額_部門.md
```

例：`2026-05-10_ガソリンスタンドABC_8800_car-sales.md`

## テンプレート

```markdown
# 取引記録

## 基本情報
- 日付：YYYY-MM-DD
- 取引先：
- 金額（税込）：円
- 消費税：円（税率：10% / 8% / 0%）
- 部門：car-sales / lease / subsc / used-car / common

## 仕訳下書き
- 借方科目：
- 貸方科目：
- 摘要：

## 証憑ファイル
- ファイルパス：./data/accounting/receipts/processed/YYYY-MM/

## 処理状態
- [ ] OCR完了
- [ ] 仕訳下書き生成
- [ ] freee登録
- [ ] 税理士確認済み

## 備考
（特記事項があれば記入）
```

## 集計ビュー

月次集計が必要な場合は `/ryoshusho-shori --summary YYYY-MM` を実行する。
