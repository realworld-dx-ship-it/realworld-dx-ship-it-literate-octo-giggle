import { createClient } from '@supabase/supabase-js';

const BUCKET = 'receipt-images';

// Service Role Key が必要（Storage への書き込みはバイパスRLSが必要）
function getAdminClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY が未設定です');
  return createClient(url, key);
}

export async function uploadReceiptImage(
  imageBase64: string,
  department: string,
  date: string | null,
): Promise<string> {
  const supabase = getAdminClient();
  const yearMonth = date?.substring(0, 7) ?? new Date().toISOString().substring(0, 7);
  const fileName = `${department}/${yearMonth}/${Date.now()}.jpg`;
  const buffer = Buffer.from(imageBase64, 'base64');

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(fileName, buffer, { contentType: 'image/jpeg', upsert: false });

  if (error) throw new Error(`Storage upload failed: ${error.message}`);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(fileName);
  return data.publicUrl;
}
