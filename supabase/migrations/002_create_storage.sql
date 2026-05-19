-- Supabase Storage バケット設定
-- Supabase ダッシュボード Storage タブで実行するか、
-- supabase CLI (supabase db push) で適用する

-- バケット作成（Storage API 経由で作成する場合は不要）
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipt-images', 'receipt-images', true)
ON CONFLICT (id) DO NOTHING;

-- バケットのポリシー：authenticated ユーザーのみアップロード可
-- MVP段階では Service Role Key を使うためポリシーは最小限

CREATE POLICY "Service role can upload"
  ON storage.objects FOR INSERT
  TO service_role
  WITH CHECK (bucket_id = 'receipt-images');

CREATE POLICY "Public read"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'receipt-images');
