import { createClient } from '@supabase/supabase-js';
import type { ReceiptData } from './receipt-core';

export interface ReceiptRecord {
  id?: string;
  date: string | null;
  merchant: string | null;
  amount: number | null;
  tax_amount: number | null;
  tax_rate: string | null;
  department: string;
  description: string | null;
  image_url: string | null;
  confidence: number;
  shared_with_accountant: boolean;
  raw_text?: string;
  created_at?: string;
}

function getClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('SUPABASE_URL / SUPABASE_ANON_KEY が未設定です');
  return createClient(url, key);
}

export async function saveReceipt(data: ReceiptData, imageUrl: string | null): Promise<string> {
  const supabase = getClient();
  const record: ReceiptRecord = {
    date: data.date,
    merchant: data.merchant,
    amount: data.amount,
    tax_amount: data.taxAmount,
    tax_rate: data.taxRate,
    department: data.department,
    description: data.description,
    image_url: imageUrl,
    confidence: data.confidence,
    shared_with_accountant: false,
    raw_text: data.rawText,
  };

  const { data: row, error } = await supabase
    .from('receipts')
    .insert(record)
    .select('id')
    .single();

  if (error) throw new Error(`Supabase insert failed: ${error.message}`);
  return row.id;
}

export interface MonthlySummaryRow {
  month: string;
  department: string;
  count: number;
  total_amount: number;
  total_tax: number;
}

export async function getMonthlySummary(month: string): Promise<MonthlySummaryRow[]> {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('v_monthly_summary')
    .select('*')
    .eq('month', month);

  if (error) throw new Error(`Supabase query failed: ${error.message}`);
  return (data ?? []) as MonthlySummaryRow[];
}

export interface PendingRow {
  month: string;
  pending_count: number;
  pending_amount: number;
}

export async function getPendingCount(): Promise<PendingRow[]> {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('v_pending_share')
    .select('*')
    .order('month', { ascending: false })
    .limit(3);

  if (error) throw new Error(`Supabase query failed: ${error.message}`);
  return (data ?? []) as PendingRow[];
}
