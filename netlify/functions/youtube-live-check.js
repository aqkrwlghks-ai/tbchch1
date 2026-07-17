// 빛나는교회 유튜브 채널이 지금 실시간 방송 중인지 확인한다.
// YouTube Data API v3 search.list(eventType=live)를 사용 — 페이지 긁기 방식은
// Netlify 서버 IP에서 유튜브가 다른(축소) 페이지를 줘서 신뢰할 수 없었음.
// search.list는 호출당 100 유닛(기본 일일 할당량 10,000)을 쓰므로 캐시를 길게(15분) 둔다.
const CHANNEL_ID = "UCFEmEydneJGmF5DN9UYeTmA";
const API_KEY = process.env.YOUTUBE_API_KEY;

exports.handler = async function () {
  if (!API_KEY) {
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ live: false, videoId: null, error: "YOUTUBE_API_KEY not set" }),
    };
  }

  try {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${CHANNEL_ID}&eventType=live&type=video&key=${API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();

    const item = data.items && data.items[0];
    const live = !!item;
    const videoId = item ? item.id.videoId : null;

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=900",
      },
      body: JSON.stringify({ live, videoId }),
    };
  } catch (err) {
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ live: false, videoId: null, error: String(err) }),
    };
  }
};
