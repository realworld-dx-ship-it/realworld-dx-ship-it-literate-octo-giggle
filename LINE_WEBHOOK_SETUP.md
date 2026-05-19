# LINE Webhook セットアップ手順

このドキュメントは Sprint 1（1-5〜1-7）の手順書です。

---

## 前提条件

- [ ] Vercel にデプロイ済み（本番URLを取得済み）
- [ ] Supabase プロジェクトが稼働中
- [ ] `001_create_receipts.sql` と `002_create_storage.sql` を実行済み

---

## Step 1：LINE チャネル作成

1. [LINE Developers コンソール](https://developers.line.biz/) にログイン
2. 「プロバイダーを作成」→ 会社名「Real World株式会社」
3. 「Messaging API チャネル」を作成
   - チャネル名：`Real World 経理ボット`
   - 業種：「法人・サービス > 会計・経理」
4. 作成後、以下をメモする：
   - `LINE_CHANNEL_SECRET`（チャネル基本設定 > チャネルシークレット）
   - `LINE_CHANNEL_ACCESS_TOKEN`（Messaging API設定 > チャネルアクセストークン）

---

## Step 2：Vercel 環境変数を設定

Vercel ダッシュボード → プロジェクト → Settings → Environment Variables

| 変数名 | 値の取得元 |
|--------|----------|
| `OPENAI_API_KEY` | OpenAI ダッシュボード |
| `SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `SUPABASE_ANON_KEY` | Supabase → Settings → API → anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role |
| `LINE_CHANNEL_SECRET` | LINE Developers → チャネル基本設定 |
| `LINE_CHANNEL_ACCESS_TOKEN` | LINE Developers → Messaging API設定 |

設定後「Redeploy」する。

---

## Step 3：Webhook URL を設定

1. LINE Developers → Messaging API設定 → Webhook URL
2. 以下を入力：
   ```
   https://あなたのVercelドメイン.vercel.app/api/line-webhook
   ```
3. 「検証」ボタンをクリック → 「成功」と表示されれば OK

---

## Step 4：応答メッセージを無効化

Messaging API設定 → 「応答メッセージ」をオフにする
（デフォルトの自動応答がボットの返信と被るため）

---

## Step 5：動作確認

1. LINE アプリでボットの QR コードを読み取り、友だち追加
2. 「ヘルプ」と送信 → ヘルプメッセージが返れば成功
3. 領収書の写真を送信 → 10秒以内にOCR結果が返れば成功
4. Supabase テーブルの `receipts` に行が増えていることを確認

---

## トラブルシューティング

### Webhook 検証が「失敗」になる

- Vercel のデプロイが完了しているか確認
- `GET /api/line-webhook` で `{"status":"ok"}` が返るか確認
  ```bash
  curl https://あなたのドメイン.vercel.app/api/line-webhook
  ```

### OCR結果が返ってこない

- Vercel のログ（Functions タブ）でエラーを確認
- `OPENAI_API_KEY` が正しく設定されているか確認
- 写真が鮮明か確認（手ぶれ・暗いと精度低下）

### Supabase に保存されない

- `SUPABASE_URL` と `SUPABASE_ANON_KEY` を確認
- `receipts` テーブルが存在するか確認
  ```sql
  SELECT COUNT(*) FROM receipts;
  ```
