// 홈페이지 갤러리 폴더 안의 최근 사진들을 최신순으로 가져온다.
// 실제 폴더 구조: 최상위 폴더 → 카테고리 폴더(교회학교/예배사진/청소년&청년/행사사진) → 날짜별 행사 폴더 → 사진 파일
// API 키는 절대 코드에 넣지 않고 Netlify 환경변수(GOOGLE_DRIVE_API_KEY)로만 읽는다.
const PARENT_FOLDER_ID = "1tbcejmqyzPM94zowqFwv12ZYml3LMRkU";
const MAX_PHOTOS = 16;
const MAX_RECENT_EVENT_FOLDERS = 8;

async function driveList(query, apiKey, fields) {
  const url = `https://www.googleapis.com/drive/v3/files?${new URLSearchParams({
    q: query,
    fields,
    pageSize: "200",
    key: apiKey,
  })}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || "Drive API error");
  return data.files || [];
}

function isFolder(f) {
  return f.mimeType === "application/vnd.google-apps.folder";
}
function isImage(f) {
  return f.mimeType && f.mimeType.startsWith("image/");
}

exports.handler = async function () {
  const apiKey = process.env.GOOGLE_DRIVE_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: "GOOGLE_DRIVE_API_KEY 환경변수가 설정되지 않았습니다." }) };
  }

  try {
    const fields = "files(id,name,mimeType,thumbnailLink,webViewLink,createdTime)";

    // 1) 최상위 폴더 바로 아래 항목 (카테고리 폴더들 + 혹시 있을 직속 이미지)
    const level1 = await driveList(`'${PARENT_FOLDER_ID}' in parents and trashed = false`, apiKey, fields);
    const categoryFolders = level1.filter(isFolder);
    let pool = level1.filter(isImage);

    // 2) 각 카테고리 폴더 아래 항목 (날짜별 행사 폴더들 + 혹시 있을 직속 이미지)
    const level2Lists = await Promise.all(
      categoryFolders.map(f => driveList(`'${f.id}' in parents and trashed = false`, apiKey, fields))
    );
    const level2 = level2Lists.flat();
    pool = pool.concat(level2.filter(isImage));
    const eventFolders = level2.filter(isFolder);

    // 3) 최근 생성된 행사 폴더 위주로만 실제 사진을 가져온다 (전체를 다 훑지 않음)
    eventFolders.sort((a, b) => new Date(b.createdTime) - new Date(a.createdTime));
    const recentEventFolders = eventFolders.slice(0, MAX_RECENT_EVENT_FOLDERS);

    const level3Lists = await Promise.all(
      recentEventFolders.map(f => driveList(`'${f.id}' in parents and trashed = false`, apiKey, fields))
    );
    pool = pool.concat(level3Lists.flat().filter(isImage));

    pool.sort((a, b) => new Date(b.createdTime) - new Date(a.createdTime));

    const result = pool.slice(0, MAX_PHOTOS).map(p => ({
      id: p.id,
      name: p.name,
      thumb: p.thumbnailLink ? p.thumbnailLink.replace(/=s\d+$/, "=s600") : null,
      link: p.webViewLink,
      createdTime: p.createdTime,
    }));

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=900" },
      body: JSON.stringify({ photos: result }),
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: String(err) }) };
  }
};
