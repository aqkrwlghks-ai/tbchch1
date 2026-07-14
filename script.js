// 네비게이션 모바일 토글
const navToggle = document.getElementById('navToggle');
const nav = document.getElementById('nav');
navToggle.addEventListener('click', () => nav.classList.toggle('open'));
nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => nav.classList.remove('open')));

// data-bind="a.b.c" 경로로 JSON 값을 DOM에 채워넣는다
function applyBindings(root, data) {
  root.querySelectorAll('[data-bind]').forEach(el => {
    const path = el.getAttribute('data-bind').split('.');
    let value = data;
    for (const key of path) {
      value = value ? value[key] : undefined;
    }
    if (value !== undefined) el.textContent = value;
  });
}

function renderParagraphs(container, text) {
  container.innerHTML = '';
  text.split('\n\n').forEach(block => {
    if (!block.trim()) return;
    const p = document.createElement('p');
    p.innerHTML = block.replace(/\n/g, '<br>');
    container.appendChild(p);
  });
}

fetch('content/site.json')
  .then(res => res.json())
  .then(data => {
    applyBindings(document, data);

    // 인사말 본문 (문단 나누기)
    renderParagraphs(document.getElementById('about-message'), data.about.message);

    // 예배안내 테이블
    const worshipTbody = document.getElementById('worship-tbody');
    worshipTbody.innerHTML = '';
    data.worship.forEach(item => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${item.name}</td><td>${item.time}</td>`;
      worshipTbody.appendChild(tr);
    });

    // 빠른링크 예배시간 요약(1부/2부만)
    const w1 = data.worship[0], w2 = data.worship[1];
    if (w1 && w2) {
      document.getElementById('qcard-worship').textContent =
        `${w1.name.replace('주일예배 ', '')} ${w1.time} · ${w2.name.replace('주일예배 ', '')} ${w2.time}`;
    }

    // 설교 영상
    const iframe = document.getElementById('sermon-iframe');
    iframe.src = `https://www.youtube.com/embed/videoseries?list=${data.sermon.youtube_playlist_id}`;
    document.getElementById('sermon-channel-link').href = data.sermon.youtube_channel_url;

    // 갤러리 (구글드라이브 링크)
    const galleryList = document.getElementById('gallery-list');
    galleryList.innerHTML = '';
    if (data.gallery && data.gallery.length > 0) {
      data.gallery.forEach(item => {
        const li = document.createElement('li');
        li.innerHTML = `<a href="${item.drive_url}" target="_blank" rel="noopener">📁 ${item.title}</a>`;
        galleryList.appendChild(li);
      });
    } else {
      galleryList.innerHTML = '<li class="gallery-empty">등록된 자료가 아직 없습니다.</li>';
    }

    // 매일 묵상 말씀 팝업
    showDailyVerse(data.daily_verses);
  })
  .catch(err => console.error('site.json 로드 실패:', err));

function showDailyVerse(verses) {
  if (!verses || verses.length === 0) return;

  const todayStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  if (localStorage.getItem('verseModalDismissed') === todayStr) return;

  // 오늘 날짜(연중 일수) 기준으로 말씀 목록을 순환하며 하나 선택
  const start = new Date(new Date().getFullYear(), 0, 0);
  const diff = new Date() - start;
  const dayOfYear = Math.floor(diff / 86400000);
  const verse = verses[dayOfYear % verses.length];

  const modal = document.getElementById('verseModal');
  document.getElementById('verseModalText').textContent = `“${verse.text}”`;
  document.getElementById('verseModalRef').textContent = verse.reference || '';
  modal.hidden = false;

  const close = () => {
    if (document.getElementById('verseModalHideToday').checked) {
      localStorage.setItem('verseModalDismissed', todayStr);
    }
    modal.hidden = true;
  };

  document.getElementById('verseModalClose').addEventListener('click', close);
  document.getElementById('verseModalBackdrop').addEventListener('click', close);
  document.addEventListener('keydown', function escClose(e) {
    if (e.key === 'Escape') { close(); document.removeEventListener('keydown', escClose); }
  });
}

fetch('content/notices.json')
  .then(res => res.json())
  .then(data => {
    const list = document.getElementById('notice-list');
    list.innerHTML = '';
    data.notices
      .slice()
      .sort((a, b) => (a.date < b.date ? 1 : -1))
      .forEach(n => {
        const li = document.createElement('li');
        li.innerHTML = `<span class="notice-date">${n.date}</span><span class="notice-title">${n.title}</span>`;
        list.appendChild(li);
      });
  })
  .catch(err => console.error('notices.json 로드 실패:', err));
