'use strict';
/* FITREHAB NEXT — v2
   Vanilla JS PWA. All data lives in localStorage on this device. */

const L = 'ar-EG-u-nu-latn'; // Arabic text, Latin digits (Arabic-Indic zero looks like a dot)
const KEY = 'fitrehab-next-v1'; // kept so existing users keep their data
const FORMAT = 'fitrehab-next-v2';
const GOALS = ['اللياقة العامة', 'بناء القوة', 'الحركة اليومية', 'الاستمرارية'];
const REST_OPTIONS = [30, 60, 90, 120];

const EX = [
  { id: 'squat', name: 'سكوات وزن الجسم', en: 'Bodyweight Squat', group: 'رجل', level: 'مبتدئ', sets: 3, reps: 12, steps: ['قف والقدمين بعرض الكتفين.', 'انزل بالحوض للخلف ولأسفل بمدى مريح.', 'ادفع بالأرض للعودة للوقوف مع تحكم.'], tip: 'حافظ على ثبات القدمين وتجنب الألم.' },
  { id: 'pushup', name: 'ضغط أرضي', en: 'Push-up', group: 'صدر', level: 'متوسط', sets: 3, reps: 10, steps: ['ضع اليدين أسفل الكتفين والجسم في خط واحد.', 'انزل بالصدر ببطء مع ثبات الجذع.', 'ادفع للعودة دون حبس النفس.'], tip: 'يمكن أداء التمرين على الحائط لتسهيله.' },
  { id: 'lunge', name: 'اندفاع أمامي', en: 'Forward Lunge', group: 'رجل', level: 'متوسط', sets: 3, reps: 10, steps: ['قف مستقيمًا وخذ خطوة للأمام.', 'اثن الركبتين مع التحكم في التوازن.', 'ادفع بالقدم الأمامية للعودة ثم بدّل الرجل.'], tip: 'ابدأ بخطوة قصيرة وبدون أوزان.' },
  { id: 'press', name: 'ضغط كتف واقف', en: 'Shoulder Press', group: 'كتف', level: 'متوسط', sets: 3, reps: 10, steps: ['قف بثبات واحمل وزنًا مناسبًا قرب الكتفين.', 'ادفع الذراعين لأعلى دون تقوس مبالغ فيه للظهر.', 'أنزل الوزن ببطء إلى البداية.'], tip: 'الرسوم تخطيطية ولا تُغني عن تعليم مدرب.' },
  { id: 'plank', name: 'بلانك', en: 'Plank Hold', group: 'بطن', level: 'مبتدئ', sets: 3, reps: 30, unit: 'ثانية', steps: ['ضع المرفقين تحت الكتفين.', 'شد البطن وحافظ على استقامة الجذع.', 'تنفس بشكل طبيعي طوال الثبات.'], tip: 'أوقف التمرين إذا شعرت بألم.' },
  { id: 'row', name: 'سحب ذراع', en: 'Bent-over Row', group: 'ظهر', level: 'متوسط', sets: 3, reps: 12, steps: ['اثن الحوض للخلف مع ظهر محايد.', 'اسحب الذراع باتجاه الجذع بتحكم.', 'أنزل الوزن ببطء وكرر.'], tip: 'لا تستخدم وزنًا يمنع التحكم في الحركة.' },
  { id: 'bridge', name: 'جسر الحوض', en: 'Glute Bridge', group: 'تأهيل', level: 'مبتدئ', sets: 3, reps: 12, steps: ['استلقِ على ظهرك مع ثني الركبتين.', 'ارفع الحوض برفق مع شد عضلات المقعدة.', 'انزل ببطء دون ألم.'], tip: 'تمرين حركة عام، وليس بروتوكول علاج لحالة معينة.' },
  { id: 'curl', name: 'ثني الذراع', en: 'Biceps Curl', group: 'ذراع', level: 'مبتدئ', sets: 3, reps: 12, steps: ['قف والمرفقان قريبان من الجذع.', 'اثن الذراعين دون تأرجح الجسم.', 'أنزل الوزن بتحكم.'], tip: 'ابدأ بوزن خفيف مناسب.' }
];
const NAV = [['home', '⌂', 'الرئيسية'], ['library', '▦', 'التمارين'], ['workout', '◉', 'تمرين اليوم'], ['rehab', '✚', 'الحركة والتأهيل'], ['nutrition', '◫', 'التغذية'], ['progress', '▥', 'تقدمي'], ['settings', '⚙', 'الإعدادات']];

/* ---------- state ---------- */
const defaultSession = () => ({ items: ['squat', 'pushup', 'row', 'bridge'], sets: {} });
const defaults = () => ({ name: 'بطل', goal: GOALS[0], days: 3, calGoal: 2200, proteinGoal: 110, rest: 60, completed: [], meals: [], weightLog: [], session: defaultSession(), savedAt: null });
let state = defaults(), page = 'home', filter = 'الكل', query = '', selDay = '';
let restEnd = 0, restTimer = null, lastFocus = null;

const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const byId = id => EX.find(e => e.id === id);
const dateKey = (d = new Date()) => d.toLocaleDateString('en-CA');
const isDate = s => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);
const prettyDate = d => new Date(d + 'T12:00:00').toLocaleDateString(L, { day: 'numeric', month: 'short' });
const fmt = n => new Intl.NumberFormat(L, { maximumFractionDigits: 1 }).format(n);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const shiftDay = (k, n) => { const d = new Date(k + 'T12:00:00'); d.setDate(d.getDate() + n); return dateKey(d); };

function cleanSets(arr, max = 30) {
  if (!Array.isArray(arr)) return [];
  return arr.slice(0, max).map(s => ({ reps: clamp(Math.round(Number(s?.reps)) || 0, 0, 999), kg: clamp(Number(s?.kg) || 0, 0, 500), done: !!s?.done }));
}
function cleanSession(s) {
  const items = [...new Set((Array.isArray(s?.items) ? s.items : []).filter(id => byId(id)))];
  const sets = {};
  items.forEach(id => { const c = cleanSets(s?.sets?.[id], 20); if (c.length) sets[id] = c; });
  return { items, sets };
}
function load() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      state = { ...defaults(), ...v };
      state.completed = Array.isArray(v.completed) ? v.completed.filter(x => x && isDate(x.date)) : [];
      state.meals = Array.isArray(v.meals) ? v.meals.filter(x => x && isDate(x.date) && Number.isFinite(x.cal) && Number.isFinite(x.protein)) : [];
      state.weightLog = Array.isArray(v.weightLog) ? v.weightLog.filter(x => x && isDate(x.date) && Number.isFinite(x.kg)) : [];
      state.session = v.session ? cleanSession(v.session) : defaultSession();
      if (!GOALS.includes(state.goal)) state.goal = GOALS[0];
      if (!REST_OPTIONS.includes(state.rest)) state.rest = 60;
      delete state.active; // old v1 counter, replaced by per-set logging
    }
  } catch { state = defaults(); }
}
function save() {
  try { state.savedAt = new Date().toISOString(); localStorage.setItem(KEY, JSON.stringify(state)); }
  catch { toast('التخزين غير متاح — صدّر نسخة احتياطية'); }
}
function toast(s) { const t = $('#toast'); t.textContent = s; t.classList.add('show'); clearTimeout(toast.id); toast.id = setTimeout(() => t.classList.remove('show'), 3200); }

/* ---------- derived data ---------- */
function weekCounts() {
  const out = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const k = dateKey(d);
    out.push({ key: k, label: d.toLocaleDateString(L, { weekday: 'short' }), count: state.completed.filter(x => x.date === k).length });
  }
  return out;
}
function streak() {
  const days = new Set(state.completed.map(x => x.date));
  let k = dateKey(), n = 0;
  if (!days.has(k)) k = shiftDay(k, -1);
  while (days.has(k)) { n++; k = shiftDay(k, -1); }
  return n;
}
function dayTotals(k) {
  const m = state.meals.filter(x => x.date === k);
  return { meals: m, cal: m.reduce((a, b) => a + b.cal, 0), protein: m.reduce((a, b) => a + b.protein, 0) };
}
function setsFor(id) {
  const s = state.session.sets;
  if (!s[id]) { const e = byId(id); s[id] = Array.from({ length: e.sets }, () => ({ reps: e.reps, kg: 0, done: false })); }
  return s[id];
}
function sessionStats() {
  let sets = 0, volume = 0;
  state.session.items.forEach(id => setsFor(id).forEach(s => { if (s.done) { sets++; volume += s.reps * s.kg; } }));
  return { sets, volume };
}
function recentMeals() {
  const seen = new Set(), out = [];
  for (let i = state.meals.length - 1; i >= 0 && out.length < 6; i--) {
    const m = state.meals[i], key = m.name.trim().toLowerCase();
    if (!seen.has(key)) { seen.add(key); out.push(m); }
  }
  return out;
}

/* ---------- ui helpers ---------- */
const card = (icon, label, val, sub) => `<article class="card stat-card"><span class="stat-icon">${icon}</span><p>${label}</p><div class="stat">${val}</div><small class="muted">${sub}</small></article>`;
const heading = (label, title, desc) => `<div class="page-head"><div><div class="eyebrow">${label}</div><h1>${title}</h1><p>${desc}</p></div></div>`;
const bar = (v, goal) => `<div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="${goal}" aria-valuenow="${Math.min(v, goal)}"><span style="width:${goal ? clamp(v / goal * 100, 0, 100) : 0}%"></span></div>`;
const exerciseCard = e => `<article class="exercise-card"><div class="exercise-visual"><img loading="lazy" src="media/${e.id}.png" alt="رسم توضيحي لحركة ${esc(e.name)}"><span class="play-chip">▶ فيديو توضيحي</span></div><div class="exercise-info"><span class="badge">${e.group}</span><h3>${e.name}</h3><p>${e.en} · ${e.level}</p><div class="row space"><small>${e.sets} مجموعات × ${e.reps} ${e.unit || 'تكرار'}</small><button class="outline tiny" data-action="details" data-id="${e.id}">التفاصيل ←</button></div></div></article>`;
function chart(items, unit = '') {
  const max = Math.max(1, ...items.map(x => x.count));
  return `<div class="chart" role="img" aria-label="رسم بياني للأيام الأخيرة">${items.map(x => `<div class="chart-col" title="${x.label}: ${fmt(x.count)}${unit}"><span class="chart-val">${x.count ? fmt(x.count) : ''}</span><div class="chart-bar" style="height:${Math.max(3, x.count / max * 80)}%"></div><small>${x.label}</small></div>`).join('')}</div>`;
}
function lineChart(points) {
  if (points.length < 2) return '<div class="empty small">سجّل وزنك مرتين على الأقل عشان يظهر الرسم.</div>';
  const W = 300, H = 120, P = 14, ys = points.map(p => p.kg), min = Math.min(...ys), max = Math.max(...ys), span = Math.max(1, max - min);
  const xy = points.map((p, i) => [W - P - i / (points.length - 1) * (W - 2 * P), H - P - (p.kg - min) / span * (H - 2 * P)]);
  return `<svg class="line-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="تغير الوزن من ${fmt(points[0].kg)} إلى ${fmt(points[points.length - 1].kg)} كجم"><polyline points="${xy.map(p => p.join(',')).join(' ')}" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>${xy.map(p => `<circle cx="${p[0]}" cy="${p[1]}" r="3.5" fill="currentColor"/>`).join('')}</svg><div class="label-row"><span>${prettyDate(points[0].date)} · ${fmt(points[0].kg)} كجم</span><span>${prettyDate(points[points.length - 1].date)} · ${fmt(points[points.length - 1].kg)} كجم</span></div>`;
}

/* ---------- pages ---------- */
function home() {
  const total = state.completed.length, week = weekCounts(), w = week.reduce((a, b) => a + b.count, 0), st = streak();
  const pct = Math.min(100, Math.round(w / state.days * 100));
  const t = dayTotals(dateKey());
  return `<div class="fade-in">${heading('YOUR SPACE', `أهلاً يا ${esc(state.name)} 👋`, 'النهارده فرصة جديدة تتحرك وتبقى أحسن.')}
<section class="hero"><div class="hero-content"><div class="eyebrow">MOVE BETTER · FEEL STRONGER</div><h2>كل خطوة<br><span class="lime">بتفرق.</span></h2><p>خطتك قدامك، تمارينك جاهزة، وتقدمك بيتسجل. ابدأ على قد طاقتك.</p><div class="row" style="margin-top:22px"><button class="btn" data-action="navigate" data-page="workout">ابدأ تمرين النهارده ↗</button><button class="outline" data-action="navigate" data-page="library">استكشف التمارين</button></div></div><div class="hero-art" aria-hidden="true">✳</div></section>
<section class="section grid three">${card('◉', 'التمارين المكتملة', fmt(total), 'من بداية استخدامك')}${card('↗', 'تمارين آخر 7 أيام', fmt(w), `الهدف ${fmt(state.days)} في الأسبوع`)}${card('🔥', 'أيام متتالية', fmt(st), st ? 'كمّل ولا تكسر السلسلة' : 'ابدأ سلسلتك النهارده')}</section>
<section class="section"><div class="section-title"><h2>ابدأ من هنا</h2><button class="link-btn" data-action="navigate" data-page="library">كل التمارين ←</button></div><div class="exercise-grid">${[EX[0], EX[1], EX[6]].map(exerciseCard).join('')}</div></section>
<section class="section grid two"><div class="card"><div class="section-title"><h2>نشاط الأسبوع</h2><span class="badge">آخر 7 أيام</span></div>${chart(week)}<p>حتى التمرين القصير خطوة في الاتجاه الصح.</p></div>
<div class="card"><div class="section-title"><h2>هدفك الحالي</h2><span class="badge">${esc(state.goal)}</span></div><div class="stat">${fmt(w)} <span>/ ${fmt(state.days)} تمارين</span></div>${bar(w, state.days)}<div class="label-row"><span>هدف أسبوعي قابل للتعديل</span><span>${pct}%</span></div>
<div class="label-row"><span>أكلك النهارده</span><span>${fmt(t.cal)} / ${fmt(state.calGoal)} سعرة</span></div>${bar(t.cal, state.calGoal)}<div class="row" style="margin-top:14px"><button class="outline tiny" data-action="navigate" data-page="nutrition">سجّل وجبة</button><button class="outline tiny" data-action="navigate" data-page="settings">تعديل الأهداف</button></div></div></section></div>`;
}
function library() {
  const groups = ['الكل', ...new Set(EX.map(e => e.group))];
  const q = query.toLowerCase();
  const items = EX.filter(e => (filter === 'الكل' || e.group === filter) && `${e.name} ${e.en} ${e.group}`.toLowerCase().includes(q));
  return `<div class="fade-in">${heading('EXERCISE LIBRARY', 'مكتبة التمارين', 'كل حركة معاها رسم وفيديو توضيحي قصير.')}
<div class="card" style="margin-bottom:18px"><label class="field">دور على تمرين<input class="search" id="exercise-search" type="search" placeholder="مثال: سكوات، ظهر، Push-up" value="${esc(query)}" autocomplete="off"></label></div>
<div class="filters">${groups.map(g => `<button class="chip ${filter === g ? 'active' : ''}" data-action="filter" data-filter="${g}">${g}</button>`).join('')}</div>
<div class="exercise-grid" id="exercise-results">${items.map(exerciseCard).join('') || '<div class="empty">مفيش تمارين مطابقة للبحث.</div>'}</div>
<div class="notice info section">الفيديوهات رسومات حركة مبسطة وليست تصويرًا لمدرب. اتبع حدود قدرتك واستشر مختصًا لو عندك إصابة أو ألم.</div></div>`;
}
function workoutBlock(id) {
  const e = byId(id), sets = setsFor(id), unit = e.unit || 'تكرار', weighted = !e.unit;
  return `<section class="card ex-block"><div class="ex-head"><img src="media/${id}.png" alt=""><div class="grow"><strong>${e.name}</strong><small>الهدف: ${e.sets} × ${e.reps} ${unit}</small><div><button class="link-btn tiny" data-action="details" data-id="${id}">شوف الحركة ▶</button></div></div><button class="icon-btn" data-action="remove-ex" data-id="${id}" aria-label="إزالة ${e.name} من التمرين">✕</button></div>
<div class="set-table">${sets.map((s, i) => `<div class="set-row ${s.done ? 'done' : ''}"><span class="set-no">${i + 1}</span><label class="mini-field">${unit}<input type="number" inputmode="numeric" min="0" max="999" value="${s.reps}" data-field="reps" data-id="${id}" data-i="${i}"></label>${weighted ? `<label class="mini-field">كجم<input type="number" inputmode="decimal" min="0" max="500" step="0.5" value="${s.kg}" data-field="kg" data-id="${id}" data-i="${i}"></label>` : '<span></span>'}<button class="set-check" data-action="toggle-set" data-id="${id}" data-i="${i}" aria-pressed="${s.done}" aria-label="${s.done ? 'إلغاء' : 'تأكيد'} المجموعة ${i + 1}">✓</button></div>`).join('')}</div>
<div class="row" style="margin-top:12px"><button class="outline tiny" data-action="add-set" data-id="${id}">+ مجموعة</button>${sets.length > 1 ? `<button class="link-btn tiny" data-action="del-set" data-id="${id}">حذف آخر مجموعة</button>` : ''}</div></section>`;
}
function workout() {
  const s = state.session, st = sessionStats(), avail = EX.filter(e => !s.items.includes(e.id));
  return `<div class="fade-in">${heading('TODAY’S SESSION', 'تمرينك النهارده', 'سجّل كل مجموعة وقت ما تخلصها، والمؤقت هيشتغل لوحده.')}
<div class="grid two"><div class="card"><span class="eyebrow">YOUR SESSION</span><h2>جلستك</h2><div class="stat">${fmt(st.sets)} <span>مجموعة · ${fmt(st.volume)} كجم حجم</span></div><div class="row"><button class="btn" data-action="finish-workout">إنهاء وحفظ التمرين ✓</button><button class="outline" data-action="reset-session">تصفير</button></div></div>
<div class="card"><span class="eyebrow">REST TIMER</span><h2>مؤقت الراحة</h2><div class="timer" id="timer-display">${timerText(remaining())}</div><div class="filters" style="margin:0 0 12px">${REST_OPTIONS.map(n => `<button class="chip ${state.rest === n ? 'active' : ''}" data-action="rest-len" data-sec="${n}">${n} ث</button>`).join('')}</div><div class="row"><button class="btn" data-action="timer-start">ابدأ ${state.rest} ثانية</button><button class="outline" data-action="timer-stop">إيقاف</button></div></div></div>
<div class="section">${s.items.length ? s.items.map(workoutBlock).join('') : '<div class="empty">مفيش تمارين في الجلسة. أضف تمرين من تحت.</div>'}</div>
${avail.length ? `<div class="card section"><div class="section-title"><h2>أضف تمرين</h2></div><div class="filters" style="margin:0">${avail.map(e => `<button class="chip" data-action="add-ex" data-id="${e.id}">+ ${e.name}</button>`).join('')}</div></div>` : ''}
<div class="notice info section">الحفظ محلي على نفس المتصفح والجهاز. صدّر نسخة احتياطية من الإعدادات لحماية سجلك.</div></div>`;
}
function rehab() {
  return `<div class="fade-in">${heading('MOVE WITH CARE', 'الحركة والتأهيل', 'حركة لطيفة ومعلومات عامة؛ مش تشخيص ولا خطة علاج فردية.')}
<div class="notice">لو عندك إصابة حديثة أو ألم متزايد أو تنميل أو ضعف مفاجئ، أوقف التمرين واطلب تقييمًا طبيًا. لا تستخدم التطبيق بدل متابعة أخصائي.</div>
<div class="section grid two"><div class="card"><span class="eyebrow">GENTLE MOVEMENT</span><h2>ابدأ بحركة مريحة</h2><p>الهدف هنا الحركة الواعية، مش تحدي الألم أو دفع المفصل لمدى مؤلم.</p><button class="outline" data-action="details" data-id="bridge">شوف جسر الحوض ▶</button></div><div class="card"><span class="eyebrow">STABILITY</span><h2>ثبات الجذع</h2><p>ابدأ بوقت قصير، وتوقف لو الحركة سببت ألمًا أو دوخة.</p><button class="outline" data-action="details" data-id="plank">شوف البلانك ▶</button></div></div>
<div class="section"><div class="section-title"><h2>حركات مصورة</h2></div><div class="exercise-grid">${[EX[6], EX[4], EX[0]].map(exerciseCard).join('')}</div></div></div>`;
}
function nutrition() {
  const today = dateKey(); if (!selDay) selDay = today;
  const t = dayTotals(selDay), isToday = selDay === today, recent = recentMeals();
  const days = [];
  for (let i = 6; i >= 0; i--) { const k = shiftDay(today, -i); days.push({ label: new Date(k + 'T12:00:00').toLocaleDateString(L, { weekday: 'short' }), count: dayTotals(k).cal }); }
  const dayLabel = isToday ? 'النهارده' : new Date(selDay + 'T12:00:00').toLocaleDateString(L, { weekday: 'long', day: 'numeric', month: 'long' });
  return `<div class="fade-in">${heading('FUEL YOUR PROGRESS', 'تغذيتك', 'سجل أكلك بشكل بسيط؛ الأرقام اللي بتدخلها تقديرية.')}
<div class="day-nav"><button class="icon-btn" data-action="day-prev" aria-label="اليوم السابق">›</button><strong>${dayLabel}</strong><button class="icon-btn" data-action="day-next" aria-label="اليوم التالي" ${isToday ? 'disabled' : ''}>‹</button></div>
<div class="grid two"><article class="card"><p>السعرات المسجلة</p><div class="stat">${fmt(t.cal)} <span>/ ${fmt(state.calGoal)} سعرة</span></div>${bar(t.cal, state.calGoal)}<small class="muted">هدف شخصي بتحدده أنت، مش توصية طبية</small></article><article class="card"><p>البروتين المسجل</p><div class="stat">${fmt(t.protein)} <span>/ ${fmt(state.proteinGoal)} جم</span></div>${bar(t.protein, state.proteinGoal)}<small class="muted">حسب القيم اللي أنت دخلتها</small></article></div>
<section class="section card"><div class="section-title"><h2>أضف وجبة</h2><span class="badge">${isToday ? 'النهارده' : prettyDate(selDay)}</span></div>
${recent.length ? `<div class="filters">${recent.map((m, i) => `<button class="chip" data-action="quick-meal" data-i="${i}">+ ${esc(m.name)} · ${fmt(m.cal)}</button>`).join('')}</div>` : ''}
<form id="meal-form"><div class="form-grid"><label class="field">اسم الوجبة<input class="input" name="name" maxlength="70" required placeholder="مثال: فطار"></label><label class="field">السعرات (تقريبًا)<input class="input" name="cal" type="number" inputmode="numeric" min="0" max="5000" step="1" required placeholder="350"></label><label class="field">البروتين بالجرام<input class="input" name="protein" type="number" inputmode="numeric" min="0" max="300" step="1" required placeholder="25"></label></div><button class="btn" style="margin-top:17px" type="submit">+ تسجيل الوجبة</button></form></section>
<section class="section card"><div class="section-title"><h2>وجبات ${isToday ? 'النهارده' : 'اليوم'}</h2></div>${t.meals.length ? t.meals.slice().reverse().map(x => `<div class="list-row"><div><strong>${esc(x.name)}</strong><small>${fmt(x.cal)} سعرة · ${fmt(x.protein)} جم بروتين</small></div><button class="outline tiny danger" data-action="delete-meal" data-id="${esc(x.id)}">حذف</button></div>`).join('') : '<div class="empty">مفيش وجبات مسجلة لليوم ده.</div>'}</section>
<section class="section card"><div class="section-title"><h2>سعرات آخر 7 أيام</h2></div>${chart(days, ' سعرة')}</section></div>`;
}
function progress() {
  const total = state.completed.length, vol = state.completed.reduce((a, x) => a + (x.volume || 0), 0), w = state.weightLog.slice().sort((a, b) => a.date.localeCompare(b.date)).slice(-30);
  const last = state.weightLog.length ? w[w.length - 1] : null;
  return `<div class="fade-in">${heading('YOUR JOURNEY', 'تقدمك', 'تابع الاستمرارية، مش الكمال.')}
<div class="grid three">${card('◉', 'إجمالي الجلسات', fmt(total), 'جلسات محفوظة')}${card('▦', 'المجموعات المكتملة', fmt(state.completed.reduce((a, x) => a + (x.sets || 0), 0)), `حجم تمرين ${fmt(Math.round(vol))} كجم`)}${card('◷', 'آخر تمرين', state.completed[0] ? prettyDate(state.completed[0].date) : '—', 'تاريخ آخر جلسة')}</div>
<div class="section grid two"><div class="card"><div class="section-title"><h2>الأسبوع الحالي</h2></div>${chart(weekCounts())}</div>
<div class="card"><div class="section-title"><h2>الوزن</h2>${last ? `<span class="badge">${fmt(last.kg)} كجم</span>` : ''}</div>${lineChart(w)}<form id="weight-form" class="row" style="margin-top:14px"><label class="field grow">وزن النهارده (كجم)<input class="input" name="kg" type="number" inputmode="decimal" min="20" max="400" step="0.1" required placeholder="75.5"></label><button class="btn" type="submit" style="align-self:flex-end">حفظ</button></form></div></div>
<div class="section card"><div class="section-title"><h2>سجل الجلسات</h2></div>${state.completed.length ? state.completed.slice(0, 20).map((x, i) => x.exercises?.length
    ? `<details class="hist"><summary><span><strong>جلسة ${prettyDate(x.date)}</strong><small>${fmt(x.sets || 0)} مجموعات · ${fmt(Math.round(x.volume || 0))} كجم</small></span><span class="badge">✓ مكتمل</span></summary>${x.exercises.map(ex => { const e = byId(ex.id); return e ? `<div class="hist-ex"><b>${e.name}</b><span>${ex.sets.map(s => e.unit ? `${s.reps} ث` : (s.kg ? `${s.reps}×${fmt(s.kg)}` : `${s.reps}`)).join(' · ')}</span></div>` : ''; }).join('')}<button class="outline tiny danger" data-action="delete-session" data-i="${i}">حذف الجلسة</button></details>`
    : `<div class="list-row"><div><strong>جلسة ${prettyDate(x.date)}</strong><small>${fmt(x.sets || 0)} مجموعات</small></div><span class="badge">✓ مكتمل</span></div>`).join('') : '<div class="empty">أول تمرين هتسجله هيظهر هنا.</div>'}</div></div>`;
}
function settings() {
  return `<div class="fade-in">${heading('MAKE IT YOURS', 'الإعدادات والبيانات', 'كل بياناتك محفوظة على المتصفح الحالي فقط — بدون حساب سحابي.')}
<div class="grid two"><section class="card"><h2>ملفك وأهدافك</h2><form id="profile-form"><label class="field">اسم العرض<input class="input" name="name" maxlength="35" value="${esc(state.name)}" required></label>
<label class="field" style="margin-top:14px">الهدف<select class="input" name="goal">${GOALS.map(g => `<option ${state.goal === g ? 'selected' : ''}>${g}</option>`).join('')}</select></label>
<label class="field" style="margin-top:14px">هدف التمارين الأسبوعي<select class="input" name="days">${[1, 2, 3, 4, 5, 6, 7].map(n => `<option value="${n}" ${state.days === n ? 'selected' : ''}>${n} أيام</option>`).join('')}</select></label>
<div class="form-grid two-col" style="margin-top:14px"><label class="field">هدف السعرات اليومي<input class="input" name="calGoal" type="number" inputmode="numeric" min="500" max="6000" step="50" value="${state.calGoal}" required></label><label class="field">هدف البروتين (جم)<input class="input" name="proteinGoal" type="number" inputmode="numeric" min="10" max="400" step="5" value="${state.proteinGoal}" required></label></div>
<button class="btn" style="margin-top:18px" type="submit">حفظ التعديلات</button></form></section>
<section class="card"><h2>النسخ الاحتياطي</h2><p>بياناتك مش بتتزامن بين الأجهزة. تقدر تصدّر ملف JSON وتستورده على جهاز تاني.</p><div class="row"><button class="btn" data-action="export">↓ تنزيل نسخة احتياطية</button><label class="outline" style="cursor:pointer">↑ استيراد نسخة<input id="import-file" type="file" accept="application/json,.json" hidden></label></div><div class="notice info" style="margin-top:16px">ملف النسخة الاحتياطية يحتوي على اسمك وسجل تمارينك ووجباتك ووزنك؛ احتفظ به في مكان آمن.</div></section></div>
<section class="section card"><h2>الخصوصية والتحكم</h2><p>لا نرسل بياناتك إلى خادم. لو مسحت بيانات المتصفح أو استخدمت جهازًا مختلفًا، لن يظهر سجلك إلا بعد استيراد نسخة احتياطية.</p><button class="outline danger" data-action="clear">مسح بياناتي المحلية نهائيًا</button></section>
<div class="notice section">FITREHAB حاليًا تطبيق ويب تجريبي مجاني، وليس خدمة طبية، ولا يتضمن تسجيل دخول أو مزامنة سحابية أو اعتمادًا طبيًا.</div></div>`;
}

/* ---------- shell ---------- */
function renderNav() {
  const active = p => page === p ? 'active' : '';
  $('#side-nav').innerHTML = NAV.map(([p, i, t]) => `<button class="nav-item ${active(p)}" data-action="navigate" data-page="${p}" ${page === p ? 'aria-current="page"' : ''}><span class="ico" aria-hidden="true">${i}</span>${t}</button>`).join('');
  $('#mobile-nav').innerHTML = NAV.filter(n => n[0] !== 'rehab').map(([p, i, t]) => `<button class="${active(p)}" data-action="navigate" data-page="${p}" aria-label="${t}" ${page === p ? 'aria-current="page"' : ''}><span class="ico" aria-hidden="true">${i}</span>${t === 'تمرين اليوم' ? 'تمرين' : t}</button>`).join('');
  $('#page-crumb').textContent = NAV.find(n => n[0] === page)?.[2] || '';
}
function render() {
  renderNav();
  $('#app').innerHTML = ({ home, library, workout, rehab, nutrition, progress, settings }[page] || home)();
  $('#today').textContent = new Date().toLocaleDateString(L, { weekday: 'long', day: 'numeric', month: 'long' });
  document.title = `${NAV.find(n => n[0] === page)?.[2]} | FITREHAB`;
  updateTimerUI();
}
function navigate(p) {
  if (!NAV.some(n => n[0] === p)) p = 'home';
  page = p;
  if (location.hash.slice(1) !== p) location.hash = p;
  render();
  window.scrollTo({ top: 0, behavior: 'instant' });
  $('#app').focus({ preventScroll: true });
}
function refocus(sel) { const el = document.querySelector(sel); if (el) el.focus({ preventScroll: true }); }

/* ---------- modal ---------- */
function details(id) {
  const e = byId(id); if (!e) return;
  lastFocus = document.activeElement;
  const inSession = state.session.items.includes(id);
  $('#modal-body').innerHTML = `<span class="eyebrow">EXERCISE GUIDE · ${e.group}</span><h2 id="modal-title">${e.name}</h2><video class="video" controls autoplay muted loop playsinline preload="metadata" poster="media/${e.id}.png" aria-label="فيديو توضيحي لحركة ${e.name}"><source src="media/${e.id}.mp4" type="video/mp4">متصفحك لا يدعم الفيديو.</video><div class="row space" style="margin:17px 0"><span class="badge">${e.level}</span><strong>${e.sets} مجموعات × ${e.reps} ${e.unit || 'تكرار'}</strong></div><h3>طريقة الأداء</h3><ol class="steps">${e.steps.map(s => `<li>${esc(s)}</li>`).join('')}</ol><div class="notice info">${esc(e.tip)} الفيديو رسوم متحركة تخطيطية وليست تصويرًا بشريًا.</div><div class="row" style="margin-top:16px">${inSession ? '<span class="badge">✓ ضمن تمرين النهارده</span>' : `<button class="btn" data-action="add-ex" data-id="${e.id}">+ أضف لتمرين النهارده</button>`}</div>`;
  $('#modal').classList.remove('hidden');
  $('#modal').querySelector('.modal-close').focus();
  document.body.style.overflow = 'hidden';
}
function closeModal() {
  if ($('#modal').classList.contains('hidden')) return;
  $('#modal').classList.add('hidden'); $('#modal-body').innerHTML = ''; document.body.style.overflow = '';
  if (lastFocus && document.contains(lastFocus)) lastFocus.focus({ preventScroll: true });
}

/* ---------- rest timer ---------- */
const remaining = () => restEnd ? Math.max(0, Math.ceil((restEnd - Date.now()) / 1000)) : 0;
const timerText = r => `${String(Math.floor(r / 60)).padStart(2, '0')}:${String(r % 60).padStart(2, '0')}`;
function updateTimerUI() {
  const r = remaining(), el = $('#timer-display'), pill = $('#rest-pill');
  if (el) el.textContent = timerText(r);
  pill.classList.toggle('hidden', !restEnd);
  pill.textContent = `⏱ راحة ${timerText(r)}`;
}
function beep() {
  try { const c = new (window.AudioContext || window.webkitAudioContext)(), o = c.createOscillator(), g = c.createGain(); o.frequency.value = 880; g.gain.value = .15; o.connect(g); g.connect(c.destination); o.start(); setTimeout(() => { o.stop(); c.close(); }, 350); } catch { }
  try { navigator.vibrate?.([200, 100, 200]); } catch { }
}
function stopTimer() { clearInterval(restTimer); restTimer = null; restEnd = 0; updateTimerUI(); }
function startTimer(sec = state.rest) {
  clearInterval(restTimer);
  restEnd = Date.now() + sec * 1000;
  updateTimerUI();
  restTimer = setInterval(() => {
    if (remaining() <= 0) { stopTimer(); beep(); toast('وقت الراحة خلص — جاهز للمجموعة الجاية؟'); } else updateTimerUI();
  }, 250);
}

/* ---------- backup ---------- */
function downloadJson() {
  const blob = new Blob([JSON.stringify({ format: FORMAT, data: state }, null, 2)], { type: 'application/json' }), url = URL.createObjectURL(blob), a = document.createElement('a');
  a.href = url; a.download = `FITREHAB-backup-${dateKey()}.json`; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000); toast('تم تجهيز النسخة الاحتياطية');
}
function validateImport(v) {
  if (!v || !['fitrehab-next-v1', FORMAT].includes(v.format) || !v.data || typeof v.data !== 'object') throw Error('صيغة الملف غير مدعومة');
  const d = v.data;
  if (typeof d.name !== 'string' || !d.name.trim() || d.name.length > 35 || !Array.isArray(d.completed) || d.completed.length > 5000 || !Array.isArray(d.meals) || d.meals.length > 10000) throw Error('البيانات غير صالحة');
  for (const x of d.meals) if (!x || typeof x.name !== 'string' || x.name.length > 70 || !isDate(x.date) || !Number.isFinite(x.cal) || x.cal < 0 || x.cal > 5000 || !Number.isFinite(x.protein) || x.protein < 0 || x.protein > 300) throw Error('سجل وجبات غير صالح');
  for (const x of d.completed) if (!x || !isDate(x.date) || !Number.isInteger(x.sets) || x.sets < 0 || x.sets > 500) throw Error('سجل تمرين غير صالح');
  const wl = Array.isArray(d.weightLog) ? d.weightLog : [];
  if (wl.length > 3000) throw Error('سجل الوزن كبير جدًا');
  return {
    ...defaults(), name: d.name.trim(), goal: GOALS.includes(d.goal) ? d.goal : GOALS[0],
    days: Number.isInteger(d.days) && d.days >= 1 && d.days <= 7 ? d.days : 3,
    calGoal: Number.isFinite(d.calGoal) ? clamp(Math.round(d.calGoal), 500, 6000) : 2200,
    proteinGoal: Number.isFinite(d.proteinGoal) ? clamp(Math.round(d.proteinGoal), 10, 400) : 110,
    rest: REST_OPTIONS.includes(d.rest) ? d.rest : 60,
    completed: d.completed.map(x => ({
      date: x.date, sets: x.sets, volume: Number.isFinite(x.volume) ? clamp(x.volume, 0, 1e7) : 0,
      exercises: Array.isArray(x.exercises) ? x.exercises.slice(0, 30).filter(e => e && byId(e.id)).map(e => ({ id: e.id, sets: cleanSets(e.sets).map(({ reps, kg }) => ({ reps, kg })) })) : undefined
    })),
    meals: d.meals.map(x => ({ id: String(x.id ?? Date.now()).slice(0, 60), date: x.date, name: x.name, cal: x.cal, protein: x.protein })),
    weightLog: wl.filter(x => x && isDate(x.date) && Number.isFinite(x.kg) && x.kg >= 20 && x.kg <= 400).map(x => ({ date: x.date, kg: x.kg })),
    session: defaultSession()
  };
}

/* ---------- events ---------- */
const uid = () => crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
function addMeal(name, cal, protein) {
  state.meals.push({ id: uid(), date: selDay || dateKey(), name, cal, protein });
  save(); toast('اتسجلت الوجبة ✓'); render();
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-action]'); if (!b) return;
  const act = b.dataset.action, id = b.dataset.id, i = Number(b.dataset.i);
  switch (act) {
    case 'navigate': closeModal(); navigate(b.dataset.page); break;
    case 'filter': filter = b.dataset.filter; render(); break;
    case 'details': details(id); break;
    case 'close-modal': closeModal(); break;
    case 'add-ex':
      if (!state.session.items.includes(id)) { state.session.items.push(id); save(); toast(`اتضاف: ${byId(id).name}`); }
      closeModal(); if (page === 'workout') render(); break;
    case 'remove-ex': state.session.items = state.session.items.filter(x => x !== id); delete state.session.sets[id]; save(); render(); break;
    case 'add-set': { const a = setsFor(id), last = a[a.length - 1]; if (a.length < 20) a.push({ reps: last?.reps ?? byId(id).reps, kg: last?.kg ?? 0, done: false }); save(); render(); refocus(`[data-action="add-set"][data-id="${id}"]`); break; }
    case 'del-set': { const a = setsFor(id); if (a.length > 1) a.pop(); save(); render(); refocus(`[data-action="add-set"][data-id="${id}"]`); break; }
    case 'toggle-set': {
      const s = setsFor(id)[i]; if (!s) break;
      s.done = !s.done; save(); render();
      refocus(`[data-action="toggle-set"][data-id="${id}"][data-i="${i}"]`);
      if (s.done) startTimer(); break;
    }
    case 'finish-workout': {
      const exercises = state.session.items.map(x => ({ id: x, sets: setsFor(x).filter(s => s.done).map(({ reps, kg }) => ({ reps, kg })) })).filter(x => x.sets.length);
      if (!exercises.length) { toast('أكّد مجموعة واحدة على الأقل الأول (علامة ✓)'); break; }
      const sets = exercises.reduce((a, x) => a + x.sets.length, 0);
      const volume = exercises.reduce((a, x) => a + x.sets.reduce((s, y) => s + (byId(x.id).unit ? 0 : y.reps * y.kg), 0), 0);
      state.completed.unshift({ date: dateKey(), sets, volume, exercises });
      state.session.sets = {}; stopTimer(); save(); toast('برافو! التمرين اتحفظ ✓'); navigate('progress'); break;
    }
    case 'reset-session': if (confirm('تصفير كل المجموعات الحالية؟')) { state.session.sets = {}; save(); render(); } break;
    case 'rest-len': state.rest = Number(b.dataset.sec); save(); render(); break;
    case 'timer-start': startTimer(); break;
    case 'timer-stop': stopTimer(); break;
    case 'delete-meal': state.meals = state.meals.filter(x => x.id !== id); save(); render(); break;
    case 'quick-meal': { const m = recentMeals()[i]; if (m) addMeal(m.name, m.cal, m.protein); break; }
    case 'day-prev': selDay = shiftDay(selDay || dateKey(), -1); render(); break;
    case 'day-next': if (selDay && selDay < dateKey()) { selDay = shiftDay(selDay, 1); render(); } break;
    case 'delete-session': if (confirm('حذف الجلسة دي من السجل؟')) { state.completed.splice(i, 1); save(); render(); } break;
    case 'export': downloadJson(); break;
    case 'clear': if (confirm('هتمسح كل بياناتك المحلية نهائيًا. متأكد؟')) { try { localStorage.removeItem(KEY); } catch { } stopTimer(); state = defaults(); selDay = ''; toast('تم مسح البيانات'); render(); } break;
  }
});
document.addEventListener('submit', e => {
  const f = new FormData(e.target);
  if (e.target.id === 'meal-form') {
    e.preventDefault();
    const name = String(f.get('name') || '').trim(), cal = Number(f.get('cal')), protein = Number(f.get('protein'));
    if (!name || name.length > 70 || !Number.isInteger(cal) || cal < 0 || cal > 5000 || !Number.isInteger(protein) || protein < 0 || protein > 300) return toast('راجع بيانات الوجبة');
    addMeal(name, cal, protein);
  }
  if (e.target.id === 'profile-form') {
    e.preventDefault();
    const name = String(f.get('name') || '').trim(), days = Number(f.get('days')), goal = String(f.get('goal')), calGoal = Number(f.get('calGoal')), proteinGoal = Number(f.get('proteinGoal'));
    if (!name || name.length > 35 || !Number.isInteger(days) || days < 1 || days > 7 || !GOALS.includes(goal) || !(calGoal >= 500 && calGoal <= 6000) || !(proteinGoal >= 10 && proteinGoal <= 400)) return toast('راجع بيانات الملف');
    Object.assign(state, { name, days, goal, calGoal: Math.round(calGoal), proteinGoal: Math.round(proteinGoal) });
    save(); toast('تم حفظ الإعدادات ✓'); render();
  }
  if (e.target.id === 'weight-form') {
    e.preventDefault();
    const kg = Math.round(Number(f.get('kg')) * 10) / 10;
    if (!(kg >= 20 && kg <= 400)) return toast('الوزن لازم يكون بين 20 و 400 كجم');
    const k = dateKey(), ex = state.weightLog.find(x => x.date === k);
    if (ex) ex.kg = kg; else state.weightLog.push({ date: k, kg });
    save(); toast('اتسجل الوزن ✓'); render();
  }
});
document.addEventListener('input', e => {
  if (e.target.id === 'exercise-search') {
    query = e.target.value.slice(0, 100);
    const q = query.toLowerCase();
    const items = EX.filter(x => (filter === 'الكل' || x.group === filter) && `${x.name} ${x.en} ${x.group}`.toLowerCase().includes(q));
    $('#exercise-results').innerHTML = items.map(exerciseCard).join('') || '<div class="empty">مفيش تمارين مطابقة.</div>';
  }
});
document.addEventListener('change', async e => {
  const t = e.target;
  if (t.dataset.field) {
    const s = setsFor(t.dataset.id)[Number(t.dataset.i)]; if (!s) return;
    if (t.dataset.field === 'reps') { s.reps = clamp(Math.round(Number(t.value)) || 0, 0, 999); t.value = s.reps; }
    else { s.kg = clamp(Math.round((Number(t.value) || 0) * 2) / 2, 0, 500); t.value = s.kg; }
    save(); return;
  }
  if (t.id === 'import-file') {
    const file = t.files[0]; if (!file) return;
    if (file.size > 2_000_000) { toast('الملف كبير جدًا'); return; }
    try {
      const next = validateImport(JSON.parse(await file.text()));
      if (!confirm('استيراد الملف هيستبدل بياناتك الحالية. تكمل؟')) return;
      stopTimer(); state = next; selDay = ''; save(); toast('تم الاستيراد بنجاح'); render();
    } catch (err) { toast('تعذر الاستيراد: ' + err.message); }
    t.value = '';
  }
});
$('#rest-pill').addEventListener('click', () => navigate('workout'));
$('#modal').addEventListener('click', e => { if (e.target.id === 'modal') closeModal(); });
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
  if (e.key === 'Tab' && !$('#modal').classList.contains('hidden')) {
    const f = [...$('#modal').querySelectorAll('button,video,a[href],input,select')].filter(x => !x.disabled);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
});
window.addEventListener('hashchange', () => { const h = location.hash.slice(1); if (NAV.some(x => x[0] === h) && page !== h) { page = h; render(); } });

/* ---------- boot ---------- */
load();
page = NAV.some(n => n[0] === location.hash.slice(1)) ? location.hash.slice(1) : 'home';
render();
if ('serviceWorker' in navigator && location.protocol !== 'file:') window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => { }));
