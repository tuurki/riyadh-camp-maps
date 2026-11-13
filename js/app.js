/* Riyadh wild map — interactive browser for the "خريطة الرياض البرية" Google My Maps data. */
(() => {
  'use strict';

  // ---------------------------------------------------------------- i18n
  const I18N = {
    ar: {
      dir: 'rtl', other: 'EN',
      title: 'خريطة الرياض البرية',
      searchPlaceholder: 'ابحث عن جبل، وادي، بئر، نفود…',
      all: 'الكل', inView: 'في نطاق الخريطة',
      sortRelevance: 'الأقرب للبحث', sortDistance: 'الأقرب', sortName: 'أبجدي',
      results: n => `${fmtNum(n)} موقع`,
      empty: 'لا توجد نتائج. جرّب كلمة أخرى أو فعّل تصنيفات أكثر.',
      sourceLabel: 'المصدر:', sourceName: 'خريطة الرياض البرية (Google My Maps)',
      myLocation: 'موقعي', layers: 'طبقات', zoomIn: 'تكبير', zoomOut: 'تصغير',
      basemap: 'الخريطة الأساسية', overlays: 'طبقات إضافية', labelsLayer: 'أسماء المواقع على الخريطة',
      streets: 'شوارع', satellite: 'قمر صناعي', terrain: 'تضاريس',
      loading: 'جارٍ تحميل المواقع…',
      near: (name, km) => km < 1 ? `في ${name}` : `${fmtNum(km)} كم من ${name}`,
      km: d => d < 1 ? `${fmtNum(Math.round(d * 1000))} م` : `${fmtNum(d < 10 ? d.toFixed(1) : Math.round(d))} كم`,
      unnamed: 'بدون اسم',
      directions: 'الاتجاهات', openGoogle: 'فتح في Google Maps', copy: 'نسخ الإحداثيات', share: 'مشاركة',
      copied: 'تم النسخ', linkCopied: 'تم نسخ الرابط', close: 'إغلاق',
      goToCoords: 'الذهاب إلى الإحداثيات', coordsLabel: 'إحداثيات',
      fromYou: d => `يبعد عنك ${d}`, length: d => `الطول ${d}`,
      locating: 'جارٍ تحديد موقعك…', locError: 'تعذّر تحديد موقعك',
    },
    en: {
      dir: 'ltr', other: 'ع',
      title: 'Riyadh Wild Map',
      searchPlaceholder: 'Search mountains, valleys, wells, dunes…',
      all: 'All', inView: 'In map view',
      sortRelevance: 'Best match', sortDistance: 'Nearest', sortName: 'A–Z',
      results: n => `${n.toLocaleString('en')} places`,
      empty: 'No results. Try another word or enable more categories.',
      sourceLabel: 'Source:', sourceName: 'Riyadh Wild Map (Google My Maps)',
      myLocation: 'My location', layers: 'Layers', zoomIn: 'Zoom in', zoomOut: 'Zoom out',
      basemap: 'Base map', overlays: 'Overlays', labelsLayer: 'Place names on map',
      streets: 'Streets', satellite: 'Satellite', terrain: 'Terrain',
      loading: 'Loading places…',
      near: (name, km) => km < 1 ? `In ${name}` : `${km} km from ${name}`,
      km: d => d < 1 ? `${Math.round(d * 1000)} m` : `${d < 10 ? d.toFixed(1) : Math.round(d)} km`,
      unnamed: 'Unnamed',
      directions: 'Directions', openGoogle: 'Open in Google Maps', copy: 'Copy coordinates', share: 'Share',
      copied: 'Copied', linkCopied: 'Link copied', close: 'Close',
      goToCoords: 'Go to coordinates', coordsLabel: 'Coordinates',
      fromYou: d => `${d} from you`, length: d => `Length ${d}`,
      locating: 'Finding your location…', locError: 'Could not get your location',
    },
  };
  const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩';
  function fmtNum(n) { return String(n).replace(/\d/g, d => AR_DIGITS[d]).replace(/\./g, '٫'); }

  const store = {
    get(k, d) { try { const v = localStorage.getItem('rwm:' + k); return v === null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem('rwm:' + k, JSON.stringify(v)); } catch { /* ignore */ } },
  };

  let lang = store.get('lang', 'ar');
  const t = (key, ...args) => { const v = I18N[lang][key]; return typeof v === 'function' ? v(...args) : v; };

  // ---------------------------------------------------------------- icons
  const ICONS = {
    towns: 'M15 11V5l-3-3-3 3v2H3v14h18V11h-6zm-8 8H5v-2h2v2zm0-4H5v-2h2v2zm0-4H5V9h2v2zm6 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V9h2v2zm0-4h-2V5h2v2zm6 12h-2v-2h2v2zm0-4h-2v-2h2v2z',
    local: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z',
    mountains: 'M14 6l-3.75 5 2.85 3.8-1.6 1.2C9.81 13.75 7 10 7 10l-6 8h22L14 6z',
    valleys: 'M2 8c1.24 0 1.38-1 3.33-1s2.14 1 3.33 1c1.24 0 1.38-1 3.33-1 1.91 0 2.14 1 3.33 1 1.24 0 1.38-1 3.33-1 1.91 0 2.14 1 3.33 1v2c-1.91-.02-2.12-1-3.31-1-1.24 0-1.38 1-3.33 1-1.91 0-2.14-1-3.33-1-1.24 0-1.38 1-3.33 1-1.91 0-2.14-1-3.33-1C4.17 9 3.9 10 2 10V8zm0 5c1.24 0 1.38-1 3.33-1s2.14 1 3.33 1c1.24 0 1.38-1 3.33-1 1.91 0 2.14 1 3.33 1 1.24 0 1.38-1 3.33-1 1.91 0 2.14 1 3.33 1v2c-1.91-.02-2.12-1-3.31-1-1.24 0-1.38 1-3.33 1-1.91 0-2.14-1-3.33-1-1.24 0-1.38 1-3.33 1-1.91 0-2.14-1-3.33-1-1.18 0-1.45 1-3.35 1v-2zm0 5c1.24 0 1.38-1 3.33-1s2.14 1 3.33 1c1.24 0 1.38-1 3.33-1 1.91 0 2.14 1 3.33 1 1.24 0 1.38-1 3.33-1 1.91 0 2.14 1 3.33 1v2c-1.91-.02-2.12-1-3.31-1-1.24 0-1.38 1-3.33 1-1.91 0-2.14-1-3.33-1-1.24 0-1.38 1-3.33 1-1.91 0-2.14-1-3.33-1-1.18 0-1.45 1-3.35 1v-2z',
    water: 'M12 2c-5.33 4.55-8 8.48-8 11.8 0 4.98 3.8 8.2 8 8.2s8-3.22 8-8.2c0-3.32-2.67-7.25-8-11.8z',
    dunes: 'M1 19c3.5-5 7-7.5 11-7.5S19.5 14 23 19H1zm7.5-9.2C10.3 7.3 12.7 6 15.5 6c2.4 0 4.6.9 6.5 2.6-2.6-.5-5.3.1-7.6 1.6-1.8-.5-3.8-.6-5.9-.4z',
    heritage: 'M21 9v2h-2V3h-2v2h-2V3h-2v2h-2V3H9v2H7V3H5v8H3V9H1v12h9v-4c0-1.1.9-2 2-2s2 .9 2 2v4h9V9h-2z',
    roads: 'M19 15.18V7c0-2.21-1.79-4-4-4s-4 1.79-4 4v10c0 1.1-.9 2-2 2s-2-.9-2-2V8.82C8.16 8.4 9 7.3 9 6c0-1.66-1.34-3-3-3S3 4.34 3 6c0 1.3.84 2.4 2 2.82V17c0 2.21 1.79 4 4 4s4-1.79 4-4V7c0-1.1.9-2 2-2s2 .9 2 2v8.18A2.996 2.996 0 0 0 18 21c1.66 0 3-1.34 3-3 0-1.3-.84-2.4-2-2.82z',
    boundaries: 'M3 3h4v2H5v2H3V3zm14 0h4v4h-2V5h-2V3zM3 17h2v2h2v2H3v-4zm16 2v-2h2v4h-4v-2h2zM10 3h4v2h-4V3zm0 16h4v2h-4v-2zM3 10h2v4H3v-4zm16 0h2v4h-2v-4z',
    coords: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm8.94 3A8.994 8.994 0 0 0 13 3.06V1h-2v2.06A8.994 8.994 0 0 0 3.06 11H1v2h2.06A8.994 8.994 0 0 0 11 20.94V23h2v-2.06A8.994 8.994 0 0 0 20.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z',
  };
  const svg = (path, cls = '') => `<svg viewBox="0 0 24 24" class="${cls}" aria-hidden="true"><path d="${path}"/></svg>`;
  const UI_ICONS = {
    directions: 'M21.71 11.29l-9-9a.996.996 0 0 0-1.41 0l-9 9a.996.996 0 0 0 0 1.41l9 9c.39.39 1.02.39 1.41 0l9-9a.996.996 0 0 0 0-1.41zM14 14.5V12h-4v3H8v-4c0-.55.45-1 1-1h5V7.5l3.5 3.5-3.5 3.5z',
    open: 'M19 19H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z',
    copy: 'M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z',
    share: 'M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11A2.99 2.99 0 0 0 21 5a3 3 0 1 0-5.91.7L8.04 9.81A2.99 2.99 0 0 0 3 12a2.99 2.99 0 0 0 5.04 2.19l7.12 4.16c-.05.21-.08.43-.08.65A2.92 2.92 0 1 0 18 16.08z',
    pin: ICONS.local,
    nav: 'M12 2 4.5 20.29l.71.71L12 18l6.79 3 .71-.71z',
    ruler: 'M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 10H3V8h2v4h2V8h2v4h2V8h2v4h2V8h2v4h2V8h2v8z',
    close: 'M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z',
  };

  // ---------------------------------------------------------------- Arabic-aware search
  function normalize(s) {
    return (s || '')
      .toLowerCase()
      .replace(/[ً-ٰٟۖ-ۭـ]/g, '') // diacritics + tatweel
      .replace(/[أإآٱ]/g, 'ا')
      .replace(/ى/g, 'ي')
      .replace(/ئ/g, 'ي')
      .replace(/ؤ/g, 'و')
      .replace(/ء/g, '') // trailing hamza is often dropped (الدهناء / الدهنا)
      .replace(/ة/g, 'ه')
      .replace(/[٠-٩]/g, d => '0123456789'[AR_DIGITS.indexOf(d)])
      .replace(/[^\p{L}\p{N}\s.,-]/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
  // Also strip the Arabic definite article for matching "الدهناء" via "دهناء".
  const stripAl = w => (w.length > 3 && w.startsWith('ال')) ? w.slice(2) : w;

  function scoreItem(item, tokens, full) {
    const n = item.norm;
    if (!tokens.length) return 1;
    let score = 0;
    for (const tok of tokens) {
      const bare = stripAl(tok);
      let best = 0;
      for (const w of item.words) {
        if (w === tok || w === bare || stripAl(w) === bare) { best = Math.max(best, 6); }
        else if (w.startsWith(tok) || stripAl(w).startsWith(bare)) { best = Math.max(best, 4); }
        else if (w.includes(bare)) { best = Math.max(best, 2); }
      }
      if (!best) {
        if (n.includes(tok)) best = 1; else return 0;
      }
      score += best;
    }
    if (n === full) score += 20;
    else if (n.startsWith(full)) score += 8;
    else if (n.includes(full)) score += 3;
    return score - n.length * 0.01; // prefer shorter names on ties
  }

  function parseCoords(q) {
    const m = q.replace(/[٠-٩]/g, d => AR_DIGITS.indexOf(d)).replace(/٫/g, '.').replace(/،/g, ',')
      .match(/^\s*(-?\d{1,2}(?:\.\d+)?)\s*[,\s]\s*(-?\d{1,3}(?:\.\d+)?)\s*$/);
    if (!m) return null;
    let a = parseFloat(m[1]), b = parseFloat(m[2]);
    // Accept "lng, lat" too when it is obvious for Saudi Arabia (lat 15–33, lng 34–56).
    if (a > 33 && b < 33) [a, b] = [b, a];
    if (Math.abs(a) > 90 || Math.abs(b) > 180) return null;
    return [a, b];
  }

  // ---------------------------------------------------------------- geo helpers
  function haversine(a, b) {
    const R = 6371, toR = Math.PI / 180;
    const dLat = (b[0] - a[0]) * toR, dLng = (b[1] - a[1]) * toR;
    const x = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * toR) * Math.cos(b[0] * toR) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(x));
  }
  const fmtCoord = (lat, lng) => `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // ---------------------------------------------------------------- DOM
  const $ = id => document.getElementById(id);
  const els = {
    panel: $('panel'), search: $('search'), clear: $('clearSearch'), chips: $('chips'),
    count: $('resultCount'), inView: $('inView'), sort: $('sort'), list: $('list'), empty: $('empty'),
    detail: $('detail'), lang: $('langToggle'), source: $('sourceLink'), toast: $('toast'), loading: $('loading'),
    locate: $('locate'), layerBtn: $('layerBtn'), layerMenu: $('layerMenu'), basemaps: $('basemaps'),
    showLabels: $('showLabels'), handle: $('sheetHandle'), zoomIn: $('zoomIn'), zoomOut: $('zoomOut'),
  };
  const isMobile = () => window.matchMedia('(max-width: 720px)').matches;

  // ---------------------------------------------------------------- state
  const state = {
    query: '',
    cats: new Set(),
    inView: store.get('inView', false),
    sort: 'relevance',
    selected: null,
    userLoc: null,
    basemap: store.get('basemap', 'satellite'),
    labels: store.get('labels', false),
  };
  let CATS = [];
  let items = [];        // all searchable items (points + named lines)
  let results = [];
  let rendered = 0;
  const PAGE = 60;

  // ---------------------------------------------------------------- map
  const map = L.map('map', {
    zoomControl: false,
    attributionControl: false,
    minZoom: 4,
    maxZoom: 19,
    worldCopyJump: true,
    preferCanvas: false,
  }).setView([24.3, 45.6], 6);

  let attribution = L.control.attribution({ prefix: false, position: 'topright' }).addTo(map);
  const BASEMAPS = {
    streets: () => [L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19, attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    })],
    satellite: () => [
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19, maxNativeZoom: 18, attribution: 'Imagery © Esri, Maxar, Earthstar Geographics',
      }),
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19, maxNativeZoom: 18, opacity: .9,
      }),
    ],
    terrain: () => [L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
      maxZoom: 19, maxNativeZoom: 17,
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, SRTM | © <a href="https://opentopomap.org">OpenTopoMap</a>',
    })],
  };
  let baseLayers = [];
  function setBasemap(key) {
    if (!BASEMAPS[key]) key = 'satellite';
    baseLayers.forEach(l => map.removeLayer(l));
    baseLayers = BASEMAPS[key]();
    baseLayers.forEach(l => l.addTo(map).bringToBack());
    state.basemap = key; store.set('basemap', key);
    document.body.classList.toggle('sat', key === 'satellite');
    els.basemaps.querySelectorAll('.basemap').forEach(b => b.setAttribute('aria-pressed', b.dataset.key === key));
  }

  const cluster = L.markerClusterGroup({
    chunkedLoading: true,
    showCoverageOnHover: false,
    spiderfyOnMaxZoom: true,
    disableClusteringAtZoom: 13,
    maxClusterRadius: z => (z < 9 ? 60 : 45),
    iconCreateFunction(c) {
      const n = c.getChildCount();
      const size = n < 50 ? 34 : n < 300 ? 40 : 48;
      const cls = n < 50 ? '' : n < 300 ? 'md' : 'lg';
      return L.divIcon({
        html: `<div class="cluster ${cls}" style="width:${size}px;height:${size}px">${lang === 'ar' ? fmtNum(n) : n}</div>`,
        className: '', iconSize: [size, size],
      });
    },
  }).addTo(map);
  const lineLayer = L.layerGroup().addTo(map);
  const labelLayer = L.layerGroup().addTo(map);
  const selLayer = L.layerGroup().addTo(map);
  let userMarker = null;

  const iconCache = {};
  function pointIcon(cat) {
    if (iconCache[cat.key]) return iconCache[cat.key];
    let icon;
    if (cat.key === 'heritage') {
      icon = L.divIcon({ className: '', iconSize: [20, 20], html: `<div class="pin-heritage" style="background:${cat.color}">${svg(ICONS.heritage)}</div>` });
    } else {
      icon = L.divIcon({ className: '', iconSize: [14, 14], html: `<div class="pin-dot" style="background:${cat.color}"></div>` });
    }
    return (iconCache[cat.key] = icon);
  }
  function selectedIcon(color) {
    return L.divIcon({
      className: 'pin-selected', iconSize: [36, 48], iconAnchor: [18, 46],
      html: `<svg viewBox="0 0 36 48"><path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 30 18 30s18-16.5 18-30C36 8.06 27.94 0 18 0z" fill="${color}" stroke="#fff" stroke-width="2"/><circle cx="18" cy="18" r="6.5" fill="#fff"/></svg>`,
    });
  }

  // ---------------------------------------------------------------- data loading
  async function load() {
    const [pRes, lRes] = await Promise.all([fetch('data/places.json'), fetch('data/lines.json')]);
    const places = await pRes.json();
    const lines = await lRes.json();
    CATS = places.meta.categories;
    els.source.href = places.meta.source;
    state.cats = new Set(store.get('cats', CATS.map((_, i) => i)));

    places.points.forEach(([name, ci, lat, lng, near, nearKm, desc], i) => {
      const cat = CATS[ci];
      const item = {
        id: 'p' + i, type: 'point', name, ci, cat, lat, lng, near, nearKm, desc,
        norm: normalize(name), latlng: [lat, lng],
      };
      item.words = item.norm.split(' ');
      item.marker = L.marker([lat, lng], { icon: pointIcon(cat), title: name, keyboard: false });
      item.marker.on('click', () => select(item, { fly: false }));
      item.marker.bindTooltip(esc(name || t('unnamed')), { direction: 'top', offset: [0, -8], className: 'tip' });
      items.push(item);
    });

    lines.lines.forEach(([name, ci, pts], i) => {
      const cat = CATS[ci];
      const isRoad = cat.key === 'roads';
      const poly = L.polyline(pts, {
        color: cat.color, weight: isRoad ? 3 : 2.5, opacity: .9,
        dashArray: isRoad ? null : '6 5',
      });
      const bounds = poly.getBounds();
      let length = 0;
      for (let k = 1; k < pts.length; k++) length += haversine(pts[k - 1], pts[k]);
      const mid = pts[Math.floor(pts.length / 2)];
      const item = {
        id: 'l' + i, type: 'line', name, ci, cat, lat: mid[0], lng: mid[1], latlng: mid,
        pts, bounds, length, poly, norm: normalize(name), near: '', nearKm: null, desc: '',
      };
      item.words = item.norm.split(' ');
      poly.on('click', e => { L.DomEvent.stopPropagation(e); select(item, { fly: false }); });
      poly.bindTooltip(esc(name || cat[lang]), { sticky: true, className: 'tip' });
      items.push(item);
    });

    // Lines that share a name (a track drawn as several segments) – list only the first, but highlight all.
    const byName = new Map();
    for (const it of items) {
      if (it.type !== 'line') continue;
      if (!it.name) { it.hidden = true; continue; }
      const key = it.ci + '|' + it.norm;
      if (byName.has(key)) { it.hidden = true; byName.get(key).siblings.push(it); }
      else { it.siblings = [it]; byName.set(key, it); }
    }
    for (const it of byName.values()) {
      if (it.siblings.length > 1) {
        const b = L.latLngBounds([]);
        it.siblings.forEach(s => b.extend(s.bounds));
        it.bounds = b;
        it.length = it.siblings.reduce((a, s) => a + s.length, 0);
        const c = b.getCenter(); it.lat = c.lat; it.lng = c.lng; it.latlng = [c.lat, c.lng];
      }
    }
    // Clicking an un-listed segment selects its listed sibling.
    for (const it of items) {
      if (it.type === 'line' && it.hidden && it.name) {
        const head = byName.get(it.ci + '|' + it.norm);
        it.poly.off('click').on('click', e => { L.DomEvent.stopPropagation(e); select(head, { fly: false }); });
      }
    }
  }

  // ---------------------------------------------------------------- filtering
  function matchQuery() {
    const full = normalize(state.query);
    const tokens = full ? full.split(' ') : [];
    const out = [];
    for (const it of items) {
      const s = scoreItem(it, tokens, full);
      if (s > 0) out.push([it, s]);
    }
    return out;
  }

  let matchedCache = null;
  let matchedSet = null;
  function refresh({ keepScroll = false, mapToo = true } = {}) {
    if (!matchedCache) { matchedCache = matchQuery(); matchedSet = new Set(matchedCache.map(m => m[0])); }
    const matched = matchedCache;

    // Category counts (for the current query, ignoring category filters and the hidden duplicates)
    const counts = new Array(CATS.length).fill(0);
    for (const [it] of matched) if (!it.hidden) counts[it.ci]++;
    renderChips(counts);

    const bounds = state.inView ? map.getBounds().pad(-0.02) : null;
    const origin = state.userLoc || [map.getCenter().lat, map.getCenter().lng];
    results = [];
    for (const [it, s] of matched) {
      if (!state.cats.has(it.ci) || it.hidden) continue;
      if (bounds && !(it.type === 'line' ? bounds.intersects(it.bounds) : bounds.contains(it.latlng))) continue;
      it._score = s;
      it._dist = haversine(origin, it.latlng);
      results.push(it);
    }
    const byName = (a, b) => (a.name || '￿').localeCompare(b.name || '￿', 'ar');
    if (state.sort === 'distance') results.sort((a, b) => a._dist - b._dist);
    else if (state.sort === 'name') results.sort(byName);
    else if (state.query.trim()) results.sort((a, b) => b._score - a._score || a._dist - b._dist);
    else results.sort((a, b) => a.ci - b.ci || byName(a, b));

    const coords = parseCoords(state.query);
    renderList(coords, keepScroll);
    if (mapToo) renderMap(matched);
  }

  function renderMap(matched) {
    const markers = [];
    lineLayer.clearLayers();
    for (const [it] of matched) {
      if (!state.cats.has(it.ci)) continue;
      if (it.type === 'point') markers.push(it.marker);
      else lineLayer.addLayer(it.poly);
    }
    // Hidden sibling segments of a matched line should still draw.
    if (state.query.trim()) {
      for (const [it] of matched) {
        if (it.siblings && state.cats.has(it.ci)) it.siblings.forEach(s => lineLayer.addLayer(s.poly));
      }
    }
    cluster.clearLayers();
    cluster.addLayers(markers);
    renderLabels();
  }

  // ---------------------------------------------------------------- labels overlay
  function renderLabels() {
    labelLayer.clearLayers();
    if (!state.labels || map.getZoom() < 12) return;
    const b = map.getBounds();
    let n = 0;
    for (const it of items) {
      if (it.type !== 'point' || !it.name || !state.cats.has(it.ci) || !b.contains(it.latlng)) continue;
      if (matchedSet && !matchedSet.has(it)) continue;
      labelLayer.addLayer(L.marker(it.latlng, {
        interactive: false, keyboard: false,
        icon: L.divIcon({ className: '', iconSize: [0, 0], html: `<div class="map-label">${esc(it.name)}</div>` }),
      }));
      if (++n >= 400) break;
    }
  }

  // ---------------------------------------------------------------- chips
  function renderChips(counts) {
    const allOn = state.cats.size === CATS.length;
    const fmt = n => (lang === 'ar' ? fmtNum(n) : n.toLocaleString('en'));
    let html = `<button class="chip all" data-ci="all" aria-pressed="${allOn}">${esc(t('all'))}</button>`;
    CATS.forEach((c, i) => {
      html += `<button class="chip" data-ci="${i}" aria-pressed="${state.cats.has(i)}">
        <span class="dot" style="background:${c.color}"></span>${esc(c[lang])} <span class="n">${fmt(counts[i])}</span></button>`;
    });
    els.chips.innerHTML = html;
  }
  els.chips.addEventListener('click', e => {
    const b = e.target.closest('.chip'); if (!b) return;
    if (b.dataset.ci === 'all') {
      state.cats = state.cats.size === CATS.length ? new Set() : new Set(CATS.map((_, i) => i));
    } else {
      const i = +b.dataset.ci;
      state.cats.has(i) ? state.cats.delete(i) : state.cats.add(i);
    }
    store.set('cats', [...state.cats]);
    refresh();
  });
  // Double-click a chip to show only that category.
  els.chips.addEventListener('dblclick', e => {
    const b = e.target.closest('.chip'); if (!b || b.dataset.ci === 'all') return;
    state.cats = new Set([+b.dataset.ci]);
    store.set('cats', [...state.cats]);
    refresh();
  });

  // ---------------------------------------------------------------- list
  function highlight(name) {
    const q = normalize(state.query);
    if (!q || !name) return esc(name || t('unnamed'));
    // Highlight tokens on the raw string by mapping normalized char positions back.
    const chars = [...name];
    const map_ = []; let normStr = '';
    chars.forEach((ch, idx) => {
      const n = normalize(ch);
      if (n) { for (const c of n) { normStr += c; map_.push(idx); } }
      else if (/\s/.test(ch)) { normStr += ' '; map_.push(idx); }
    });
    const mark = new Array(chars.length).fill(false);
    for (const tok of q.split(' ')) {
      if (!tok) continue;
      let from = 0, pos;
      while ((pos = normStr.indexOf(tok, from)) !== -1) {
        for (let k = pos; k < pos + tok.length; k++) mark[map_[k]] = true;
        from = pos + tok.length;
      }
    }
    let out = '', open = false;
    chars.forEach((ch, idx) => {
      if (mark[idx] && !open) { out += '<mark>'; open = true; }
      if (!mark[idx] && open) { out += '</mark>'; open = false; }
      out += esc(ch);
    });
    return out + (open ? '</mark>' : '');
  }

  function metaLine(it) {
    const parts = [esc(it.cat[lang])];
    if (it.type === 'line') parts.push(esc(t('length', t('km', it.length))));
    else if (it.near && it.near !== it.name) parts.push(esc(t('near', it.near, it.nearKm)));
    return parts.join(lang === 'ar' ? '، ' : ' · ');
  }

  function itemHTML(it) {
    const showDist = state.sort === 'distance' || state.userLoc;
    return `<li class="item${state.selected === it ? ' active' : ''}" data-id="${it.id}" role="option" tabindex="0">
      <span class="ico" style="background:${it.cat.color}">${svg(ICONS[it.cat.key])}</span>
      <span class="body"><div class="name">${highlight(it.name)}</div><div class="meta">${metaLine(it)}</div></span>
      ${showDist ? `<span class="dist">${esc(t('km', it._dist))}</span>` : ''}
    </li>`;
  }

  let observer = null;
  function renderList(coords, keepScroll) {
    const scroll = els.list.scrollTop;
    rendered = 0;
    let html = '';
    if (coords) {
      html += `<li class="item coord" data-coords="${coords.join(',')}" tabindex="0">
        <span class="ico">${svg(ICONS.coords)}</span>
        <span class="body"><div class="name">${esc(t('goToCoords'))}</div><div class="meta coords" dir="ltr">${fmtCoord(coords[0], coords[1])}</div></span></li>`;
    }
    els.list.innerHTML = html;
    appendPage();
    els.count.textContent = t('results', results.length);
    els.empty.hidden = results.length > 0 || !!coords;
    if (keepScroll) els.list.scrollTop = scroll; else els.list.scrollTop = 0;
  }
  function appendPage() {
    const old = els.list.querySelector('.sentinel'); if (old) old.remove();
    const slice = results.slice(rendered, rendered + PAGE);
    els.list.insertAdjacentHTML('beforeend', slice.map(itemHTML).join(''));
    rendered += slice.length;
    if (rendered < results.length) {
      const s = document.createElement('li'); s.className = 'sentinel';
      els.list.appendChild(s);
      observer ||= new IntersectionObserver(entries => { if (entries.some(e => e.isIntersecting)) appendPage(); }, { root: els.list, rootMargin: '400px' });
      observer.observe(s);
    }
  }
  const byId = id => items.find(i => i.id === id);
  els.list.addEventListener('click', e => {
    const li = e.target.closest('.item'); if (!li) return;
    if (li.dataset.coords) { const [a, b] = li.dataset.coords.split(',').map(Number); selectCoords(a, b); return; }
    const it = byId(li.dataset.id); if (it) select(it, { fly: true });
  });
  els.list.addEventListener('keydown', e => {
    if (e.key === 'Enter') e.target.closest('.item')?.click();
    if (e.key === 'ArrowDown') { e.preventDefault(); e.target.closest('.item')?.nextElementSibling?.focus(); }
    if (e.key === 'ArrowUp') { e.preventDefault(); (e.target.closest('.item')?.previousElementSibling || els.search).focus(); }
  });

  // ---------------------------------------------------------------- selection + detail
  function gmapsLink(lat, lng) { return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`; }
  function dirLink(lat, lng) { return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`; }

  function select(it, { fly = true, updateHash = true } = {}) {
    state.selected = it;
    selLayer.clearLayers();
    if (it.type === 'point') {
      const m = L.marker(it.latlng, { icon: selectedIcon(it.cat.color), zIndexOffset: 2000, keyboard: false }).addTo(selLayer);
      m.bindTooltip(esc(it.name || t('unnamed')), { permanent: true, direction: 'top', offset: [0, -44], className: 'tip sel' });
      if (fly) flyToVisible(it.latlng, Math.max(map.getZoom(), 13));
      else if (!visibleBounds().contains(it.latlng)) flyToVisible(it.latlng, map.getZoom());
    } else {
      (it.siblings || [it]).forEach(s => {
        L.polyline(s.pts, { color: '#fff', weight: 9, opacity: .9, interactive: false }).addTo(selLayer);
        L.polyline(s.pts, { color: it.cat.color === '#3C4043' ? '#1a73e8' : it.cat.color, weight: 5, opacity: 1, interactive: false }).addTo(selLayer);
      });
      if (fly) map.flyToBounds(it.bounds, { ...fitPadding(), duration: .8, maxZoom: 14 });
    }
    renderDetail(it);
    els.list.querySelectorAll('.item.active').forEach(n => n.classList.remove('active'));
    const li = els.list.querySelector(`[data-id="${it.id}"]`);
    if (li) { li.classList.add('active'); }
    if (updateHash) history.replaceState(null, '', '#' + it.id);
    if (isMobile()) { setSheet('half'); els.search.blur(); }
  }

  function selectCoords(lat, lng) {
    const it = {
      id: `@${lat},${lng}`, type: 'point', name: fmtCoord(lat, lng), latlng: [lat, lng], lat, lng,
      cat: { key: 'coords', ar: I18N.ar.coordsLabel, en: I18N.en.coordsLabel, color: '#1a73e8' }, near: '', desc: '',
    };
    // Nearest named place
    let best = null, bd = Infinity;
    for (const p of items) { if (p.type !== 'point' || !p.name) continue; const d = haversine(it.latlng, p.latlng); if (d < bd) { bd = d; best = p; } }
    if (best) { it.near = best.name; it.nearKm = Math.round(bd); }
    select(it, { fly: true, updateHash: false });
    history.replaceState(null, '', `#@${lat},${lng}`);
  }

  // Parts of the map covered by the panel (desktop side panel or mobile bottom sheet).
  function covered() {
    const size = map.getSize();
    if (isMobile()) {
      const sheet = Math.round(window.innerHeight * 0.55); // "half" sheet height
      return { left: 0, right: 0, top: 0, bottom: Math.min(sheet, size.y - 120) };
    }
    const w = els.panel.offsetWidth + 12;
    return document.documentElement.dir === 'rtl' ? { left: 0, right: w, top: 0, bottom: 0 } : { left: w, right: 0, top: 0, bottom: 0 };
  }
  function fitPadding() {
    const c = covered();
    return { paddingTopLeft: [c.left + 50, c.top + 50], paddingBottomRight: [c.right + 50, c.bottom + 50] };
  }
  function visibleBounds() {
    const c = covered(), size = map.getSize();
    return L.latLngBounds(
      map.containerPointToLatLng([c.left + 20, size.y - c.bottom - 20]),
      map.containerPointToLatLng([size.x - c.right - 20, c.top + 20]));
  }
  // Fly so that the point lands in the middle of the uncovered part of the map.
  function flyToVisible(latlng, zoom) {
    const c = covered();
    const shift = L.point((c.right - c.left) / 2, (c.bottom - c.top) / 2);
    const target = map.unproject(map.project(latlng, zoom).add(shift), zoom);
    map.flyTo(target, zoom, { duration: .8 });
  }

  function renderDetail(it) {
    const facts = [];
    if (it.cat.key !== 'coords') facts.push(`<li>${svg(UI_ICONS.pin)}<span class="coords" dir="ltr">${fmtCoord(it.lat, it.lng)}</span></li>`);
    if (it.type === 'line') facts.push(`<li>${svg(UI_ICONS.ruler)}<span>${esc(t('length', t('km', it.length)))}</span></li>`);
    if (it.near && it.near !== it.name) facts.push(`<li>${svg(ICONS.towns)}<span>${esc(t('near', it.near, it.nearKm))}</span></li>`);
    if (state.userLoc) facts.push(`<li>${svg(UI_ICONS.nav)}<span>${esc(t('fromYou', t('km', haversine(state.userLoc, it.latlng))))}</span></li>`);
    els.detail.innerHTML = `
      <div class="detail-head">
        <h2>${esc(it.name || t('unnamed'))}</h2>
        <button class="icon-btn" data-act="close" aria-label="${esc(t('close'))}">${svg(UI_ICONS.close)}</button>
      </div>
      <div class="badge"><span class="dot" style="background:${it.cat.color}"></span>${esc(it.cat[lang])}</div>
      ${it.desc ? `<p class="desc">${esc(it.desc)}</p>` : ''}
      <ul class="facts">${facts.join('')}</ul>
      <div class="actions">
        <a class="action primary" target="_blank" rel="noopener" href="${dirLink(it.lat, it.lng)}">${svg(UI_ICONS.directions)}${esc(t('directions'))}</a>
        <a class="action" target="_blank" rel="noopener" href="${gmapsLink(it.lat, it.lng)}">${svg(UI_ICONS.open)}Google Maps</a>
        <button class="action" data-act="copy">${svg(UI_ICONS.copy)}${esc(t('copy'))}</button>
        <button class="action" data-act="share">${svg(UI_ICONS.share)}${esc(t('share'))}</button>
      </div>`;
    els.detail.hidden = false;
    els.detail.scrollTop = 0;
  }

  function clearSelection() {
    state.selected = null;
    selLayer.clearLayers();
    els.detail.hidden = true;
    els.list.querySelectorAll('.item.active').forEach(n => n.classList.remove('active'));
    history.replaceState(null, '', location.pathname + location.search);
  }

  els.detail.addEventListener('click', async e => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    const it = state.selected; if (!it) return;
    if (b.dataset.act === 'close') clearSelection();
    if (b.dataset.act === 'copy') copy(fmtCoord(it.lat, it.lng), t('copied'));
    if (b.dataset.act === 'share') {
      const url = location.href;
      if (navigator.share) { try { await navigator.share({ title: it.name, url }); return; } catch { /* cancelled */ return; } }
      copy(url, t('linkCopied'));
    }
  });

  async function copy(text, msg) {
    try { await navigator.clipboard.writeText(text); }
    catch {
      const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); } catch { /* ignore */ } ta.remove();
    }
    toast(msg);
  }
  let toastTimer;
  function toast(msg) {
    els.toast.textContent = msg; els.toast.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => els.toast.classList.remove('show'), 1800);
  }

  // ---------------------------------------------------------------- search input
  let searchTimer;
  els.search.addEventListener('input', () => {
    els.clear.hidden = !els.search.value;
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      state.query = els.search.value;
      matchedCache = null;
      if (state.query.trim() && state.sort === 'name') { /* keep user's choice */ }
      refresh();
    }, 140);
  });
  els.search.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const first = els.list.querySelector('.item');
      if (first) first.click();
      els.search.blur();
    }
    if (e.key === 'ArrowDown') { e.preventDefault(); els.list.querySelector('.item')?.focus(); }
    if (e.key === 'Escape') { els.search.value = ''; els.search.dispatchEvent(new Event('input')); }
  });
  els.search.addEventListener('focus', () => { if (isMobile()) setSheet('full'); });
  els.clear.addEventListener('click', () => {
    els.search.value = ''; els.search.dispatchEvent(new Event('input')); els.search.focus();
  });
  document.addEventListener('keydown', e => {
    if (e.key === '/' && document.activeElement !== els.search) { e.preventDefault(); els.search.focus(); }
    if (e.key === 'Escape' && document.activeElement !== els.search && state.selected) clearSelection();
  });

  els.inView.checked = state.inView;
  els.inView.addEventListener('change', () => { state.inView = els.inView.checked; store.set('inView', state.inView); refresh({ mapToo: false }); });
  els.sort.addEventListener('change', () => { state.sort = els.sort.value; refresh({ mapToo: false }); });

  let moveTimer;
  map.on('moveend', () => {
    renderLabels();
    if (!state.inView && state.sort !== 'distance') return;
    clearTimeout(moveTimer);
    moveTimer = setTimeout(() => refresh({ mapToo: false }), 200);
  });
  map.on('click', () => { if (isMobile() && els.panel.dataset.state !== 'peek') setSheet('peek'); });

  // ---------------------------------------------------------------- map controls
  els.zoomIn.addEventListener('click', () => map.zoomIn());
  els.zoomOut.addEventListener('click', () => map.zoomOut());
  els.layerBtn.addEventListener('click', e => { e.stopPropagation(); els.layerMenu.hidden = !els.layerMenu.hidden; });
  document.addEventListener('click', e => { if (!els.layerMenu.hidden && !e.target.closest('.layer-picker')) els.layerMenu.hidden = true; });
  function renderBasemapButtons() {
    els.basemaps.innerHTML = ['streets', 'satellite', 'terrain'].map(k =>
      `<button class="basemap" data-key="${k}" aria-pressed="${state.basemap === k}"><span class="thumb ${k}"></span>${esc(t(k))}</button>`).join('');
  }
  els.basemaps.addEventListener('click', e => { const b = e.target.closest('.basemap'); if (b) setBasemap(b.dataset.key); });
  els.showLabels.checked = state.labels;
  els.showLabels.addEventListener('change', () => { state.labels = els.showLabels.checked; store.set('labels', state.labels); renderLabels(); if (state.labels && map.getZoom() < 12) map.setZoom(12); });

  els.locate.addEventListener('click', () => {
    if (!navigator.geolocation) return toast(t('locError'));
    toast(t('locating'));
    navigator.geolocation.getCurrentPosition(pos => {
      state.userLoc = [pos.coords.latitude, pos.coords.longitude];
      if (userMarker) userMarker.remove();
      userMarker = L.marker(state.userLoc, { icon: L.divIcon({ className: '', iconSize: [18, 18], html: '<div class="my-loc"></div>' }), zIndexOffset: 3000, interactive: false }).addTo(map);
      els.locate.classList.add('on');
      map.flyTo(state.userLoc, Math.max(map.getZoom(), 11));
      state.sort = 'distance'; els.sort.value = 'distance';
      refresh({ mapToo: false });
      if (state.selected) renderDetail(state.selected);
    }, () => toast(t('locError')), { enableHighAccuracy: true, timeout: 12000 });
  });

  // ---------------------------------------------------------------- mobile sheet
  function setSheet(s) { els.panel.dataset.state = s; setTimeout(() => map.invalidateSize(), 260); }
  const ORDER = ['peek', 'half', 'full'];
  els.handle.addEventListener('click', () => {
    const i = ORDER.indexOf(els.panel.dataset.state);
    setSheet(ORDER[(i + 1) % ORDER.length]);
  });
  let touchY = null;
  els.handle.addEventListener('touchstart', e => { touchY = e.touches[0].clientY; }, { passive: true });
  els.handle.addEventListener('touchend', e => {
    if (touchY == null) return;
    const dy = e.changedTouches[0].clientY - touchY; touchY = null;
    if (Math.abs(dy) < 30) return;
    const i = ORDER.indexOf(els.panel.dataset.state);
    setSheet(ORDER[Math.max(0, Math.min(2, i + (dy < 0 ? 1 : -1)))]);
    e.preventDefault();
  });

  // ---------------------------------------------------------------- language
  function applyLang() {
    const L_ = I18N[lang];
    document.documentElement.lang = lang;
    document.documentElement.dir = L_.dir;
    document.title = L_.title;
    els.lang.textContent = L_.other;
    els.lang.setAttribute('aria-label', lang === 'ar' ? 'English' : 'العربية');
    document.querySelectorAll('[data-i18n]').forEach(n => { n.textContent = t(n.dataset.i18n); });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(n => { n.placeholder = t(n.dataset.i18nPlaceholder); });
    document.querySelectorAll('[data-i18n-title]').forEach(n => { n.title = t(n.dataset.i18nTitle); n.setAttribute('aria-label', n.title); });
    // Attribution sits on the side away from the panel.
    attribution.remove();
    attribution = L.control.attribution({ prefix: false, position: L_.dir === 'rtl' ? 'topleft' : 'topright' }).addTo(map);
    baseLayers.forEach(l => { map.removeLayer(l); l.addTo(map).bringToBack(); });
    renderBasemapButtons();
  }
  els.lang.addEventListener('click', () => {
    lang = lang === 'ar' ? 'en' : 'ar'; store.set('lang', lang);
    applyLang();
    cluster.refreshClusters();
    refresh({ keepScroll: true, mapToo: false });
    if (state.selected) renderDetail(state.selected);
  });

  // ---------------------------------------------------------------- hash routing
  function fromHash() {
    const h = decodeURIComponent(location.hash.slice(1));
    if (!h) return;
    if (h.startsWith('@')) { const c = parseCoords(h.slice(1)); if (c) selectCoords(c[0], c[1]); return; }
    const it = byId(h);
    if (it) select(it.hidden && it.name ? (items.find(x => x.siblings && x.siblings.includes(it)) || it) : it, { fly: true, updateHash: false });
  }
  window.addEventListener('hashchange', fromHash);

  // ---------------------------------------------------------------- boot
  (async () => {
    els.panel.dataset.state = 'peek';
    renderBasemapButtons();
    applyLang();
    setBasemap(state.basemap);
    try {
      await load();
    } catch (err) {
      els.loading.innerHTML = `<span>Failed to load data: ${esc(err.message)}</span>`;
      return;
    }
    refresh();
    els.loading.classList.add('done');
    fromHash();
  })();
})();
