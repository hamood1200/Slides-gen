// Deck → HTML. One function per slide type. Every type is field-agnostic: nothing here knows about solar.
import { L, md, esc, tex } from './text.mjs';
import { chart } from './chart.mjs';
import { readFileSync } from 'node:fs';

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
  // title block labels
  tbTitle: { en: 'Title', ar: 'العنوان' },
  tbSec: { en: 'Section', ar: 'القسم' },
  tbSheet: { en: 'Slide', ar: 'السلايد' },
  tbWeb: { en: 'Web', ar: 'الموقع' },
  photo: { en: 'Photo', ar: 'صورة' },
  via: { en: 'via', ar: 'عبر' },
};
const SOURCES = { wikimedia: 'Wikimedia Commons', flickr: 'Flickr' };

export function renderDeck(deck, plan, lang, ctx) {
  const t = (v, w) => L(v, lang, w);
  const m = (v, w) => md(t(v, w), lang);
  const deckTitle = t(deck.cover.title, 'cover.title');
  const total = plan.length;
  const ar = lang === 'ar';

  // section of each sheet, and its drawing reference: §2.3 = third sheet of section 2
  const sec = [], ref = [];
  let curSec = null, k = 0;
  plan.forEach((s, i) => {
    if (s.type === 'section') { curSec = s; k = 0; }
    else if (curSec && s.type !== 'offer' && s.type !== 'closing') k++;
    sec[i] = s.type === 'closing' || s.type === 'offer' || !curSec ? null : curSec;
    ref[i] = curSec && s.type !== 'section' && s.type !== 'offer' && s.type !== 'closing' ? `§${curSec._n}.${k}` : '';
  });
  let cur = 0;

  const logoSrc = dark => asset(dark ? 'brand/logo/logo-white.png' : 'brand/logo/logo-color.png');
  // The title block: logo first and large, then title, section, sheet number, website.
  const foot = (i, dark) => {
    const st = sec[i] ? t(sec[i].title, sec[i]._w + '.title') : t(ctx.brand.series);
    return `<div class="foot"><div class="lg"><img src="${logoSrc(dark)}" alt="Najdeah"></div>
      <div class="ttl"><small>${esc(t(T.tbTitle))}</small><b>${md(deckTitle, lang)}</b></div>
      <div class="sec"><small>${esc(t(T.tbSec))}</small><b>${md(st, lang)}</b></div>
      <div class="sh"><small>${esc(t(T.tbSheet))}</small><b>${String(i + 1).padStart(2, '0')} / ${total}</b></div>
      <div class="web"><small>${esc(t(T.tbWeb))}</small><b>najdeah.com</b></div></div>`;
  };
  // border, inner line, zone markers 1–6 across and A–D down (always left to right, like a real sheet)
  const ZONES = [1, 2, 3, 4, 5, 6].map(n => `<span class="zn" style="top:7px;left:${(n - .5) * 320 - 4}px">${n}</span><span class="zn" style="bottom:7px;left:${(n - .5) * 320 - 4}px">${n}</span>`).join('')
    + ['A', 'B', 'C', 'D'].map((l, q) => `<span class="zn" style="left:9px;top:${(q + .5) * 270 - 7}px">${l}</span><span class="zn" style="right:9px;top:${(q + .5) * 270 - 7}px">${l}</span>`).join('');
  const sheet = `<div class="frm"></div>${ZONES}`;

  const head = (s, w) => {
    const eb = [ref[cur] && `<bdi dir="ltr">${ref[cur]}</bdi>`, s.eyebrow && md(t(s.eyebrow, w + '.eyebrow'), lang)].filter(Boolean).join(' · ');
    return `<div class="head">${eb ? `<div class="eyebrow">${eb}</div>` : ''}<h2 class="title">${m(s.title, w + '.title')}</h2>${s.lead ? `<p class="lead">${m(s.lead, w + '.lead')}</p>` : ''}</div>`;
  };
  const pts = (arr, w, cls = '') => `<ul class="pts ${cls}">${t(arr, w).map(p => typeof p === 'string' ? `<li>${md(p, lang)}</li>` : `<li>${md(p.text, lang)}${p.sub ? `<span class="sub">${md(p.sub, lang)}</span>` : ''}</li>`).join('')}</ul>`;
  const note = (n, w) => n ? `<div class="note">${n.label ? `<span class="k">${m(n.label, w + '.label')}</span>` : ''}${m(n.text ?? n, w + '.text')}</div>` : '';
  // credit line from decks/<slug>/img/credits.json (written by tools/find-photo.mjs); BY and BY-SA need it
  const credit = src => {
    const c = ctx.credits?.[src];
    if (!c) return '';
    const who = (c.creator || '').split(',')[0].trim();
    const parts = [who, c.license, `${t(T.via)} ${SOURCES[c.source] || c.source}`].filter(Boolean);
    return `<div class="credit">${esc(t(T.photo))}: ${md(parts.join(ar ? '، ' : ', '), lang)}</div>`;
  };
  // a photo mounted on the sheet; "callouts": [{ "x": 45, "y": 20, "label": {...} }] adds numbered balloons (x, y in % of the photo)
  const fig = (s, w) => {
    if (!s.image) return '';
    const cl = s.callouts || [];
    // a local .svg is inlined so its labels use the deck's fonts; "tags": [{ "x": 30, "y": 60, "text": "..." }] writes short notes on the picture (x, y in %; "end": true anchors the right edge at x)
    const pic = /\.svg$/.test(s.image) && !/^https?:/.test(s.image) ? readFileSync(s.image, 'utf8') : `<img src="${asset(s.image)}" alt="">`;
    const tags = (s.tags || []).map(g => `<span class="tag" style="${g.end ? 'right:' + (100 - g.x) : 'left:' + g.x}%;top:${g.y}%">${esc(t(g.text))}</span>`).join('');
    return `<div class="fig${s.fit === 'contain' ? ' contain' : ''}${s.wide ? ' wide' : ''}"><div class="shot">${pic}${tags}
      ${cl.map((c, q) => `<span class="ball" style="left:${c.x}%;top:${c.y}%">${q + 1}</span>`).join('')}</div>
      ${cl.length ? `<div class="leg">${cl.map((c, q) => `<span><i>${q + 1}</i>${m(c.label, w + '.callouts')}</span>`).join('')}</div>` : ''}
      ${credit(s.image)}</div>`;
  };

  const R = {
    cover(s, i) {
      const c = deck.cover, p = ctx.brand.presenter;
      const art = ctx.drawing ? ctx.drawing
        : c.photo ? `<div class="fig"><div class="shot"><img src="${asset(c.photo)}" alt=""></div>${credit(c.photo)}</div>` : '';
      return `<section class="slide light cover">
        <div class="panel"><img class="clogo" src="${logoSrc()}" alt="Najdeah">
          <div class="series">${m(c.series || ctx.brand.series, 'cover.series')}</div>
          <h1>${m(c.title, 'cover.title')}</h1>
          ${c.subtitle ? `<p class="sub">${m(c.subtitle, 'cover.subtitle')}</p>` : ''}
          <div class="who">${esc(t(p.name))}<span>${esc(t(p.role))}</span></div>
        </div>
        ${art ? `<div class="dwg">${art}</div>` : ''}
        ${foot(i)}</section>`;
    },
    presenter(s, i) {
      const p = ctx.brand.presenter;
      return `<section class="slide light presenter">
        <div class="frame"><div class="eyebrow">${esc(t(p.eyebrow || T.presenter))}</div>
          <div class="body"><div class="fig"><img src="${asset(p.photo)}" alt="" style="object-position:${p.photo_position || '30% center'}"></div>
          <div class="col" style="align-self:center"><div class="name">${esc(t(p.name))}</div><div class="role">${esc(t(p.role))}</div>${pts(p.bio, 'brand.bio')}</div></div>
        </div>${foot(i)}</section>`;
    },
    agenda(s, i) {
      const items = s.items;
      const one = items.length <= 4;
      return `<section class="slide light">
        <div class="frame">${head({ title: s.title || T.agenda }, 'agenda')}
          <div class="agenda-grid${one ? ' one' : ''}">${items.map((x, q) => `<div class="arow"><span class="n">${q + 1}</span><span>${m(x, 'agenda')}</span></div>`).join('')}</div>
        </div>${foot(i)}</section>`;
    },
    section(s, i) {
      return `<section class="slide dark section">
        <div class="inner"><div class="big">${String(s._n).padStart(2, '0')}</div><h2>${m(s.title, s._w + '.title')}</h2>${s.sub ? `<p class="sub">${m(s.sub, s._w + '.sub')}</p>` : ''}</div>
        ${foot(i, true)}</section>`;
    },
    bullets(s, i) {
      const dense = s.image || (s.points && t(s.points).length > 5);
      return `<section class="slide light">
        <div class="frame">${head(s, s._w)}
          <div class="body"><div class="col">${pts(s.points, s._w + '.points', dense ? 'dense' : '')}${note(s.note, s._w + '.note')}</div>${fig(s, s._w)}</div>
        </div>${foot(i)}</section>`;
    },
    compare(s, i) {
      const [a, b] = s.columns;
      return `<section class="slide light">
        <div class="frame">${head(s, s._w)}
          <div class="cmp"><div class="card a"><div class="ch">${m(a.title, s._w + '.a')}</div>${pts(a.points, s._w + '.a.points')}</div>
          <div class="card b"><div class="ch">${m(b.title, s._w + '.b')}</div>${pts(b.points, s._w + '.b.points')}</div></div>
          ${s.verdict ? `<div class="verdict">${m(s.verdict, s._w + '.verdict')}</div>` : ''}
        </div>${foot(i)}</section>`;
    },
    steps(s, i) {
      const st = s.steps;
      return `<section class="slide light">
        <div class="frame">${head(s, s._w)}
          <div class="steps" style="grid-template-columns:repeat(${st.length},1fr)">${st.map((x, q) => `<div class="step"><div class="n">${q + 1}</div><h4>${m(x.title, s._w + '.step')}</h4>${x.text ? `<p>${m(x.text, s._w + '.step')}</p>` : ''}</div>`).join('')}</div>
        </div>${foot(i)}</section>`;
    },
    stats(s, i) {
      const st = s.stats;
      return `<section class="slide light">
        <div class="frame">${head(s, s._w)}
          <div class="stats" style="grid-template-columns:repeat(${st.length},1fr)">${st.map(x => `<div class="stat"><div class="v">${esc(t(x.value))}${x.unit ? `<span class="u">${esc(t(x.unit))}</span>` : ''}</div><div class="l">${m(x.label, s._w + '.stat')}</div></div>`).join('')}</div>
          ${s.source ? `<div class="source">${m(s.source, s._w + '.source')}</div>` : ''}
        </div>${foot(i)}</section>`;
    },
    formula(s, i) {
      const ex = s.example;
      return `<section class="slide light">
        <div class="frame">${head(s, s._w)}
          <div class="fx"><div class="col"><span class="thumb">${esc(t(T.thumb))}</span>
            ${s.rule ? `<p class="lead">${m(s.rule, s._w + '.rule')}</p>` : ''}
            <div class="eq">${s.tex ? tex(t(s.tex), true) : esc(t(s.formula))}${s.where ? `<small>${m(s.where, s._w + '.where')}</small>` : ''}</div></div>
          ${ex ? `<div class="col"><div class="ex"><h4>${m(ex.title || T.example, s._w + '.ex')}</h4>
            ${ex.rows.map(r => `<div class="row"><span>${m(r[0], s._w + '.ex.row')}</span><span class="v">${m(r[1], s._w + '.ex.row')}</span></div>`).join('')}
            ${ex.result ? `<div class="res"><span>${esc(t(T.result))}</span><span class="v">${m(ex.result, s._w + '.ex.result')}</span></div>` : ''}</div>
            ${note(s.note, s._w + '.note')}</div>` : ''}
          </div>
        </div>${foot(i)}</section>`;
    },
    table(s, i) {
      const [hd, ...rows] = s.rows;
      return `<section class="slide light">
        <div class="frame">${head(s, s._w)}
          <table class="tb"><thead><tr>${hd.map(c => `<th>${m(c, s._w + '.th')}</th>`).join('')}</tr></thead>
          <tbody>${rows.map(r => `<tr>${r.map(c => `<td>${m(c, s._w + '.td')}</td>`).join('')}</tr>`).join('')}</tbody></table>
          ${note(s.note, s._w + '.note')}
        </div>${foot(i)}</section>`;
    },
    chart(s, i) {
      const side = s.points || s.note;
      return `<section class="slide light">
        <div class="frame">${head(s, s._w)}
          <div class="chartwrap${side ? '' : ' wide'}"><figure class="chart">${chart(s.chart, lang, t, m)}
            ${s.source ? `<figcaption>${m(s.source, s._w + '.source')}</figcaption>` : ''}</figure>
          ${side ? `<div class="col">${s.points ? pts(s.points, s._w + '.points') : ''}${note(s.note, s._w + '.note')}</div>` : ''}</div>
        </div>${foot(i)}</section>`;
    },
    image(s, i) {
      return `<section class="slide light">
        <div class="frame">${head(s, s._w)}
          <div class="imgfull"><img src="${asset(s.image)}" alt=""></div>
          ${s.caption ? `<div class="cap">${m(s.caption, s._w + '.caption')}</div>` : ''}${credit(s.image)}
        </div>${foot(i)}</section>`;
    },
    dhikr(s, i) {
      // The phrase stays in Arabic in every language; English decks add a transliteration and meaning.
      const en = lang === 'en';
      return `<section class="slide dark dhikr">
        <div class="inner"><span class="pre">${esc(t(T.dhikrPre))}</span>
          <div class="phrase" lang="ar" dir="rtl">لا إله إلا الله</div>
          ${en ? '<div class="tr">Lā ilāha illā Allāh<span>There is no god but Allah</span></div>' : ''}</div>
        ${foot(i, true)}</section>`;
    },
    takeaway(s, i) {
      return `<section class="slide light takeaway">
        <div class="inner"><q>${m(s.text, s._w + '.text')}</q>${s.by ? `<div class="by">${m(s.by, s._w + '.by')}</div>` : ''}</div>
        ${foot(i)}</section>`;
    },
    offer(s, i) {
      const o = s.offer;
      const art = o.image ? `<img src="${asset(o.image)}" alt="">`
        : `<div class="lib"><img src="${asset('brand/logo/logo-white.png')}" alt="Najdeah">${t(T.libItems).map(x => `<div>${esc(x)}</div>`).join('')}</div>`;
      return `<section class="slide light offer">
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
      return `<section class="slide dark closing">
        <div class="inner"><div><img class="clogo" src="${logoSrc(true)}" alt="Najdeah">
          <h2>${m(s.title || T.thanks, 'closing.title')}</h2>
          <div class="who">${esc(t(p.name))}<span>${esc(t(p.role))}</span></div></div>
          <div class="ct">${b.contacts.map(c => `<div><span class="k">${esc(t(c.label))}</span><span class="v">${esc(c.value)}</span></div>`).join('')}</div>
        </div>
        ${foot(i, true)}</section>`;
    },
  };

  const slides = plan.map((s, i) => {
    const fn = R[s.type];
    if (!fn) throw new Error(`unknown slide type "${s.type}" at ${s._w}`);
    cur = i;
    return fn(L(s, lang, s._w), i).replace(/<section ([^>]*)>/, `<section data-i="${i + 1}" data-type="${s.type}" $1>${sheet}`);
  }).join('\n');

  return `<!doctype html>
<html lang="${lang}" dir="${lang === 'ar' ? 'rtl' : 'ltr'}"><head><meta charset="utf-8">
<title>${esc(deckTitle)} · Najdeah</title>
<link rel="stylesheet" href="${KATEX}/katex.min.css"><script src="${KATEX}/katex.min.js"></script>
<link rel="stylesheet" href="${ROOT}theme/slides.css">
</head><body>
${slides}
<script>${CHECK}</script>
</body></html>`;
}

// KaTeX from its official CDN, pinned. It runs in headless Chrome only; the build itself stays dependency-free.
const KATEX = 'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist';

// Layout check: runs in headless Chrome after fonts load; flags any slide whose text spills
// past its box or under the footer. build.mjs reads the flags from the dumped DOM.
const CHECK = `
(async()=>{
 const tx=document.querySelectorAll('.tex');
 if(tx.length&&!window.katex)document.body.setAttribute('data-katex','missing');
 else tx.forEach(e=>{try{katex.render(e.dataset.tex,e,{displayMode:e.classList.contains('d'),throwOnError:true})}catch(err){e.closest('.slide').setAttribute('data-overflow','LaTeX: '+err.message.replace(/"/g,"'").slice(0,120))}});
 await document.fonts.ready;
 for(const s of document.querySelectorAll('.slide')){
  const R=s.getBoundingClientRect(), bad=[];
  const footTop=(s.querySelector('.foot,.edbar')||{getBoundingClientRect:()=>({top:R.bottom})}).getBoundingClientRect().top;
  for(const el of s.querySelectorAll('.frame *, .panel *, .inner *, .wrap *')){
   if(el.closest('.shot,.art,.dwg,.katex-mathml,svg')||!el.textContent.trim())continue;
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
