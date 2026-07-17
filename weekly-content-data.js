// 주간말씀(설교인포그래픽/주간묵상집/소그룹나눔) CRUD.
// 읽기는 누구나, 쓰기는 카테고리별로 RLS가 서버에서 강제한다:
//  - infographic/weekly: 관리자(is_admin)만 쓰기 가능
//  - share: 로그인 없이 누구나 insert 가능(성도 자유게시판), 삭제는 관리자만(부적절한 글 관리)
async function fetchWeeklyContent(category) {
  const sb = getSupabaseClient();
  if (!sb) return [];
  let query = sb.from("weekly_content").select("*").order("period", { ascending: false }).order("created_at", { ascending: false });
  if (category) query = query.eq("category", category);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

async function createWeeklyContent(payload) {
  const sb = requireSupabaseClient();
  const { data, error } = await sb.from("weekly_content").insert(payload).select().single();
  if (error) throw error;
  return data;
}

async function updateWeeklyContent(id, payload) {
  const sb = requireSupabaseClient();
  const { error } = await sb.from("weekly_content").update(payload).eq("id", id);
  if (error) throw error;
}

async function deleteWeeklyContent(id) {
  const sb = requireSupabaseClient();
  const { error } = await sb.from("weekly_content").delete().eq("id", id);
  if (error) throw error;
}
