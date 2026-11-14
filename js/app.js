/* Riyadh wild map — interactive browser for the "خريطة الرياض البرية" Google My Maps data,
   plus Saudi regions, major cities, nature reserves and live weather (Open-Meteo). */
(() => {
  'use strict';

  // ---------------------------------------------------------------- i18n
  const I18N = {
    ar: {
      dir: 'rtl', other: 'EN',
      title: 'خريطة الرياض البرية',
      searchPlaceholder: 'ابحث عن ماء سبيل، روضة، جبل، محمية، مدينة…',
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
      youAreHere: 'أنت هنا', myLocTitle: 'موقعي الحالي', accuracy: m => `دقة الموقع ± ${fmtNum(Math.round(m))} م`,
      region: name => `منطقة ${name}`, capital: name => `العاصمة: ${name}`,
      areaKm: a => `المساحة ≈ ${fmtNum(a.toLocaleString('en'))} كم²`,
      placesInside: n => `${fmtNum(n)} موقعاً من هذه الخريطة داخل المنطقة`,
      majorCity: 'مدينة رئيسية', royalReserve: 'محمية ملكية', ncwReserve: 'منطقة محمية (المركز الوطني لتنمية الحياة الفطرية)',
      insideReserve: name => `داخل ${name}`,
      nearReserve: (name, d) => `قريب من ${name} (≈ ${d})`,
      reserveNote: 'قد تحتاج إلى تصريح للتخييم أو الدخول. راجع قواعد المحمية قبل الزيارة.',
      viewRules: 'عرض القواعد',
      allowed: 'المسموح', notAllowed: 'غير المسموح', permits: 'التصاريح', generalRules: 'أنظمة عامة في كل البر',
      website: 'الموقع الرسمي', sources: 'المصادر', checkOfficial: d => `جُمعت هذه المعلومات من مصادر رسمية وعامة بتاريخ ${d}. الأنظمة تتغير، فتأكد من الجهة الرسمية قبل الزيارة.`,
      secondary: 'مصدر غير رسمي', noInfo: 'لم نجد معلومات منشورة.',
      pointOnly: 'حدود المحمية غير متوفرة، يظهر موقعها فقط.',
      sabilName: 'ماء سبيل', sabilAdded: d => `أُضيف إلى القائمة في ${d}`, sabilSource: 'من قائمة «مارد ماء» العامة على Google Maps',
      sabilNote: 'نقاط ماء يضيفها متطوعون. تأكد من توفر الماء قبل الاعتماد عليه، واحمل احتياطك دائماً.',
      noLocation: 'لم نتمكن من التحقق من موقع هذه المحمية من مصدر مفتوح، لذلك لا تظهر على الخريطة.',
      // weather
      weather: 'الطقس', wxLoading: 'جارٍ جلب الطقس…', wxError: 'تعذّر جلب الطقس الآن. حاول لاحقاً.',
      feels: v => `المحسوسة ${v}`, humidity: v => `الرطوبة ${v}`, wind: (v, dir) => `الرياح ${v} كم/س ${dir}`,
      gusts: v => `هبّات حتى ${v} كم/س`, rainMm: v => `${fmtNum(v)} مم`,
      today: 'اليوم', wxSource: 'بيانات الطقس: Open-Meteo',
      dustWarn: 'رياح قوية متوقعة، احتمال غبار وأتربة. ثبّت الخيام جيداً.',
      coldWarn: v => `ليلة باردة: الصغرى ${v}°. جهّز ملابس وأغطية دافئة.`,
      hotWarn: v => `حر شديد: العظمى ${v}°. تجنّب الحركة وقت الظهيرة واحمل ماءً كافياً.`,
      rainNext: (mm, p) => `أمطار متوقعة خلال ٣ أيام: ${fmtNum(mm)} مم (احتمال ${fmtNum(p)}٪)`,
      rainPast: (d3, d7, d30) => `الأمطار الماضية: ٣ أيام ${fmtNum(d3)} مم، ٧ أيام ${fmtNum(d7)} مم، ٣٠ يوماً ${fmtNum(d30)} مم`,
      // water insight
      water: 'حالة المياه (تقدير)', waterLoading: 'جارٍ تحليل الأمطار ومسار السيول…',
      channel: 'مجرى وادٍ / شعيب', basin: 'منخفض يجمع المياه (روضة / خبراء / قاع)',
      st_flowing: 'غالباً يجري الآن أو جرى قبل أيام', st_filled: 'غالباً ممتلئ بالمياه',
      st_wet: 'غالباً توجد مياه أو برك متفرقة', st_maybe: 'قد توجد بقايا مياه أو طين في الأجزاء المنخفضة',
      st_dry: 'غالباً جاف',
      upstreamFrom: (dir, m) => `تأتي المياه إلى هذا الموقع من جهة ${dir} (الأرض أعلى بنحو ${fmtNum(m)} م)`,
      noUpstream: 'الموقع مرتفع نسبياً عمّا حوله، فلا يستقبل جرياناً من الجوار ويعتمد على المطر الساقط عليه.',
      catchRain: (d3, d7, d30) => `مطر الحوض الأعلى: ٣ أيام ${fmtNum(d3)} مم، ٧ أيام ${fmtNum(d7)} مم، ٣٠ يوماً ${fmtNum(d30)} مم`,
      siteRain: (d3, d7, d30) => `مطر الموقع: ٣ أيام ${fmtNum(d3)} مم، ٧ أيام ${fmtNum(d7)} مم، ٣٠ يوماً ${fmtNum(d30)} مم`,
      floodWarn: 'تحذير: أمطار متوقعة على الموقع أو أعلى الوادي. لا تخيّم في بطن الوادي أو مجرى السيل، فالسيول قد تصل من أمطار بعيدة دون مطر عندك.',
      flowNajd: 'في نجد تنحدر الأرض عموماً من الغرب (الدرع العربي وجبال طويق) نحو الشرق، فتجري الأودية شرقاً وجنوباً شرقياً وتتجمع المياه في الروضات والخباري والقيعان وتبقى فيها أياماً أو أسابيع بعد المطر.',
      waterDisclaimer: 'تقدير آلي من بيانات أمطار نموذجية وارتفاعات الأرض، وليس رصداً ميدانياً.',
      dirs: ['الشمال', 'الشمال الشرقي', 'الشرق', 'الجنوب الشرقي', 'الجنوب', 'الجنوب الغربي', 'الغرب', 'الشمال الغربي'],
      wmo: { 0: 'صحو', 1: 'صحو غالباً', 2: 'غائم جزئياً', 3: 'غائم', 45: 'ضباب', 48: 'ضباب', 51: 'رذاذ خفيف', 53: 'رذاذ', 55: 'رذاذ كثيف', 61: 'مطر خفيف', 63: 'مطر', 65: 'مطر غزير', 66: 'مطر متجمد', 67: 'مطر متجمد', 71: 'ثلج خفيف', 73: 'ثلج', 75: 'ثلج كثيف', 77: 'حبيبات ثلج', 80: 'زخات خفيفة', 81: 'زخات', 82: 'زخات غزيرة', 85: 'زخات ثلج', 86: 'زخات ثلج', 95: 'عواصف رعدية', 96: 'عواصف رعدية وبَرَد', 99: 'عواصف رعدية وبَرَد' },
    },
    en: {
      dir: 'ltr', other: 'ع',
      title: 'Riyadh Wild Map',
      searchPlaceholder: 'Search water points, rawdas, reserves, cities…',
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
      youAreHere: 'You are here', myLocTitle: 'My current location', accuracy: m => `Accuracy ± ${Math.round(m)} m`,
      region: name => `${name} Region`, capital: name => `Capital: ${name}`,
      areaKm: a => `Area ≈ ${a.toLocaleString('en')} km²`,
      placesInside: n => `${n.toLocaleString('en')} places from this map are in this region`,
      majorCity: 'Major city', royalReserve: 'Royal reserve', ncwReserve: 'Protected area (National Center for Wildlife)',
      insideReserve: name => `Inside ${name}`,
      nearReserve: (name, d) => `Near ${name} (≈ ${d})`,
      reserveNote: 'You may need a permit to enter or camp. Check the reserve rules before you go.',
      viewRules: 'View rules',
      allowed: 'Allowed', notAllowed: 'Not allowed', permits: 'Permits', generalRules: 'Rules everywhere in the wild',
      website: 'Official website', sources: 'Sources', checkOfficial: d => `Collected from official and public sources on ${d}. Rules change, so confirm with the official authority before you visit.`,
      secondary: 'non-official source', noInfo: 'No published information found.',
      pointOnly: 'The reserve boundary is not available; only its location is shown.',
      sabilName: 'Free water (sabil)', sabilAdded: d => `Added to the list on ${d}`, sabilSource: 'From the public Google Maps list “مارد ماء”',
      sabilNote: 'Water points added by volunteers. Confirm the water is available before relying on it, and always carry a reserve.',
      noLocation: 'We could not verify this reserve’s location from an open source, so it is not shown on the map.',
      weather: 'Weather', wxLoading: 'Loading weather…', wxError: 'Could not load the weather right now. Try again later.',
      feels: v => `Feels like ${v}`, humidity: v => `Humidity ${v}`, wind: (v, dir) => `Wind ${v} km/h ${dir}`,
      gusts: v => `gusts up to ${v} km/h`, rainMm: v => `${v} mm`,
      today: 'Today', wxSource: 'Weather data: Open-Meteo',
      dustWarn: 'Strong wind expected; dust is likely. Secure your tents.',
      coldWarn: v => `Cold night: low of ${v}°. Bring warm clothes and blankets.`,
      hotWarn: v => `Extreme heat: high of ${v}°. Avoid midday activity and carry plenty of water.`,
      rainNext: (mm, p) => `Rain expected in the next 3 days: ${mm} mm (${p}% chance)`,
      rainPast: (d3, d7, d30) => `Past rain: 3 days ${d3} mm · 7 days ${d7} mm · 30 days ${d30} mm`,
      water: 'Water status (estimate)', waterLoading: 'Analysing rainfall and water flow…',
      channel: 'Valley channel (wadi / shuaib)', basin: 'Basin that collects water (rawda / khabra / qa)',
      st_flowing: 'Likely flowing now or in the last few days', st_filled: 'Likely filled with water',
      st_wet: 'Likely has water or scattered pools', st_maybe: 'May hold leftover water or mud in low spots',
      st_dry: 'Likely dry',
      upstreamFrom: (dir, m) => `Water reaches this spot from the ${dir} (ground about ${m} m higher)`,
      noUpstream: 'This spot is higher than its surroundings, so it gets no run-off from nearby and depends on rain falling on it.',
      catchRain: (d3, d7, d30) => `Upstream rain: 3 days ${d3} mm · 7 days ${d7} mm · 30 days ${d30} mm`,
      siteRain: (d3, d7, d30) => `Rain on site: 3 days ${d3} mm · 7 days ${d7} mm · 30 days ${d30} mm`,
      floodWarn: 'Warning: rain is forecast here or upstream. Do not camp in the valley bed or a flood channel; floods can arrive from distant rain even when it is dry where you are.',
      flowNajd: 'In Najd the land generally slopes from the west (the Arabian Shield and the Tuwaiq escarpment) down to the east, so valleys drain east and south-east and water collects in rawdas, khabras and qa basins, where it can stay for days or weeks after rain.',
      waterDisclaimer: 'Automatic estimate from modelled rainfall and terrain height, not a field observation.',
      dirs: ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'],
      wmo: { 0: 'Clear', 1: 'Mostly clear', 2: 'Partly cloudy', 3: 'Cloudy', 45: 'Fog', 48: 'Fog', 51: 'Light drizzle', 53: 'Drizzle', 55: 'Heavy drizzle', 61: 'Light rain', 63: 'Rain', 65: 'Heavy rain', 66: 'Freezing rain', 67: 'Freezing rain', 71: 'Light snow', 73: 'Snow', 75: 'Heavy snow', 77: 'Snow grains', 80: 'Light showers', 81: 'Showers', 82: 'Heavy showers', 85: 'Snow showers', 86: 'Snow showers', 95: 'Thunderstorms', 96: 'Thunderstorms with hail', 99: 'Thunderstorms with hail' },
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
  const num = n => (lang === 'ar' ? fmtNum(n) : String(n));

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
    cities: 'M15 11V5l-3-3-3 3v2H3v14h18V11h-6zm-8 8H5v-2h2v2zm0-4H5v-2h2v2zm0-4H5V9h2v2zm6 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V9h2v2zm0-4h-2V5h2v2zm6 12h-2v-2h2v2zm0-4h-2v-2h2v2z',
    provinces: 'M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z',
    reserves: 'M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z',
    coords: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm8.94 3A8.994 8.994 0 0 0 13 3.06V1h-2v2.06A8.994 8.994 0 0 0 3.06 11H1v2h2.06A8.994 8.994 0 0 0 11 20.94V23h2v-2.06A8.994 8.994 0 0 0 20.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z',
    sabil: 'M3 2l2.01 18.23C5.13 21.23 5.97 22 7 22h10c1.03 0 1.87-.77 1.99-1.77L21 2H3zm9 17c-1.66 0-3-1.34-3-3 0-2 3-5.4 3-5.4s3 3.4 3 5.4c0 1.66-1.34 3-3 3zm6.33-11H5.67l-.44-4h13.53l-.43 4z',
    me: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
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
    warn: 'M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z',
    check: 'M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z',
    block: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM4 12c0-4.42 3.58-8 8-8 1.85 0 3.55.63 4.9 1.69L5.69 16.9A7.902 7.902 0 0 1 4 12zm8 8c-1.85 0-3.55-.63-4.9-1.69L18.31 7.1A7.902 7.902 0 0 1 20 12c0 4.42-3.58 8-8 8z',
    doc: 'M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z',
    link: 'M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z',
  };
  // Weather glyphs (multi-colour, so full SVG markup rather than a single path)
  const CLOUD = '<path d="M7 18h10a4 4 0 0 0 .6-7.95A5.5 5.5 0 0 0 7.1 9.5 4.25 4.25 0 0 0 7 18z" fill="#9AA5B1"/>';
  const WX_SVG = {
    sun: '<circle cx="12" cy="12" r="4.5" fill="#F5A524"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" stroke="#F5A524" stroke-width="2" stroke-linecap="round"/>',
    partly: '<circle cx="8.5" cy="8" r="3.5" fill="#F5A524"/><path d="M8.5 1.8v1.6M2.3 8h1.6M4.1 3.6l1.1 1.1M12.9 3.6l-1.1 1.1" stroke="#F5A524" stroke-width="1.6" stroke-linecap="round"/>' + CLOUD,
    cloud: CLOUD,
    fog: '<path d="M3 8h18M5 12h14M3 16h18M7 20h10" stroke="#9AA5B1" stroke-width="2" stroke-linecap="round"/>',
    rain: '<g transform="translate(0 -2)">' + CLOUD + '</g><path d="M9 19l-1 3M13 19l-1 3M17 19l-1 3" stroke="#2F80ED" stroke-width="2" stroke-linecap="round"/>',
    storm: '<g transform="translate(0 -2)">' + CLOUD + '</g><path d="M13 15l-3 4.5h2.6L11.5 23l4-5.2h-2.6L14 15z" fill="#F5A524"/>',
    snow: '<g transform="translate(0 -2)">' + CLOUD + '</g><circle cx="9" cy="20" r="1.2" fill="#7FB2F0"/><circle cx="13" cy="21.5" r="1.2" fill="#7FB2F0"/><circle cx="17" cy="20" r="1.2" fill="#7FB2F0"/>',
  };
  function wxGlyph(code) {
    const k = code === 0 || code === 1 ? 'sun' : code === 2 ? 'partly' : code === 3 ? 'cloud' : code === 45 || code === 48 ? 'fog'
      : (code >= 71 && code <= 77) || code === 85 || code === 86 ? 'snow' : code >= 95 ? 'storm' : code >= 51 ? 'rain' : 'cloud';
    return `<svg viewBox="0 0 24 24" class="wx-ico" aria-hidden="true">${WX_SVG[k]}</svg>`;
  }

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
    return score - n.length * 0.01 + (item.boost || 0); // prefer shorter names on ties
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
  // Point `km` away from [lat,lng] along `bearing` degrees (flat-earth approximation, fine for < 50 km).
  function offset([lat, lng], km, bearing) {
    const b = bearing * Math.PI / 180;
    return [lat + (km / 110.57) * Math.cos(b), lng + (km / (111.32 * Math.cos(lat * Math.PI / 180))) * Math.sin(b)];
  }
  // polys: [[ring, hole, ...], ...] with rings of [lat, lng]
  function inRing(p, ring) {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [yi, xi] = ring[i], [yj, xj] = ring[j];
      if ((yi > p[0]) !== (yj > p[0]) && p[1] < (xj - xi) * (p[0] - yi) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  }
  function inPolys(p, polys) {
    return polys.some(rings => inRing(p, rings[0]) && !rings.slice(1).some(h => inRing(p, h)));
  }
  const fmtCoord = (lat, lng) => `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const safeUrl = u => (/^https?:\/\//i.test(u || '') ? u : null);

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
    userAcc: null,
    basemap: store.get('basemap', 'satellite'),
    labels: store.get('labels', false),
  };
  let CATS = [];
  const CAT = {};          // key -> category
  let items = [];          // all searchable items
  const itemsById = new Map();
  let provinces = [];      // province items
  let reserves = [];       // reserve items
  let reserveInfo = null;  // reserves.json (general rules, date)
  let sabilSource = null;  // Google Maps list URL
  let FIRST_EXTRA = 0;     // index of the first category not from the Google My Maps export
  let results = [];
  let rendered = 0;
  const PAGE = 60;

  // Categories that are not part of the Google My Maps export.
  const EXTRA_CATS = [
    { key: 'sabil', ar: 'ماء سبيل', en: 'Free water', color: '#0891B2' },
    { key: 'reserves', ar: 'المحميات', en: 'Nature reserves', color: '#3F7D20' },
    { key: 'cities', ar: 'المدن الرئيسية', en: 'Major cities', color: '#1F2937' },
    { key: 'provinces', ar: 'المناطق الإدارية', en: 'Regions', color: '#C2410C' },
  ];

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
    restyleAreas();
  }

  // Panes keep the stacking order: regions under reserves under tracks under markers.
  map.createPane('regions').style.zIndex = 380;
  map.createPane('reserves').style.zIndex = 390;

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
        html: `<div class="cluster ${cls}" style="width:${size}px;height:${size}px">${num(n)}</div>`,
        className: '', iconSize: [size, size],
      });
    },
  }).addTo(map);
  const areaLayer = L.layerGroup().addTo(map);    // provinces + reserves polygons
  const lineLayer = L.layerGroup().addTo(map);
  const overlayLayer = L.layerGroup().addTo(map); // cities, reserve badges, region labels
  const labelLayer = L.layerGroup().addTo(map);
  const selLayer = L.layerGroup().addTo(map);
  const meLayer = L.layerGroup().addTo(map);

  const iconCache = {};
  function pointIcon(cat) {
    if (iconCache[cat.key]) return iconCache[cat.key];
    let icon;
    if (cat.key === 'sabil') {
      icon = L.divIcon({ className: '', iconSize: [22, 22], html: `<div class="pin-sabil" style="background:${cat.color}">${svg(ICONS.sabil)}</div>` });
    } else if (cat.key === 'heritage') {
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

  // Zoom classes drive which region/city/reserve labels are visible (see CSS).
  function zoomClasses() {
    const z = map.getZoom(), c = map.getContainer().classList;
    c.toggle('z-ge7', z >= 7); c.toggle('z-ge8', z >= 8); c.toggle('z-ge9', z >= 9); c.toggle('z-ge10', z >= 10);
  }
  map.on('zoomend', zoomClasses);
  zoomClasses();

  // ---------------------------------------------------------------- data loading
  function addItem(it) {
    it.norm = normalize(it.name + (it.alt ? ' ' + it.alt : ''));
    it.words = it.norm.split(' ');
    items.push(it); itemsById.set(it.id, it);
    return it;
  }

  async function fetchJSON(url, optional = false) {
    try {
      const r = await fetch(url);
      if (!r.ok) throw new Error(`${url}: ${r.status}`);
      return await r.json();
    } catch (e) {
      if (optional) { console.warn(e); return null; }
      throw e;
    }
  }

  async function load() {
    const [places, lines, regions, res, sabil] = await Promise.all([
      fetchJSON('data/places.json'), fetchJSON('data/lines.json'),
      fetchJSON('data/regions.json', true), fetchJSON('data/reserves.json', true), fetchJSON('data/sabil.json', true),
    ]);
    FIRST_EXTRA = places.meta.categories.length;
    CATS = [...places.meta.categories, ...EXTRA_CATS];
    CATS.forEach((c, i) => { c.i = i; CAT[c.key] = c; });
    els.source.href = places.meta.source;
    const savedKeys = store.get('catKeys', null);
    state.cats = new Set(savedKeys ? CATS.filter(c => savedKeys.includes(c.key)).map(c => c.i) : CATS.map(c => c.i));
    // Categories added after a visitor saved their filter start switched on.
    const seen = store.get('catSeen', null);
    if (seen) CATS.forEach(c => { if (!seen.includes(c.key)) state.cats.add(c.i); });
    store.set('catSeen', CATS.map(c => c.key));

    places.points.forEach(([name, ci, lat, lng, near, nearKm, desc], i) => {
      const cat = CATS[ci];
      const item = addItem({ id: 'p' + i, type: 'point', name, ci, cat, lat, lng, near, nearKm, desc, latlng: [lat, lng] });
      item.marker = L.marker([lat, lng], { icon: pointIcon(cat), title: name, keyboard: false });
      item.marker.on('click', () => select(item, { fly: false }));
      item.marker.bindTooltip(esc(name || t('unnamed')), { direction: 'top', offset: [0, -8], className: 'tip' });
    });

    lines.lines.forEach(([name, ci, pts], i) => {
      const cat = CATS[ci];
      const isRoad = cat.key === 'roads';
      const poly = L.polyline(pts, { color: cat.color, weight: isRoad ? 3 : 2.5, opacity: .9, dashArray: isRoad ? null : '6 5' });
      const bounds = poly.getBounds();
      let length = 0;
      for (let k = 1; k < pts.length; k++) length += haversine(pts[k - 1], pts[k]);
      const mid = pts[Math.floor(pts.length / 2)];
      const item = addItem({
        id: 'l' + i, type: 'line', name, ci, cat, lat: mid[0], lng: mid[1], latlng: mid,
        pts, bounds, length, poly, near: '', nearKm: null, desc: '',
      });
      poly.on('click', e => { L.DomEvent.stopPropagation(e); select(item, { fly: false }); });
      poly.bindTooltip(esc(name || cat[lang]), { sticky: true, className: 'tip' });
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
    for (const it of items) {
      if (it.type === 'line' && it.hidden && it.name) {
        const head = byName.get(it.ci + '|' + it.norm);
        it.head = head;
        it.poly.off('click').on('click', e => { L.DomEvent.stopPropagation(e); select(head, { fly: false }); });
      }
    }

    if (regions) loadRegions(regions);
    if (res) loadReserves(res);
    if (sabil) loadSabil(sabil);
  }

  function loadRegions(data) {
    const pc = CAT.provinces, cc = CAT.cities;
    for (const p of data.provinces) {
      const poly = L.polygon(p.poly, { pane: 'regions', interactive: false, fill: false, weight: 2, dashArray: '8 6' });
      const label = L.marker(p.label, {
        pane: 'regions', keyboard: false,
        icon: L.divIcon({ className: '', iconSize: [0, 0], html: `<div class="prov-label" data-ar="${esc(p.ar)}" data-en="${esc(p.en)}">${esc(lang === 'ar' ? p.ar : p.en)}</div>` }),
      });
      const it = addItem({
        id: 'r' + p.iso, type: 'area', kind: 'province', ci: pc.i, cat: pc,
        name: p.ar, alt: `${p.en} منطقة ${p.ar}`, nameEn: p.en, capital: [p.capital_ar, p.capital_en], area: p.area_km2,
        polys: p.poly, poly, layers: [poly, label], bounds: poly.getBounds(),
        lat: p.label[0], lng: p.label[1], latlng: p.label, near: '', desc: '',
      });
      label.on('click', () => select(it, { fly: true }));
      provinces.push(it);
    }
    data.cities.forEach((c, i) => {
      const marker = L.marker([c.lat, c.lng], {
        keyboard: false, zIndexOffset: 500,
        icon: L.divIcon({ className: '', iconSize: [16, 16], html: `<div class="pin-city r${c.rank}"></div>` }),
      });
      marker.bindTooltip(esc(lang === 'ar' ? c.ar : c.en), { permanent: true, direction: 'right', offset: [8, 0], className: `city-label r${c.rank}` });
      const it = addItem({
        id: 'c' + i, type: 'city', ci: cc.i, cat: cc, name: c.ar, alt: c.en, nameEn: c.en, rank: c.rank,
        lat: c.lat, lng: c.lng, latlng: [c.lat, c.lng], marker, layers: [marker], near: '', desc: '', boost: 4 - c.rank,
      });
      marker.on('click', () => select(it, { fly: false }));
    });
  }

  function loadSabil(data) {
    sabilSource = data.source;
    const sc = CAT.sabil;
    data.points.forEach(([name, note, lat, lng, near, nearKm, added], i) => {
      const it = addItem({
        id: 's' + i, type: 'point', ci: sc.i, cat: sc, name: name || I18N.ar.sabilName, alt: 'ماء سبيل مارد ماء sabil water',
        nameEn: name ? null : I18N.en.sabilName, generic: !name,
        lat, lng, latlng: [lat, lng], near, nearKm, desc: note, added,
      });
      it.marker = L.marker([lat, lng], { icon: pointIcon(sc), title: it.name, keyboard: false, zIndexOffset: 300 });
      it.marker.on('click', () => select(it, { fly: false }));
      it.marker.bindTooltip(esc(it.name), { direction: 'top', offset: [0, -10], className: 'tip' });
    });
  }

  function loadReserves(data) {
    reserveInfo = data;
    const rc = CAT.reserves;
    for (const r of data.reserves) {
      if (!r.center) {
        // Listed with its rules, but not placed on the map.
        reserves.push(addItem({
          id: 'n' + r.key, type: 'area', kind: 'reserve', ci: rc.i, cat: rc, noLoc: true,
          name: r.name_ar, alt: `${r.name_en || ''} محمية`, nameEn: r.name_en, info: r,
          polys: null, poly: null, layers: [], radius: null, bounds: null, latlng: null, near: '', desc: '', boost: 1,
        }));
        continue;
      }
      const layers = [];
      let poly = null;
      if (r.poly && r.poly.length) {
        poly = L.polygon(r.poly, { pane: 'reserves', weight: 2, color: rc.color, fillColor: rc.color, fillOpacity: .12 });
        layers.push(poly);
      }
      const badge = L.marker(r.center, {
        keyboard: false, zIndexOffset: 400,
        icon: L.divIcon({ className: '', iconSize: [26, 26], html: `<div class="pin-reserve ${r.type}">${svg(ICONS.reserves)}</div>` }),
      });
      badge.bindTooltip(esc(lang === 'ar' ? r.name_ar : r.name_en), { permanent: true, direction: 'bottom', offset: [0, 12], className: 'reserve-label' });
      layers.push(badge);
      const radius = r.area_km2 ? Math.sqrt(r.area_km2 / Math.PI) : null;
      const it = addItem({
        id: 'n' + r.key, type: 'area', kind: 'reserve', ci: rc.i, cat: rc,
        name: r.name_ar, alt: `${r.name_en || ''} محمية`, nameEn: r.name_en, info: r,
        polys: r.poly && r.poly.length ? r.poly : null, poly, layers, radius,
        bounds: poly ? poly.getBounds() : L.latLng(r.center).toBounds((radius || 20) * 2000),
        lat: r.center[0], lng: r.center[1], latlng: r.center, near: '', desc: '', boost: 1,
      });
      const onClick = e => { if (e) L.DomEvent.stopPropagation(e); select(it, { fly: false }); };
      badge.on('click', onClick);
      if (poly) {
        poly.on('click', onClick);
        poly.bindTooltip(esc(lang === 'ar' ? r.name_ar : r.name_en), { sticky: true, className: 'tip' });
      }
      reserves.push(it);
    }
  }

  // Region outlines need a light colour on satellite imagery and a dark one on the street map.
  function restyleAreas() {
    const sat = state.basemap === 'satellite';
    for (const p of provinces) p.poly.setStyle({ color: sat ? '#FDE68A' : '#C2410C', opacity: sat ? .85 : .7 });
  }

  function relabel() {
    for (const it of items) {
      if (it.type === 'city') it.marker.setTooltipContent(esc(lang === 'ar' ? it.name : it.nameEn));
      if (it.kind === 'reserve' && !it.noLoc) {
        const n = esc(lang === 'ar' ? it.name : (it.nameEn || it.name));
        it.layers[it.layers.length - 1].setTooltipContent(n);
        if (it.poly) it.poly.setTooltipContent(n);
      }
    }
    document.querySelectorAll('.prov-label').forEach(n => { n.textContent = n.dataset[lang]; });
  }
  const displayName = it => (lang === 'en' && it.nameEn ? it.nameEn : it.name);

  // ---------------------------------------------------------------- context: which region / reserve a point is in
  function provinceAt(p) { return provinces.find(pr => inPolys(p, pr.polys)) || null; }
  function reserveAt(p) {
    let best = null;
    for (const r of reserves) {
      if (r.noLoc) continue;
      if (r.polys) { if (inPolys(p, r.polys)) return { r, inside: true, d: 0 }; continue; }
      const d = haversine(p, r.latlng);
      if (r.radius && d <= r.radius * 1.15 && (!best || d < best.d)) best = { r, inside: false, d };
    }
    return best;
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

    const counts = new Array(CATS.length).fill(0);
    for (const [it] of matched) if (!it.hidden) counts[it.ci]++;
    renderChips(counts);

    const bounds = state.inView ? map.getBounds().pad(-0.02) : null;
    const origin = state.userLoc || [map.getCenter().lat, map.getCenter().lng];
    results = [];
    for (const [it, s] of matched) {
      if (!state.cats.has(it.ci) || it.hidden) continue;
      if (bounds && (it.noLoc || !((it.type === 'line' || it.type === 'area') ? bounds.intersects(it.bounds) : bounds.contains(it.latlng)))) continue;
      it._score = s;
      it._dist = it.latlng ? haversine(origin, it.latlng) : Infinity;
      results.push(it);
    }
    const byName = (a, b) => (a.name || '￿').localeCompare(b.name || '￿', 'ar');
    // Without a query, show reserves, cities and regions first, then the map's own categories.
    const order = it => (it.ci >= FIRST_EXTRA ? it.ci - 100 : it.ci);
    if (state.sort === 'distance') results.sort((a, b) => a._dist - b._dist);
    else if (state.sort === 'name') results.sort(byName);
    else if (state.query.trim()) results.sort((a, b) => b._score - a._score || a._dist - b._dist);
    else results.sort((a, b) => order(a) - order(b) || (a.rank || 0) - (b.rank || 0) || byName(a, b));

    const coords = parseCoords(state.query);
    renderList(coords, keepScroll);
    if (mapToo) renderMap(matched);
  }

  function renderMap(matched) {
    const markers = [];
    lineLayer.clearLayers(); areaLayer.clearLayers(); overlayLayer.clearLayers();
    for (const [it] of matched) {
      if (!state.cats.has(it.ci)) continue;
      if (it.type === 'point') markers.push(it.marker);
      else if (it.type === 'line') lineLayer.addLayer(it.poly);
      else it.layers.forEach(l => (l instanceof L.Polygon ? areaLayer : overlayLayer).addLayer(l));
    }
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
    const order = [...CATS.slice(FIRST_EXTRA), ...CATS.slice(0, FIRST_EXTRA)];
    let html = `<button class="chip all" data-ci="all" aria-pressed="${allOn}">${esc(t('all'))}</button>`;
    order.forEach(c => {
      const extra = c.i >= FIRST_EXTRA ? ' extra' : '';
      html += `<button class="chip${extra}" data-ci="${c.i}" aria-pressed="${state.cats.has(c.i)}">
        <span class="dot" style="background:${c.color}"></span>${esc(c[lang])} <span class="n">${fmt(counts[c.i])}</span></button>`;
    });
    els.chips.innerHTML = html;
  }
  function saveCats() { store.set('catKeys', CATS.filter(c => state.cats.has(c.i)).map(c => c.key)); }
  // A second click on the same chip within 400 ms ("double-click") shows only that category.
  let lastChip = null, lastChipAt = 0;
  els.chips.addEventListener('click', e => {
    const b = e.target.closest('.chip'); if (!b) return;
    const now = Date.now();
    if (b.dataset.ci !== 'all' && lastChip === b.dataset.ci && now - lastChipAt < 400) {
      lastChip = null;
      state.cats = new Set([+b.dataset.ci]);
      saveCats(); refresh();
      return;
    }
    lastChip = b.dataset.ci; lastChipAt = now;
    if (b.dataset.ci === 'all') {
      state.cats = state.cats.size === CATS.length ? new Set() : new Set(CATS.map(c => c.i));
    } else {
      const i = +b.dataset.ci;
      state.cats.has(i) ? state.cats.delete(i) : state.cats.add(i);
    }
    saveCats();
    refresh();
  });

  // ---------------------------------------------------------------- list
  function highlight(name) {
    const q = normalize(state.query);
    if (!q || !name) return esc(name || t('unnamed'));
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
    const parts = [];
    if (it.kind === 'reserve') {
      parts.push(esc(it.info.type === 'royal' ? t('royalReserve') : it.cat[lang]));
      const reg = lang === 'ar' ? it.info.region_ar : it.info.region_en;
      if (reg) parts.push(esc(reg));
    } else if (it.kind === 'province') {
      parts.push(esc(t('capital', it.capital[lang === 'ar' ? 0 : 1])));
    } else if (it.type === 'city') {
      parts.push(esc(t('majorCity')));
      if (lang === 'ar') parts.push(esc(it.nameEn)); else parts.push(esc(it.name));
    } else {
      parts.push(esc(it.cat[lang]));
      if (it.type === 'line') parts.push(esc(t('length', t('km', it.length))));
      else if (it.near && it.near !== it.name) parts.push(esc(t('near', it.near, it.nearKm)));
    }
    return parts.join(lang === 'ar' ? '، ' : ' · ');
  }

  function itemHTML(it) {
    const showDist = state.sort === 'distance' || state.userLoc;
    const name = it.nameEn && lang === 'en' ? esc(it.nameEn) : highlight(it.name);
    return `<li class="item${state.selected === it ? ' active' : ''}" data-id="${it.id}" role="option" tabindex="0">
      <span class="ico" style="background:${it.cat.color}">${svg(ICONS[it.cat.key])}</span>
      <span class="body"><div class="name">${name}</div><div class="meta">${metaLine(it)}</div></span>
      ${showDist && it.type !== 'area' ? `<span class="dist">${esc(t('km', it._dist))}</span>` : ''}
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
  const byId = id => itemsById.get(id);
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
    if (it.noLoc) {
      // nothing to show on the map
    } else if (it.type === 'area') {
      if (it.polys) {
        L.polygon(it.polys, { color: '#fff', weight: 6, opacity: .9, fill: false, interactive: false }).addTo(selLayer);
        L.polygon(it.polys, { color: it.cat.color, weight: 3.5, fill: it.kind === 'reserve', fillOpacity: .08, interactive: false }).addTo(selLayer);
      } else if (it.radius) {
        L.circle(it.latlng, { radius: it.radius * 1000, color: it.cat.color, weight: 2, dashArray: '6 6', fillOpacity: .06, interactive: false }).addTo(selLayer);
      }
      if (fly) map.flyToBounds(it.bounds, { ...fitPadding(), duration: .8, maxZoom: 10 });
    } else if (it.type === 'point' || it.type === 'city' || it.type === 'me') {
      if (it.type !== 'me') {
        const m = L.marker(it.latlng, { icon: selectedIcon(it.cat.color), zIndexOffset: 2000, keyboard: false }).addTo(selLayer);
        m.bindTooltip(esc(displayName(it) || t('unnamed')), { permanent: true, direction: 'top', offset: [0, -44], className: 'tip sel' });
      }
      const z = it.type === 'city' ? Math.max(map.getZoom(), 11) : Math.max(map.getZoom(), 13);
      if (fly) flyToVisible(it.latlng, z);
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
    if (li) li.classList.add('active');
    if (updateHash && it.id && !it.id.startsWith('@')) history.replaceState(null, '', '#' + it.id);
    if (isMobile()) { setSheet('half'); els.search.blur(); }
  }

  function nearestNamed(latlng) {
    let best = null, bd = Infinity;
    for (const p of items) {
      if (p.type !== 'point' || !p.name) continue;
      const d = haversine(latlng, p.latlng); if (d < bd) { bd = d; best = p; }
    }
    return best ? { name: best.name, km: Math.round(bd) } : null;
  }

  function selectCoords(lat, lng) {
    const it = {
      id: `@${lat},${lng}`, type: 'point', name: fmtCoord(lat, lng), latlng: [lat, lng], lat, lng,
      cat: { key: 'coords', ar: I18N.ar.coordsLabel, en: I18N.en.coordsLabel, color: '#1a73e8' }, near: '', desc: '',
    };
    const n = nearestNamed(it.latlng); if (n) { it.near = n.name; it.nearKm = n.km; }
    select(it, { fly: true, updateHash: false });
    history.replaceState(null, '', `#@${lat},${lng}`);
  }

  function selectMe() {
    if (!state.userLoc) return;
    const [lat, lng] = state.userLoc;
    const it = {
      id: '@me', type: 'me', name: t('myLocTitle'), latlng: state.userLoc, lat, lng,
      cat: { key: 'me', ar: I18N.ar.youAreHere, en: I18N.en.youAreHere, color: '#C026D3' }, near: '', desc: '',
    };
    const n = nearestNamed(it.latlng); if (n) { it.near = n.name; it.nearKm = n.km; }
    select(it, { fly: true, updateHash: false });
  }

  // Parts of the map covered by the panel (desktop side panel or mobile bottom sheet).
  function covered() {
    const size = map.getSize();
    if (isMobile()) {
      const sheet = Math.round(window.innerHeight * 0.55);
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
  function flyToVisible(latlng, zoom) {
    const c = covered();
    const shift = L.point((c.right - c.left) / 2, (c.bottom - c.top) / 2);
    const target = map.unproject(map.project(latlng, zoom).add(shift), zoom);
    map.flyTo(target, zoom, { duration: .8 });
  }

  const fact = (icon, html, cls = '') => `<li class="${cls}">${svg(icon)}<span>${html}</span></li>`;

  function contextFacts(it) {
    const facts = [];
    if (it.kind === 'province' || it.kind === 'reserve' || !it.latlng) return { facts, banner: '' };
    const pr = provinceAt(it.latlng);
    if (pr) facts.push(fact(ICONS.provinces, esc(t('region', lang === 'ar' ? pr.name : pr.nameEn))));
    let banner = '';
    const rs = reserveAt(it.latlng);
    if (rs) {
      const nm = esc(lang === 'ar' ? rs.r.name : (rs.r.nameEn || rs.r.name));
      const head = rs.inside ? t('insideReserve', nm) : t('nearReserve', nm, t('km', rs.d));
      banner = `<div class="notice reserve-notice">${svg(ICONS.reserves)}<div><strong>${head}</strong><p>${esc(t('reserveNote'))}</p>
        <button class="linkish" data-goto="${esc(rs.r.id)}">${esc(t('viewRules'))}</button></div></div>`;
    }
    return { facts, banner };
  }

  function renderDetail(it) {
    const facts = [];
    if (it.cat.key !== 'coords' && it.kind !== 'province' && !it.noLoc) facts.push(fact(UI_ICONS.pin, `<span class="coords" dir="ltr">${fmtCoord(it.lat, it.lng)}</span>`));
    if (it.type === 'me' && state.userAcc) facts.push(fact(UI_ICONS.nav, esc(t('accuracy', state.userAcc))));
    if (it.type === 'line') facts.push(fact(UI_ICONS.ruler, esc(t('length', t('km', it.length)))));
    if (it.near && it.near !== it.name) facts.push(fact(ICONS.towns, esc(t('near', it.near, it.nearKm))));
    if (state.userLoc && it.type !== 'me' && it.type !== 'area') facts.push(fact(UI_ICONS.nav, esc(t('fromYou', t('km', haversine(state.userLoc, it.latlng))))));
    if (it.kind === 'province') {
      facts.push(fact(ICONS.cities, esc(t('capital', it.capital[lang === 'ar' ? 0 : 1]))));
      facts.push(fact(UI_ICONS.ruler, esc(t('areaKm', it.area))));
      const n = items.reduce((a, p) => a + (p.type === 'point' && it.bounds.contains(p.latlng) && inPolys(p.latlng, it.polys) ? 1 : 0), 0);
      facts.push(fact(ICONS.local, esc(t('placesInside', n))));
    }
    const ctx = contextFacts(it);
    facts.push(...ctx.facts);
    if (it.cat.key === 'sabil') {
      if (it.added) facts.push(fact(UI_ICONS.doc, esc(t('sabilAdded', lang === 'ar' ? fmtNum(it.added) : it.added))));
      if (sabilSource) facts.push(fact(UI_ICONS.link, `<a href="${esc(sabilSource)}" target="_blank" rel="noopener">${esc(t('sabilSource'))}</a>`));
      ctx.banner += `<div class="notice">${svg(UI_ICONS.warn)}<p>${esc(t('sabilNote'))}</p></div>`;
    }

    const sub = it.kind === 'reserve' ? (it.info.type === 'royal' ? t('royalReserve') : t('ncwReserve')) : it.cat[lang];
    const showActions = it.kind !== 'province' && !it.noLoc;
    const showWx = it.kind !== 'province' && !it.noLoc;
    els.detail.innerHTML = `
      <div class="detail-head">
        <h2>${esc(displayName(it) || t('unnamed'))}</h2>
        <button class="icon-btn" data-act="close" aria-label="${esc(t('close'))}">${svg(UI_ICONS.close)}</button>
      </div>
      <div class="badge"><span class="dot" style="background:${it.cat.color}"></span>${esc(sub)}</div>
      ${it.desc ? `<p class="desc">${esc(it.desc)}</p>` : ''}
      ${ctx.banner}
      <ul class="facts">${facts.join('')}</ul>
      ${showActions ? `<div class="actions">
        <a class="action primary" target="_blank" rel="noopener" href="${dirLink(it.lat, it.lng)}">${svg(UI_ICONS.directions)}${esc(t('directions'))}</a>
        <a class="action" target="_blank" rel="noopener" href="${gmapsLink(it.lat, it.lng)}">${svg(UI_ICONS.open)}Google Maps</a>
        <button class="action" data-act="copy">${svg(UI_ICONS.copy)}${esc(t('copy'))}</button>
        ${it.type !== 'me' ? `<button class="action" data-act="share">${svg(UI_ICONS.share)}${esc(t('share'))}</button>` : ''}
      </div>` : ''}
      ${it.kind === 'reserve' ? reserveHTML(it) : ''}
      ${waterKind(it) ? `<section class="sec" id="waterSec"><h3>${esc(t('water'))}</h3><div class="sec-body muted">${esc(t('waterLoading'))}</div></section>` : ''}
      ${showWx ? `<section class="sec" id="wxSec"><h3>${esc(t('weather'))}</h3><div class="sec-body muted">${esc(t('wxLoading'))}</div></section>` : ''}`;
    els.detail.hidden = false;
    els.panel.classList.add('has-detail');
    els.detail.scrollTop = 0;
    if (showWx) loadWeather(it);
    if (waterKind(it)) loadWater(it);
  }

  // ---------------------------------------------------------------- reserves detail
  function bullets(list, icon, cls) {
    if (!list || !list.length) return `<p class="muted">${esc(t('noInfo'))}</p>`;
    return `<ul class="rules ${cls}">${list.map(s => `<li>${svg(icon)}<span>${esc(s)}</span></li>`).join('')}</ul>`;
  }
  function reserveHTML(it) {
    const r = it.info;
    const L_ = lang;
    const pick = o => (o && (o[L_] || o[L_ === 'ar' ? 'en' : 'ar'])) || [];
    const site = safeUrl(r.website);
    const srcs = (r.sources || []).map(safeUrl).filter(Boolean);
    const general = reserveInfo && reserveInfo.general_rules ? pick(reserveInfo.general_rules) : [];
    const genSrc = reserveInfo && reserveInfo.general_rules ? (reserveInfo.general_rules.sources || []).map(safeUrl).filter(Boolean) : [];
    const host = u => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return u; } };
    return `
      ${it.noLoc ? `<div class="notice">${svg(UI_ICONS.warn)}<p>${esc(t('noLocation'))}</p></div>` : !it.polys ? `<p class="muted small">${esc(t('pointOnly'))}</p>` : ''}
      ${site ? `<div class="actions"><a class="action" target="_blank" rel="noopener" href="${esc(site)}">${svg(UI_ICONS.link)}${esc(t('website'))}</a></div>` : ''}
      <section class="sec"><h3>${esc(t('permits'))}</h3>${bullets(pick(r.permits), UI_ICONS.doc, 'permit')}</section>
      <section class="sec"><h3>${esc(t('allowed'))}</h3>${bullets(pick(r.allowed), UI_ICONS.check, 'ok')}</section>
      <section class="sec"><h3>${esc(t('notAllowed'))}</h3>${bullets(pick(r.not_allowed), UI_ICONS.block, 'no')}</section>
      ${general.length ? `<section class="sec"><h3>${esc(t('generalRules'))}</h3>${bullets(general, UI_ICONS.warn, 'gen')}</section>` : ''}
      <section class="sec sources"><h3>${esc(t('sources'))}</h3>
        <ul>${[...srcs, ...genSrc].filter((u, i, a) => a.indexOf(u) === i).map(u => `<li><a href="${esc(u)}" target="_blank" rel="noopener">${esc(host(u))}</a></li>`).join('')}</ul>
        ${r.confidence !== 'official' ? `<p class="muted small">${esc(t('secondary'))}</p>` : ''}
        <p class="muted small">${esc(t('checkOfficial', reserveInfo?.generated || ''))}</p>
      </section>`;
  }

  // ---------------------------------------------------------------- weather (Open-Meteo, no key needed)
  const WX_API = 'https://api.open-meteo.com/v1';
  const wxCache = new Map();
  function getJSON(url) {
    if (!wxCache.has(url)) {
      const p = fetch(url).then(r => { if (!r.ok) throw new Error(r.status); return r.json(); });
      p.catch(() => wxCache.delete(url));
      wxCache.set(url, p);
    }
    return wxCache.get(url);
  }
  const r3 = v => Math.round(v * 1000) / 1000;
  const sum = (arr, a, b) => { let s = 0; for (let i = Math.max(0, a); i < Math.min(arr.length, b); i++) s += arr[i] || 0; return Math.round(s * 10) / 10; };
  const dirName = deg => t('dirs')[Math.round(((deg % 360) + 360) % 360 / 45) % 8];

  function forecastURL(lat, lng) {
    return `${WX_API}/forecast?latitude=${r3(lat)}&longitude=${r3(lng)}`
      + '&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_gusts_10m,wind_direction_10m'
      + '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_gusts_10m_max'
      + '&past_days=31&forecast_days=7&timezone=Asia%2FRiyadh';
  }
  // Index of today in the daily arrays (past_days come first).
  const todayIndex = d => { const i = d.daily.time.indexOf(d.current.time.slice(0, 10)); return i < 0 ? 31 : i; };

  async function loadWeather(it) {
    const sec = () => (state.selected === it ? els.detail.querySelector('#wxSec .sec-body') : null);
    try {
      const d = await getJSON(forecastURL(it.lat, it.lng));
      const el = sec(); if (!el) return;
      el.classList.remove('muted');
      el.innerHTML = weatherHTML(d);
    } catch (e) {
      const el = sec(); if (el) el.textContent = t('wxError');
    }
  }

  function weatherHTML(d) {
    const c = d.current, day = d.daily, ti = todayIndex(d);
    const deg = v => `${num(Math.round(v))}°`;
    const dayFmt = new Intl.DateTimeFormat(lang === 'ar' ? 'ar-SA-u-ca-gregory-nu-arab' : 'en-GB', { weekday: 'short' });
    const days = [];
    for (let i = ti; i < Math.min(ti + 7, day.time.length); i++) {
      const name = i === ti ? t('today') : dayFmt.format(new Date(day.time[i] + 'T12:00:00'));
      const rain = day.precipitation_sum[i] || 0;
      days.push(`<div class="wx-day"><span class="wx-dn">${esc(name)}</span>${wxGlyph(day.weather_code[i])}
        <span class="wx-t"><b>${deg(day.temperature_2m_max[i])}</b> ${deg(day.temperature_2m_min[i])}</span>
        <span class="wx-r${rain >= 1 ? ' on' : ''}">${rain >= 0.1 ? esc(t('rainMm', Math.round(rain * 10) / 10)) : '–'}</span></div>`);
    }
    const warns = [];
    const next3 = sum(day.precipitation_sum, ti, ti + 3);
    const prob3 = Math.max(0, ...day.precipitation_probability_max.slice(ti, ti + 3).map(v => v || 0));
    const gust3 = Math.max(0, ...day.wind_gusts_10m_max.slice(ti, ti + 3).map(v => v || 0));
    const min3 = Math.min(...day.temperature_2m_min.slice(ti, ti + 3));
    const max3 = Math.max(...day.temperature_2m_max.slice(ti, ti + 3));
    if (next3 >= 1) warns.push(['rain', t('rainNext', next3, prob3)]);
    if (gust3 >= 45) warns.push(['wind', t('dustWarn')]);
    if (min3 <= 6) warns.push(['cold', t('coldWarn', num(Math.round(min3)))]);
    if (max3 >= 44) warns.push(['hot', t('hotWarn', num(Math.round(max3)))]);
    const past = t('rainPast', sum(day.precipitation_sum, ti - 3, ti), sum(day.precipitation_sum, ti - 7, ti), sum(day.precipitation_sum, ti - 30, ti));
    return `
      <div class="wx-now">${wxGlyph(c.weather_code)}
        <div><div class="wx-temp">${deg(c.temperature_2m)}</div><div class="wx-desc">${esc(t('wmo')[c.weather_code] || '')}</div></div>
        <ul class="wx-meta">
          <li>${esc(t('feels', deg(c.apparent_temperature)))}</li>
          <li>${esc(t('humidity', num(c.relative_humidity_2m) + (lang === 'ar' ? '٪' : '%')))}</li>
          <li>${esc(t('wind', num(Math.round(c.wind_speed_10m)), dirName(c.wind_direction_10m)))}${lang === 'ar' ? '، ' : ', '}${esc(t('gusts', num(Math.round(c.wind_gusts_10m))))}</li>
        </ul></div>
      ${warns.map(([k, s]) => `<div class="notice wx-${k}">${svg(UI_ICONS.warn)}<p>${esc(s)}</p></div>`).join('')}
      <div class="wx-days">${days.join('')}</div>
      <p class="muted small">${esc(past)}</p>
      <p class="muted small"><a href="https://open-meteo.com/" target="_blank" rel="noopener">${esc(t('wxSource'))}</a></p>`;
  }

  // ---------------------------------------------------------------- water insight for valleys & basins
  const BASIN_RE = /(^| )(ال)?(خبرا|خبره|خبيرا|خباري|روضه|رياض|قاع|قيعان|فيضه|حايره|حاير|غدير|سد|بحيره|ثميله|ثمايل|عد)( |$)/;
  const CHANNEL_RE = /(^| )(ال)?(وادي|اوديه|شعيب|شعبان|شعيبان|شعيبات|مسيل|سيل|فلاج|تلعه)( |$)/;
  function waterKind(it) {
    if (!it || !it.cat || it.type === 'area' || it.type === 'city' || it.type === 'line') return null;
    const n = it.norm || '';
    if (BASIN_RE.test(n)) return 'basin';
    if (CHANNEL_RE.test(n)) return 'channel';
    if (it.cat.key === 'valleys') return 'basin';
    return null;
  }

  async function loadWater(it) {
    const kind = waterKind(it);
    const sec = () => (state.selected === it ? els.detail.querySelector('#waterSec .sec-body') : null);
    try {
      const res = await analyseWater(it.latlng, kind);
      const el = sec(); if (!el) return;
      el.classList.remove('muted');
      el.innerHTML = waterHTML(res, kind);
    } catch (e) {
      const el = sec(); if (el) el.textContent = t('wxError');
    }
  }

  // Sample the terrain around the site, treat higher ground as the catchment that drains into it,
  // and combine modelled rainfall on the site and on that catchment.
  async function analyseWater(latlng, kind) {
    const pts = [latlng];
    const BEARINGS = [0, 45, 90, 135, 180, 225, 270, 315], RADII = [5, 12, 25];
    for (const r of RADII) for (const b of BEARINGS) pts.push(offset(latlng, r, b));
    const elev = await getJSON(`${WX_API}/elevation?latitude=${pts.map(p => r3(p[0])).join(',')}&longitude=${pts.map(p => r3(p[1])).join(',')}`);
    const h = elev.elevation, h0 = h[0];
    // Rise per direction (average across radii) tells where water comes from.
    const rise = BEARINGS.map((b, bi) => RADII.reduce((a, _, ri) => a + (h[1 + ri * 8 + bi] - h0), 0) / RADII.length);
    let up = pts.slice(1).map((p, i) => ({ p, gain: h[i + 1] - h0 })).filter(x => x.gain > 4).sort((a, b) => b.gain - a.gain).slice(0, 10);
    const bestDir = rise.indexOf(Math.max(...rise));

    const site = await getJSON(forecastURL(latlng[0], latlng[1]));
    const ti = todayIndex(site);
    const sp = site.daily.precipitation_sum;
    const siteR = { d3: sum(sp, ti - 3, ti), d7: sum(sp, ti - 7, ti), d30: sum(sp, ti - 30, ti), n3: sum(sp, ti, ti + 3) };

    let upR = null;
    if (up.length) {
      const u = await getJSON(`${WX_API}/forecast?latitude=${up.map(x => r3(x.p[0])).join(',')}&longitude=${up.map(x => r3(x.p[1])).join(',')}`
        + '&daily=precipitation_sum&past_days=31&forecast_days=3&timezone=Asia%2FRiyadh');
      const list = Array.isArray(u) ? u : [u];
      const acc = { d3: 0, d7: 0, d30: 0, n3: 0 };
      for (const loc of list) {
        const p = loc.daily.precipitation_sum, i0 = loc.daily.time.indexOf(site.daily.time[ti]);
        const k = i0 < 0 ? 31 : i0;
        acc.d3 += sum(p, k - 3, k); acc.d7 += sum(p, k - 7, k); acc.d30 += sum(p, k - 30, k); acc.n3 += sum(p, k, k + 3);
      }
      const n = list.length;
      upR = { d3: Math.round(acc.d3 / n * 10) / 10, d7: Math.round(acc.d7 / n * 10) / 10, d30: Math.round(acc.d30 / n * 10) / 10, n3: Math.round(acc.n3 / n * 10) / 10 };
    }
    // Basins also collect water from the catchment, so take the wetter of the two.
    const eff = k => Math.max(siteR[k], upR ? upR[k] : 0);
    const e3 = eff('d3'), e7 = eff('d7'), e30 = eff('d30'), n3 = eff('n3');
    let status;
    if (kind === 'channel') {
      status = e3 >= 15 ? 'flowing' : e7 >= 10 ? 'wet' : e30 >= 20 ? 'maybe' : 'dry';
    } else {
      status = (e7 >= 15 || e3 >= 10) ? 'filled' : e30 >= 25 ? 'wet' : e30 >= 10 ? 'maybe' : 'dry';
    }
    return { status, siteR, upR, rise: Math.round(rise[bestDir]), dir: BEARINGS[bestDir], hasUp: up.length > 0, floodRisk: n3 >= 8 };
  }

  function waterHTML(r, kind) {
    const lvl = { flowing: 4, filled: 4, wet: 3, maybe: 2, dry: 1 }[r.status];
    const fmt = v => num(v);
    return `
      <div class="water-status lvl${lvl}">
        <div class="ws-gauge">${[1, 2, 3, 4].map(i => `<span class="${i <= lvl ? 'on' : ''}"></span>`).join('')}</div>
        <div><strong>${esc(t('st_' + r.status))}</strong><div class="muted small">${esc(t(kind))}</div></div>
      </div>
      ${r.floodRisk ? `<div class="notice wx-flood">${svg(UI_ICONS.warn)}<p>${esc(t('floodWarn'))}</p></div>` : ''}
      <ul class="facts small">
        <li>${svg(UI_ICONS.nav)}<span>${esc(r.hasUp && r.rise > 0 ? t('upstreamFrom', t('dirs')[r.dir / 45], fmt(r.rise)) : t('noUpstream'))}</span></li>
        <li>${svg(ICONS.water)}<span>${esc(t('siteRain', fmt(r.siteR.d3), fmt(r.siteR.d7), fmt(r.siteR.d30)))}</span></li>
        ${r.upR ? `<li>${svg(ICONS.valleys)}<span>${esc(t('catchRain', fmt(r.upR.d3), fmt(r.upR.d7), fmt(r.upR.d30)))}</span></li>` : ''}
      </ul>
      <p class="muted small">${esc(t('flowNajd'))}</p>
      <p class="muted small">${esc(t('waterDisclaimer'))}</p>`;
  }

  function clearSelection() {
    state.selected = null;
    selLayer.clearLayers();
    els.detail.hidden = true;
    els.panel.classList.remove('has-detail');
    els.list.querySelectorAll('.item.active').forEach(n => n.classList.remove('active'));
    history.replaceState(null, '', location.pathname + location.search);
  }

  els.detail.addEventListener('click', async e => {
    const go = e.target.closest('[data-goto]');
    if (go) { const r = byId(go.dataset.goto); if (r) select(r, { fly: true }); return; }
    const b = e.target.closest('[data-act]'); if (!b) return;
    const it = state.selected; if (!it) return;
    if (b.dataset.act === 'close') clearSelection();
    if (b.dataset.act === 'copy') copy(fmtCoord(it.lat, it.lng), t('copied'));
    if (b.dataset.act === 'share') {
      const url = location.href;
      if (navigator.share) { try { await navigator.share({ title: displayName(it), url }); } catch { /* cancelled */ } return; }
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
    if (state.selected) clearSelection();
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      state.query = els.search.value;
      matchedCache = null;
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

  // ---------------------------------------------------------------- my location
  // A distinct "you are here" marker: dark disc with a person glyph and a pulsing magenta halo,
  // plus a translucent accuracy circle. It follows the device while the page is open.
  const meIcon = L.divIcon({
    className: '', iconSize: [30, 30], iconAnchor: [15, 15],
    html: `<div class="me"><span class="me-pulse"></span><span class="me-core">${svg(ICONS.me)}</span></div>`,
  });
  let meMarker = null, meCircle = null, watchId = null, firstFix = true;
  function updateMe(pos) {
    state.userLoc = [pos.coords.latitude, pos.coords.longitude];
    state.userAcc = pos.coords.accuracy;
    if (!meMarker) {
      meCircle = L.circle(state.userLoc, { radius: state.userAcc, color: '#C026D3', weight: 1, fillColor: '#C026D3', fillOpacity: .1, interactive: false }).addTo(meLayer);
      meMarker = L.marker(state.userLoc, { icon: meIcon, zIndexOffset: 5000, keyboard: false }).addTo(meLayer);
      meMarker.bindTooltip(esc(t('youAreHere')), { direction: 'top', offset: [0, -16], className: 'tip me-tip' });
      meMarker.on('click', selectMe);
    } else {
      meMarker.setLatLng(state.userLoc);
      meCircle.setLatLng(state.userLoc).setRadius(state.userAcc);
    }
    els.locate.classList.add('on');
    if (firstFix) {
      firstFix = false;
      flyToVisible(state.userLoc, Math.max(map.getZoom(), 11));
      state.sort = 'distance'; els.sort.value = 'distance';
      refresh({ mapToo: false });
      if (state.selected) renderDetail(state.selected);
    }
  }
  els.locate.addEventListener('click', () => {
    if (!navigator.geolocation) return toast(t('locError'));
    if (state.userLoc) { flyToVisible(state.userLoc, Math.max(map.getZoom(), 13)); selectMe(); return; }
    toast(t('locating'));
    firstFix = true;
    const fail = () => toast(t('locError'));
    navigator.geolocation.getCurrentPosition(updateMe, fail, { enableHighAccuracy: true, timeout: 12000 });
    if (watchId === null) watchId = navigator.geolocation.watchPosition(updateMe, () => {}, { enableHighAccuracy: true, maximumAge: 15000 });
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
    attribution.remove();
    attribution = L.control.attribution({ prefix: false, position: L_.dir === 'rtl' ? 'topleft' : 'topright' }).addTo(map);
    baseLayers.forEach(l => { map.removeLayer(l); l.addTo(map).bringToBack(); });
    renderBasemapButtons();
    if (meMarker) meMarker.setTooltipContent(esc(t('youAreHere')));
  }
  els.lang.addEventListener('click', () => {
    lang = lang === 'ar' ? 'en' : 'ar'; store.set('lang', lang);
    applyLang();
    relabel();
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
    if (it) select(it.head || it, { fly: true, updateHash: false });
  }
  window.addEventListener('hashchange', fromHash);

  // ---------------------------------------------------------------- boot
  (async () => {
    els.panel.dataset.state = 'peek';
    renderBasemapButtons();
    applyLang();
    try {
      await load();
    } catch (err) {
      els.loading.innerHTML = `<span>Failed to load data: ${esc(err.message)}</span>`;
      return;
    }
    setBasemap(state.basemap);
    refresh();
    els.loading.classList.add('done');
    fromHash();
  })();
})();
