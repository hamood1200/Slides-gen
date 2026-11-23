// Deck → HTML. One function per slide type. Every type is field-agnostic: nothing here knows about solar.
import { L, md, esc } from './text.mjs';

const ROOT = '../../';                       // out/<slug>/file.html → repo root
const asset = p => (/^(https?:|data:)/.test(p) ? p : ROOT + p);

const T = {
  agenda: { en: 'Agenda', ar: 'المحتوى' },
  presenter: { en: 'About the presenter', ar: 'عن المحاضر' },
  thanks: { en: 'Thank you', ar: 'شكراً لكم' },
  offerTag: { en: 'From the Najdeah library', ar: 'من مكتبة نجديّة' },
  offerCta: { en: 'See it on najdeah.com', ar: 'تفاصيل أكثر على najdeah.com' },
  thumb: { en: 'Rule of thumb', ar: 'قاعدة عملية' },
  example: { en: 'Worked example', ar: 'مثال محسوب' },
  result: { en: 'Result', ar: 'النتيجة' },
  free: { en: 'Free slides · share them freely', ar: 'سلايدات مجانية · شاركها مع زملائك' },
  dhikrPre: { en: 'Before we start', ar: 'قبل أن نبدأ' },
  libItems: { en: ['Guides', 'Excel tools', 'Word templates', 'Project files'], ar: ['أدلة', 'أدوات إكسل', 'قوالب وورد', 'ملفات مشاريع'] },
};

export function renderDeck(deck, plan, lang, ctx) {
  const t = (v, w) => L(v, lang, w);
  const m = (v, w) => md(t(v, w), lang);
  const deckTitle = t(deck.cover.title, 'cover.title');
  const total = plan.length;

  const foot = (i, dark) => `<div class="foot"><span class="deck">${md(deckTitle, lang)}</span><span class="site">NAJDEAH.COM</span><span class="folio">${i + 1}</span></div>`;
  const logo = dark => `<img class="logo" src="${asset(dark ? 'brand/logo/logo-white.png' : 'brand/logo/logo-color.png')}" alt="Najdeah">`;
  const head = (s, w) => `<div class="head">${s.eyebrow ? `<div class="eyebrow">${m(s.eyebrow, w + '.eyebrow')}</div>` : ''}<h2 class="title">${m(s.title, w + '.title')}</h2><div class="rule"></div>${s.lead ? `<p class="lead">${m(s.lead, w + '.lead')}</p>` : ''}</div>`;
  const pts = (arr, w, cls = '') => `<ul class="pts ${cls}">${t(arr, w).map(p => typeof p === 'string' ? `<li>${md(p, lang)}</li>` : `<li>${md(p.text, lang)}${p.sub ? `<span class="sub">${md(p.sub, lang)}</span>` : ''}</li>`).join('')}</ul>`;
  const note = (n, w) => n ? `<div class="note">${n.label ? `<span class="k">${m(n.label, w + '.label')}</span>` : ''}${m(n.text ?? n, w + '.text')}</div>` : '';
  const fig = (s, w) => s.image ? `<div class="fig${s.fit === 'contain' ? ' contain' : ''}"><img src="${asset(s.image)}" alt=""></div>` : '';

  const R = {
    cover(s, i) {
      const c = deck.cover, photo = c.photo;
      const p = ctx.brand.presenter;
      return `<section class="slide dark cover${photo ? ' has-photo' : ''}">
        <div class="wm"></div>
        ${photo ? `<div class="photo"><img src="${asset(photo)}" alt="" style="object-position:${c.photo_position || 'center'}"></div>` : ''}
        <img class="logo" src="${asset('brand/logo/logo-white.png')}" alt="Najdeah">
        <div class="panel">
          <div class="series">${m(c.series || ctx.brand.series, 'cover.series')}</div>
          <h1>${m(c.title, 'cover.title')}</h1>
          <div class="rule"></div>
          ${c.subtitle ? `<p class="sub">${m(c.subtitle, 'cover.subtitle')}</p>` : ''}
          <div class="who">${esc(t(p.name))}<span>${esc(t(p.role))}</span></div>
        </div>
        <div class="edbar"><span>${m(c.edition || T.free, 'cover.edition')}</span><span class="num">${esc(c.year || new Date().getFullYear())}</span></div>
      </section>`;
    },
    presenter(s, i) {
      const p = ctx.brand.presenter;
      return `<section class="slide light presenter">${logo()}
        <div class="frame"><div class="eyebrow">${esc(t(T.presenter))}</div>
          <div class="body"><div class="fig"><img src="${asset(p.photo)}" alt="" style="object-position:30% center"></div>
          <div class="col" style="align-self:center"><div class="name">${esc(t(p.name))}</div><div class="role">${esc(t(p.role))}</div>${pts(p.bio, 'brand.bio')}</div></div>
        </div>${foot(i)}</section>`;
    },
    agenda(s, i) {
      const items = s.items;
      const one = items.length <= 4;
      return `<section class="slide light">${logo()}<div class="wm"></div>
        <div class="frame">${head({ title: s.title || T.agenda }, 'agenda')}
          <div class="agenda-grid${one ? ' one' : ''}">${items.map((x, k) => `<div class="arow"><span class="n">${k + 1}</span><span>${m(x, 'agenda')}</span></div>`).join('')}</div>
        </div>${foot(i)}</section>`;
    },
    section(s, i) {
      return `<section class="slide dark section"><div class="wm"></div>${logo(true)}
        <div class="inner"><div class="big">${String(s._n).padStart(2, '0')}</div><h2>${m(s.title, s._w + '.title')}</h2>${s.sub ? `<p class="sub">${m(s.sub, s._w + '.sub')}</p>` : ''}</div>
        ${foot(i, true)}</section>`;
    },
    bullets(s, i) {
      return `<section class="slide light">${logo()}
        <div class="frame">${head(s, s._w)}
          <div class="body"><div class="col">${pts(s.points, s._w + '.points', s.points && t(s.points).length > 5 ? 'dense' : '')}${note(s.note, s._w + '.note')}</div>${fig(s, s._w)}</div>
        </div>${foot(i)}</section>`;
    },
    compare(s, i) {
      const [a, b] = s.columns;
      return `<section class="slide light">${logo()}
        <div class="frame">${head(s, s._w)}
          <div class="cmp"><div class="card a"><div class="ch">${m(a.title, s._w + '.a')}</div>${pts(a.points, s._w + '.a.points')}</div>
          <div class="card b"><div class="ch">${m(b.title, s._w + '.b')}</div>${pts(b.points, s._w + '.b.points')}</div></div>
          ${s.verdict ? `<div class="verdict">${m(s.verdict, s._w + '.verdict')}</div>` : ''}
        </div>${foot(i)}</section>`;
    },
    steps(s, i) {
      const st = s.steps;
      return `<section class="slide light">${logo()}
        <div class="frame">${head(s, s._w)}
          <div class="steps" style="grid-template-columns:repeat(${st.length},1fr)">${st.map((x, k) => `<div class="step"><div class="n">${k + 1}</div><h4>${m(x.title, s._w + '.step')}</h4>${x.text ? `<p>${m(x.text, s._w + '.step')}</p>` : ''}</div>`).join('')}</div>
        </div>${foot(i)}</section>`;
    },
    stats(s, i) {
      const st = s.stats;
      return `<section class="slide light">${logo()}<div class="wm"></div>
        <div class="frame">${head(s, s._w)}
          <div class="stats" style="grid-template-columns:repeat(${st.length},1fr)">${st.map(x => `<div class="stat"><div class="v">${esc(t(x.value))}${x.unit ? `<span class="u">${esc(t(x.unit))}</span>` : ''}</div><div class="l">${m(x.label, s._w + '.stat')}</div></div>`).join('')}</div>
          ${s.source ? `<div class="source">${m(s.source, s._w + '.source')}</div>` : ''}
        </div>${foot(i)}</section>`;
    },
    formula(s, i) {
      const ex = s.example;
      return `<section class="slide light">${logo()}
        <div class="frame">${head(s, s._w)}
          <div class="fx"><div class="col"><span class="thumb">${esc(t(T.thumb))}</span>
            ${s.rule ? `<p class="lead" style="margin:0 0 30px">${m(s.rule, s._w + '.rule')}</p>` : ''}
            <div class="eq">${esc(t(s.formula))}${s.where ? `<small>${m(s.where, s._w + '.where')}</small>` : ''}</div></div>
          ${ex ? `<div class="col"><div class="ex"><h4>${m(ex.title || T.example, s._w + '.ex')}</h4>
            ${ex.rows.map(r => `<div class="row"><span>${m(r[0], s._w + '.ex.row')}</span><span class="v">${m(r[1], s._w + '.ex.row')}</span></div>`).join('')}
            ${ex.result ? `<div class="res"><span>${esc(t(T.result))}</span><span class="v">${m(ex.result, s._w + '.ex.result')}</span></div>` : ''}</div>
            ${note(s.note, s._w + '.note')}</div>` : ''}
          </div>
        </div>${foot(i)}</section>`;
    },
    table(s, i) {
      const [hd, ...rows] = s.rows;
      return `<section class="slide light">${logo()}
        <div class="frame">${head(s, s._w)}
          <table class="tb"><thead><tr>${hd.map(c => `<th>${m(c, s._w + '.th')}</th>`).join('')}</tr></thead>
          <tbody>${rows.map(r => `<tr>${r.map(c => `<td>${m(c, s._w + '.td')}</td>`).join('')}</tr>`).join('')}</tbody></table>
          ${note(s.note, s._w + '.note')}
        </div>${foot(i)}</section>`;
    },
    image(s, i) {
      return `<section class="slide light">${logo()}
        <div class="frame">${head(s, s._w)}
          <div class="imgfull"><img src="${asset(s.image)}" alt=""></div>
          ${s.caption ? `<div class="cap">${m(s.caption, s._w + '.caption')}</div>` : ''}
        </div>${foot(i)}</section>`;
    },
    dhikr(s, i) {
      // The phrase stays in Arabic in every language; English decks add a transliteration and meaning.
      const en = lang === 'en';
      return `<section class="slide dark dhikr"><div class="wm"></div>
        <div class="inner"><span class="pre">${esc(t(T.dhikrPre))}</span>
          <div class="phrase" lang="ar" dir="rtl">لا إله إلا الله</div><div class="rule"></div>
          ${en ? '<div class="tr">Lā ilāha illā Allāh<span>There is no god but Allah</span></div>' : ''}</div>
        <img class="logo" src="${asset('brand/logo/logo-white.png')}" alt="Najdeah"></section>`;
    },
    takeaway(s, i) {
      return `<section class="slide light takeaway">${logo()}<div class="wm"></div>
        <div class="inner"><div class="rule" style="margin:0 0 40px"></div><q>${m(s.text, s._w + '.text')}</q>${s.by ? `<div class="by">${m(s.by, s._w + '.by')}</div>` : ''}</div>
        ${foot(i)}</section>`;
    },
    offer(s, i) {
      const o = s.offer;
      const art = o.image ? `<img src="${asset(o.image)}" alt="">`
        : `<div class="lib"><img src="${asset('brand/logo/logo-white.png')}" alt="Najdeah">${t(T.libItems).map(x => `<div>${esc(x)}</div>`).join('')}</div>`;
      return `<section class="slide offer">${logo()}
        <div class="wrap"><div>
          <span class="tag">${esc(t(T.offerTag))}</span>
          <h3>${m(o.title, 'offer.title')}</h3>
          <p class="pitch">${m(o.pitch, 'offer.pitch')}</p>
          ${pts(o.points, 'offer.points')}
          <a class="cta" href="${esc(s.url)}">${esc(t(T.offerCta))}</a>
        </div><div class="art">${art}</div></div>
        ${foot(i)}</section>`;
    },
    closing(s, i) {
      const b = ctx.brand, p = b.presenter;
      return `<section class="slide dark closing"><div class="wm"></div>
        <div class="inner"><div><img class="logo" src="${asset('brand/logo/logo-white.png')}" alt="Najdeah">
          <h2>${m(s.title || T.thanks, 'closing.title')}</h2><div class="rule"></div>
          <div class="who">${esc(t(p.name))}<span>${esc(t(p.role))}</span></div></div>
          <div class="ct">${b.contacts.map(c => `<div><span class="k">${esc(t(c.label))}</span><span class="v">${esc(c.value)}</span></div>`).join('')}</div>
        </div>
        <div class="edbar"><span>${esc(t(T.free))}</span><span class="num">${esc(deck.cover.year || new Date().getFullYear())}</span></div>
      </section>`;
    },
  };

  const slides = plan.map((s, i) => {
    const fn = R[s.type];
    if (!fn) throw new Error(`unknown slide type "${s.type}" at ${s._w}`);
    return fn(L(s, lang, s._w), i).replace('<section ', `<section data-i="${i + 1}" data-type="${s.type}" `);
  }).join('\n');

  return `<!doctype html>
<html lang="${lang}" dir="${lang === 'ar' ? 'rtl' : 'ltr'}"><head><meta charset="utf-8">
<title>${esc(deckTitle)} · Najdeah</title>
<link rel="stylesheet" href="${ROOT}brand/palettes.css"><link rel="stylesheet" href="${ROOT}theme/slides.css">
</head><body class="${esc(deck.palette || 'palette-08-teal-orange')}">
${slides}
<script>${CHECK}</script>
</body></html>`;
}

// Layout check: runs in headless Chrome after fonts load; flags any slide whose text spills
// past its box or under the footer. build.mjs reads the flags from the dumped DOM.
const CHECK = `
(async()=>{await document.fonts.ready;
 for(const s of document.querySelectorAll('.slide')){
  const R=s.getBoundingClientRect(), bad=[];
  const footTop=(s.querySelector('.foot,.edbar')||{getBoundingClientRect:()=>({top:R.bottom})}).getBoundingClientRect().top;
  for(const el of s.querySelectorAll('.frame *, .panel *, .inner *, .wrap *')){
   if(el.closest('.fig,.art,.photo')||!el.textContent.trim())continue;
   const r=el.getBoundingClientRect(); if(!r.width)continue;
   if(r.bottom>footTop-4||r.right>R.right-40||r.left<R.left+40||r.top<R.top)bad.push((el.className||el.tagName)+':'+el.textContent.trim().slice(0,40));
  }
  for(const el of s.querySelectorAll('.body,.cmp,.card,.step,.steps,.stats')) if(el.scrollHeight>el.clientHeight+3)bad.push('clipped '+(el.className));
  if(bad.length)s.setAttribute('data-overflow',[...new Set(bad)].slice(0,3).join(' | ').replace(/"/g,"'"));
 }
 const mode=location.hash.slice(1); if(mode==='screen'||mode==='sheet')document.body.classList.add(mode);
 const one=/^slide=([0-9]+)$/.exec(mode); if(one)document.querySelectorAll('.slide').forEach(s=>{if(s.dataset.i!==one[1])s.style.display='none'});
 document.body.setAttribute('data-checked','1');
})();`;
