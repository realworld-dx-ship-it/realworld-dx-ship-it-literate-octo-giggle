const { createClient } = require("@supabase/supabase-js");

function getClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL / SUPABASE_ANON_KEY が未設定です");
  return createClient(url, key);
}

async function saveReceipt(data, imageUrl) {
  const supabase = getClient();
  const { data: row, error } = await supabase
    .from("receipts")
    .insert({
      date: data.date,
      merchant: data.merchant,
      amount: data.amount,
      tax_amount: data.taxAmount,
      tax_rate: data.taxRate,
      department: data.department,
      description: data.description,
      image_url: imageUrl ?? null,
      confidence: data.confidence,
      shared_with_accountant: false,
      raw_text: data.rawText,
    })
    .select("id")
    .single();

  if (error) throw new Error(`Supabase insert failed: ${error.message}`);
  return row.id;
}

async function getMonthlySummary(month) {
  const supabase = getClient();
  const { data, error } = await supabase
    .from("v_monthly_summary")
    .select("*")
    .eq("month", month);
  if (error) throw new Error(`Query failed: ${error.message}`);
  return data ?? [];
}

async function getPendingCount() {
  const supabase = getClient();
  const { data, error } = await supabase
    .from("v_pending_share")
    .select("*")
    .order("month", { ascending: false })
    .limit(3);
  if (error) throw new Error(`Query failed: ${error.message}`);
  return data ?? [];
}

module.exports = { saveReceipt, getMonthlySummary, getPendingCount };
