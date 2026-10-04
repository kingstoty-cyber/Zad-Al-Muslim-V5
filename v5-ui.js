/* زاد المسلم v5 — واجهة هادئة ذات أولوية للمحتوى */
(function () {
  'use strict';

  const baseAdhkar = window.renderAdhkar;
  const baseLoadTab = window.loadTab;

  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const arabicTime = value => /^\d\d:\d\d$/.test(value || '') ? value : '--:--';
  const todayKey = () => new Date().toISOString().slice(0, 10);

  function dailyAdhkarProgress() {
    const data = Storage.load('adhkar_progress') || {};
    const items = [...(AdhkarDB.morning || []), ...(AdhkarDB.evening || [])];
    const total = items.reduce((sum, item) => sum + Number(item.count || 1), 0);
    const done = items.reduce((sum, item) => sum + Math.min(Number(data[item.id]?.current || 0), Number(item.count || 1)), 0);
    return total ? Math.round(done / total * 100) : 0;
  }

  function getPrayerList() {
    return window.PrayerTimes || (typeof PrayerTimes !== 'undefined' ? PrayerTimes : []);
  }

  function nextPrayer() {
    const now = new Date();
    const prayers = getPrayerList().filter(item => item.name !== 'الشروق' && /^\d\d:\d\d$/.test(item.time || ''));
    for (const prayer of prayers) {
      const [hours, minutes] = prayer.time.split(':').map(Number);
      const date = new Date(now); date.setHours(hours, minutes, 0, 0);
      if (date > now) return {...prayer, date};
    }
    if (!prayers.length) return null;
    const prayer = prayers[0], [hours, minutes] = prayer.time.split(':').map(Number);
    const date = new Date(now); date.setDate(date.getDate() + 1); date.setHours(hours, minutes, 0, 0);
    return {...prayer, date};
  }

  function renderHomeV5() {
    const content = document.getElementById('page-content');
    if (!content) return;
    content.className = 'fade-in home-v5';
    const day = new Date().toDateString();
    if (AppState.prayerLog.date !== day) {
      AppState.prayerLog = {date: day, list: Array(5).fill(false)};
      Storage.save('prayer_v3', AppState.prayerLog);
    }
    const next = nextPrayer();
    const prayersDone = AppState.prayerLog.list.filter(Boolean).length;
    const adhkarDone = dailyAdhkarProgress();
    const location = (() => { try { return JSON.parse(localStorage.getItem('user_location') || 'null'); } catch (_) { return null; } })();
    const locationName = location?.city || 'حدد موقعك';
    const wirdSummary = window.getWirdSummaryMarkup?.() || '';
    content.innerHTML = `
      <section class="visual-hero home-visual">
        <div class="visual-overlay">
          <span class="eyebrow">زادك اليومي</span>
          <h2>ابدأ يومك بذكر الله</h2>
          <p>القرآن والأذكار والصلاة في مكان واحد هادئ.</p>
          <button onclick="switchTab('adhkar')">ابدأ أذكار اليوم <i class="fas fa-arrow-left"></i></button>
        </div>
      </section>
      <section class="next-prayer-compact">
        <div class="round-icon"><i class="fas fa-mosque"></i></div>
        <div><small>الصلاة القادمة</small><strong>${esc(next?.name || 'لم تُحمّل المواقيت')}</strong><span>${next ? arabicTime(next.time) : esc(locationName)}</span></div>
        <button onclick="renderPrayerHub()">عرض المواقيت</button>
      </section>
      ${wirdSummary}
      <section class="quick-grid">
        <button onclick="switchTab('adhkar')"><i class="fas fa-hands-praying"></i><strong>أذكار اليوم</strong><small>${adhkarDone}% مكتمل</small></button>
        <button onclick="switchTab('quran')"><i class="fas fa-book-quran"></i><strong>ورد القرآن</strong><small>تابع قراءتك</small></button>
        <button onclick="switchTab('tasbeeh')"><i class="fas fa-circle-notch"></i><strong>المسبحة</strong><small>ذكر بلا انقطاع</small></button>
      </section>
      <section class="today-progress card">
        <div><span class="section-kicker">متابعة اليوم</span><h3>خطوات صغيرة، أثر دائم</h3></div>
        <div class="progress-rings">
          <button onclick="renderPrayerHub()" style="--value:${prayersDone * 20}"><strong>${prayersDone}/5</strong><span>الصلوات</span></button>
          <button onclick="switchTab('adhkar')" style="--value:${adhkarDone}"><strong>${adhkarDone}%</strong><span>الأذكار</span></button>
        </div>
      </section>`;
  }

  function renderAdhkarLanding() {
    const content = document.getElementById('page-content');
    const data = Storage.load('adhkar_progress') || {};
    const progress = dailyAdhkarProgress();
    content.className = 'fade-in adhkar-v5';
    const cards = [
      ['morning','أذكار الصباح','ابدأ يومك بذكر الله','fa-sun','adhkar-featured'],
      ['evening','أذكار المساء','اختم يومك بالذكر','fa-moon','night'],
      ['sleeping','أذكار النوم','سكينة قبل النوم','fa-bed','sleep'],
      ['afterPrayer','أذكار بعد الصلاة','ذكر ثابت بعد الفريضة','fa-mosque','prayer']
    ];
    content.innerHTML = `
      <header class="page-heading"><div><span class="section-kicker">ورد اليوم ${progress}%</span><h2>الأذكار</h2></div><div class="mini-progress"><span style="--progress:${progress}"></span></div></header>
      <div class="adhkar-landing-list">${cards.map(([id,title,subtitle,icon,cls], index) => `
        <button class="adhkar-landing-card ${cls}" onclick="renderAdhkar('${id}')">
          <i class="fas ${icon}"></i><span><strong>${title}</strong><small>${subtitle}</small></span><b>${index === 0 ? 'ابدأ الآن' : '<i class="fas fa-chevron-left"></i>'}</b>
        </button>`).join('')}</div>
      <button class="tasbeeh-fab" onclick="switchTab('tasbeeh')"><i class="fas fa-circle-notch"></i> المسبحة</button>`;
  }

  function renderMore() {
    const content = document.getElementById('page-content');
    content.className = 'fade-in more-v5';
    content.innerHTML = `<header class="page-heading"><div><span class="section-kicker">أدوات زاد المسلم</span><h2>المزيد</h2></div></header>
      <div class="more-grid">
        <button onclick="switchTab('tasbeeh')"><i class="fas fa-circle-notch"></i><strong>المسبحة</strong><small>عداد وإحصاءات الذكر</small></button>
        <button onclick="renderPrayerHub()"><i class="fas fa-mosque"></i><strong>الصلاة والقبلة</strong><small>المواقيت والاتجاه</small></button>
        <button onclick="switchTab('settings')"><i class="fas fa-sliders"></i><strong>الإعدادات</strong><small>المظهر والتنبيهات والبيانات</small></button>
        <button onclick="renderAudioDownloads()"><i class="fas fa-download"></i><strong>التنزيلات</strong><small>التلاوات المحفوظة</small></button>
      </div>`;
  }

  function renderPrayerHub() {
    const content = document.getElementById('page-content');
    const next = nextPrayer();
    const names = ['الفجر','الظهر','العصر','المغرب','العشاء'];
    const prayerList = getPrayerList();
    content.className = 'fade-in prayer-hub-v5';
    content.innerHTML = `<header class="page-heading"><div><span class="section-kicker">مواقيت دقيقة</span><h2>الصلاة والقبلة</h2></div><button class="icon-button" onclick="switchTab('settings')"><i class="fas fa-gear"></i></button></header>
      <section class="visual-hero prayer-visual"><div class="visual-overlay"><span class="eyebrow">الصلاة القادمة</span><h2>${esc(next?.name || 'حدد موقعك')}</h2><p>${next ? arabicTime(next.time) : 'لتحديث المواقيت'}</p></div></section>
      <div class="prayer-timeline">${names.map(name => { const item = prayerList.find(p => p.name === name); return `<div class="${next?.name === name ? 'active' : ''}"><i></i><strong>${name}</strong><span>${arabicTime(item?.time)}</span></div>`; }).join('')}</div>
      <div class="prayer-hub-actions"><button onclick="renderQibla()"><i class="fas fa-compass"></i><strong>اتجاه القبلة</strong><small>بوصلة من موقعك الحالي</small></button><button onclick="renderPrayerTracking()"><i class="fas fa-calendar-check"></i><strong>متابعة الصلوات</strong><small>${AppState.prayerLog.list.filter(Boolean).length} من 5 اليوم</small></button></div>
      <button class="location-row" onclick="document.getElementById('manual-toggle').click()"><i class="fas fa-location-dot"></i><span>تحديد أو تعديل الموقع</span><i class="fas fa-chevron-left"></i></button>`;
  }

  function renderPrayerTracking() {
    const content = document.getElementById('page-content');
    const names = ['الفجر','الظهر','العصر','المغرب','العشاء'];
    content.innerHTML = `<div class="reader-toolbar"><button onclick="renderPrayerHub()"><i class="fas fa-arrow-right"></i></button><div><strong>متابعة الصلوات</strong><small>${AppState.prayerLog.list.filter(Boolean).length} من 5</small></div><span></span></div><section class="card prayer-checklist">${names.map((name,index)=>`<label><span>${name}</span><input type="checkbox" ${AppState.prayerLog.list[index]?'checked':''} onchange="togglePrayer(${index});renderPrayerTracking()"></label>`).join('')}</section>`;
  }

  window.renderHome = renderHomeV5;
  window.renderAdhkar = category => category ? baseAdhkar(category) : renderAdhkarLanding();
  window.renderMore = renderMore;
  window.renderPrayerHub = renderPrayerHub;
  window.renderPrayerTracking = renderPrayerTracking;

  function routeTab(tabName) {
    if (tabName === 'more') {
      AppState.currentTab = 'more';
      document.querySelectorAll('.nav-item').forEach(item => item.classList.toggle('active', item.dataset.tab === 'more'));
      history.pushState({tab:'more'}, '', '#more');
      renderMore();
      window.scrollTo({top:0, behavior:'smooth'});
      return;
    }
    return baseLoadTab(tabName);
  }
  window.loadTab = routeTab;
  window.switchTab = routeTab;

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.nav-item').forEach(item => {
      if (item.dataset.tab === 'more') item.addEventListener('click', event => { event.stopImmediatePropagation(); window.switchTab('more'); }, true);
    });
    if (!location.hash || location.hash === '#home') renderHomeV5();
  });
})();
