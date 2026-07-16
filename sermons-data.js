// 말씀과 찬양 데이터 CRUD (Supabase). 읽기는 누구나, 쓰기/수정/삭제는 관리자만 가능(RLS로 서버에서 강제).
async function fetchSermons(category) {
  const sb = getSupabaseClient();
  if (!sb) return [];
  let query = sb.from("sermons").select("*").order("date", { ascending: false });
  if (category) query = query.eq("category", category);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

async function fetchSermonById(id) {
  const sb = requireSupabaseClient();
  const { data, error } = await sb.from("sermons").select("*").eq("id", id).single();
  if (error) throw error;
  return data;
}

async function createSermon(payload) {
  const sb = requireSupabaseClient();
  const { data, error } = await sb.from("sermons").insert(payload).select().single();
  if (error) throw error;
  return data;
}

async function updateSermon(id, payload) {
  const sb = requireSupabaseClient();
  const { error } = await sb.from("sermons").update(payload).eq("id", id);
  if (error) throw error;
}

async function deleteSermon(id) {
  const sb = requireSupabaseClient();
  const { error } = await sb.from("sermons").delete().eq("id", id);
  if (error) throw error;
}
