/**
 * CLI版 領収書処理スクリプト
 * 使い方: npx ts-node src/process-receipt.ts <画像パス> [--save]
 *
 * --save: Supabase への保存もあわせて行う
 */
import * as fs from 'fs';
import * as path from 'path';
import { processReceiptImage, formatReceiptReply } from './lib/receipt-core';
import { uploadReceiptImage } from './lib/supabase-storage';
import { saveReceipt } from './lib/supabase-client';

async function main() {
  const args = process.argv.slice(2);
  const imagePath = args.find(a => !a.startsWith('--'));
  const shouldSave = args.includes('--save');

  if (!imagePath) {
    console.error('使い方: npx ts-node src/process-receipt.ts <画像パス> [--save]');
    process.exit(1);
  }

  const absPath = path.resolve(imagePath);
  if (!fs.existsSync(absPath)) {
    console.error(`ファイルが見つかりません: ${absPath}`);
    process.exit(1);
  }

  console.log(`処理中: ${absPath}`);
  const imageBase64 = fs.readFileSync(absPath).toString('base64');
  const data = await processReceiptImage(imageBase64);

  console.log('\n--- OCR結果 ---');
  console.log(formatReceiptReply(data));

  if (shouldSave) {
    console.log('\nSupabase に保存中...');
    let imageUrl: string | null = null;
    try {
      imageUrl = await uploadReceiptImage(imageBase64, data.department, data.date);
      console.log(`画像URL: ${imageUrl}`);
    } catch (err) {
      console.warn('画像保存失敗（OCR結果は保存します）:', err);
    }
    const id = await saveReceipt(data, imageUrl);
    console.log(`✅ 保存完了 ID: ${id}`);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
