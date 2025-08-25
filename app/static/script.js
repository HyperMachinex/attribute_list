// ---- VERİ MODELİ (Gruplar) ----
// Not: Metin etiketleri değişse bile backend stabil kalsın diye slug kullanıyoruz.
const RAW_GROUPS = {
  kanal: [
    "Facebook, Instagram, Viber, Telegram Entegrasyonları",
    "Whatsapp Entegrasyonu (Ek olarak ücretlendirilmektedir)",
    "Apple Business Chat",
    "Facebook, Instagram ve Telegram'da Sesli Mesajlar"
  ],
  mobil: [
    "Mobil Uygulama SDK",
    "Telefon+ Modülü",
    "Görüntülü Görüşme Modülü"
  ],
  pencere: [
    "Canlı Destek",
    "Sohbet öncesi butonlar",
    "Dosya gönderme-alma",
    "Sınırsız sitede sınırsız sohbet penceresi",
    "Mobil cihazların tamamına uygun sohbet penceresi",
    "Gönderim sonrası yanıt düzenleme"
  ],
  agent: [
    "Yazım denetimi",
    "Taslak cevaplar",
    "Çoklu temsilcili sohbetler",
    "Temsilciler arası sohbet aktarımı",
    "Temsilci Durum Bilgisi",
    "Farklı kanallara farklı temsilciler atama",
    "Kısayollar"
  ],
  ziyaret: [
    "Canlı ziyaretçi takibi ve sitedeki ziyaretçiye manuel mesaj gönderme",
    "IP adresi, coğrafi bölge ve ziyaret kaynağı dahil tüm ziyaretçi bilgileri",
    "Sitenizde ziyaretçilerinizi yönlendirmek için işaretçi aracı",
    "Sohbetleri ziyaretçinin coğrafi konumuna göre dağıtma",
    "Akıllı tetikleyicilerle hedefli sohbetler başlatma",
    "Mesai saatleri belirleme",
    "Geri Aramalar"
  ],
  ai: [
    "AI Asistanı Modülü",
    "YZ Yardımcısı Modülü",
    "Chatbot - Sohbet Botları"
  ],
  marketing: [
    "Etkileşimli mesaj kampanyaları",
    "Google Analytics Entegrasyonu",
    "Pazarlama İstatistikleri",
    "Müşteriler tarafından servis kalitesi geribildirimleri"
  ],
  operasyon: [
    "Ekip içi sohbet",
    "Sohbet yönlendirme",
    "Sohbet kurtarma",
    "Kanalları ayarlarıyla kopyalama",
    "Temsilci istatistikleri",
    "Çalışanların erişim hakları ve rollerini düzenleme"
  ],
  crm: [
    "CRM Modülü ile müşteri ve satış takibi",
    "Online mağazanızdaki formlar üzerinden sipariş işleme",
    "Excel'e veri dökümü alma",
    "CRM sağlayıcılarla tek tıkla entegrasyon"
  ],
  dev: [
    "Sohbet API",
    "Site Webhookları",
    "Yazılımınızla entegrasyon için JavaScript API ve WebHooklar"
  ],
  security: [
    "Spam koruması",
    "Sohbet arşivi"
  ]
};

// Basit ve stabil slug üretici (Türkçe karakter & noktalama normalize edilir)
function slugify(str) {
  return str
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // diakritikleri temizle
    .replace(/ı/g, 'i').replace(/İ/g, 'i')
    .replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ş/g, 's').replace(/ç/g, 'c').replace(/ğ/g, 'g')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/--+/g, '-');
}

// GROUPS: { key: [{label, slug}] }
const GROUPS = Object.fromEntries(
  Object.entries(RAW_GROUPS).map(([k, arr]) => [
    k,
    arr.map(label => ({ label, slug: slugify(label) }))
  ])
);

const ALL_FEATURES = Object.values(GROUPS).flat();
const SLUG_TO_LABEL = new Map(ALL_FEATURES.map(f => [f.slug, f.label]));
const LABEL_TO_SLUG = new Map(ALL_FEATURES.map(f => [f.label, f.slug]));

const STORAGE_KEY = 'canli_destek_form_v2';

const $ = (sel, el=document) => el.querySelector(sel);
const $$ = (sel, el=document) => Array.from(el.querySelectorAll(sel));

// state.selected artık SLUG set
const state = {
  query: '',
  selected: new Set(),
  fields: {company:'', website:'', industry:'', email:'', phone:'', monthlyMessages:'', temsilciCount:''}
};

// ---- Persist / Hydrate ----
function hydrate(){
  // URL ?select=[...] (slug listesi) varsa önce onu uygula
  try {
    const u = new URL(location.href);
    const selParam = u.searchParams.get('select');
    if (selParam) {
      const decoded = decodeURIComponent(selParam);
      const arr = JSON.parse(decoded);
      if (Array.isArray(arr)) {
        arr.forEach(slug => {
          if (SLUG_TO_LABEL.has(slug)) state.selected.add(slug);
        });
      }
    }
  } catch(_) {}

  // localStorage
  const saved = localStorage.getItem(STORAGE_KEY);
  if(!saved) return;
  try{
    const data = JSON.parse(saved);
    if(Array.isArray(data.selected)) {
      data.selected.forEach(slug => {
        if (SLUG_TO_LABEL.has(slug)) state.selected.add(slug);
      });
    }
    if(data.fields) state.fields = {...state.fields, ...data.fields};
  }catch(e){}
}
function persist(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify({selected:[...state.selected], fields: state.fields}));
}

// ---- Form alanları ----
function bindCompanyFields(){
  const ids = ['company','website','industry','email','phone'];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if(!el) return;
    if(state.fields[id]) el.value = state.fields[id];
    el.addEventListener('input', (e)=>{ state.fields[id] = e.target.value; persist(); });
  });
}

function bindMonthlyMessages(){
  const radios = document.querySelectorAll('#monthlyMessages input[type="radio"]');
  radios.forEach(radio => {
    if(state.fields.monthlyMessages === radio.value) radio.checked = true;
    radio.addEventListener('change', (e) => {
      if(e.target.checked) {
        state.fields.monthlyMessages = e.target.value;
        persist();
      }
    });
  });
}

function bindTemsilciCount(){
  const radios = document.querySelectorAll('#temsilciCount input[type="radio"]');
  radios.forEach(radio => {
    if(state.fields.temsilciCount === radio.value) radio.checked = true;
    radio.addEventListener('change', (e) => {
      if(e.target.checked) {
        state.fields.temsilciCount = e.target.value;
        persist();
      }
    });
  });
}

// ---- Paket Öneri Mantığı ----
function hasFeatureLabel(label) {
  const slug = LABEL_TO_SLUG.get(label);
  return slug ? state.selected.has(slug) : false;
}

function getPackageSuggestion() {
  const monthlyMessages = state.fields.monthlyMessages;
  const temsilciCount = state.fields.temsilciCount;

  let packageSuggestion = '';
  let packageDescription = '';
  let packageReason = '';

  // Kurumsal özellikler (öncelik 1)
  const enterpriseFeatures = [
    "Mobil Uygulama SDK",
    "Sohbet yönlendirme",
    "Sohbet API"
  ];
  const hasEnterpriseFeature = enterpriseFeatures.some(hasFeatureLabel);
  if (hasEnterpriseFeature) {
    const selectedEnterpriseFeatures = enterpriseFeatures.filter(hasFeatureLabel);
    packageSuggestion = 'Kurumsal Paket';
    packageDescription = 'Kurumsal özellikler seçildiği için Kurumsal Paket gerekli';
    packageReason = `Kurumsal özellikler seçildi: ${selectedEnterpriseFeatures.join(', ')}`;
    return { packageSuggestion, packageDescription, packageReason };
  }

  // Kurumsal paket gereksinimi (öncelik 2)
  if (temsilciCount === 'limitless' || monthlyMessages === '100k-1m' || monthlyMessages === '1m+') {
    const reasons = [];
    if (temsilciCount === 'limitless') reasons.push('Sınırsız temsilci');
    if (monthlyMessages === '100k-1m' || monthlyMessages === '1m+') reasons.push('100K+ aylık mesaj');
    packageSuggestion = 'Kurumsal Paket';
    packageDescription = 'Kurumsal gereksinimler mevcut';
    packageReason = `Gerekçeler: ${reasons.join(', ')}`;
    return { packageSuggestion, packageDescription, packageReason };
  }

  // Premium (öncelik 3)
  if (monthlyMessages === '10k-100k') {
    return {
      packageSuggestion: 'Premium Paket',
      packageDescription: '10K-100K aylık mesaj hacmi için',
      packageReason: 'Hacim temelli öneri'
    };
  }

  // Premium özellikler (öncelik 4)
  const premiumFeatures = [
    "Whatsapp Entegrasyonu (Ek olarak ücretlendirilmektedir)",
    "Facebook, Instagram ve Telegram'da Sesli Mesajlar",
    "Apple Business Chat",
    "Etkileşimli mesaj kampanyaları",
    "Google Analytics Entegrasyonu",
    "Pazarlama İstatistikleri",
    "Sohbetleri ziyaretçinin coğrafi konumuna göre dağıtma",
    "Kanalları ayarlarıyla kopyalama",
    "Temsilci Durum Bilgisi",
    "Farklı kanallara farklı temsilciler atama",
    "Site Webhookları",
    "Çalışanların erişim hakları ve rollerini düzenleme"
  ];
  if (premiumFeatures.some(hasFeatureLabel)) {
    const list = premiumFeatures.filter(hasFeatureLabel);
    return {
      packageSuggestion: 'Premium Paket',
      packageDescription: 'Premium özellikler seçildi',
      packageReason: `Seçilenler: ${list.join(', ')}`
    };
  }

  // Pro (öncelik 5)
  if (monthlyMessages === '1000-10000') {
    return {
      packageSuggestion: 'Pro Paket',
      packageDescription: '1K-10K aylık mesaj hacmi için',
      packageReason: 'Hacim temelli öneri'
    };
  }

  // Pro özellikleri (öncelik 6)
  const proFeatures = [
    "Akıllı tetikleyicilerle hedefli sohbetler başlatma",
    "Sohbet öncesi butonlar",
    "Dosya gönderme-alma",
    "Canlı ziyaretçi takibi ve sitedeki ziyaretçiye manuel mesaj gönderme",
    "IP adresi, coğrafi bölge ve ziyaret kaynağı dahil tüm ziyaretçi bilgileri",
    "Sitenizde ziyaretçilerinizi yönlendirmek için işaretçi aracı",
    "CRM Modülü ile müşteri ve satış takibi",
    "Excel'e veri dökümü alma",
    "Müşteriler tarafından servis kalitesi geribildirimleri",
    "Yazım denetimi",
    "Taslak cevaplar",
    "Çoklu temsilcili sohbetler",
    "Mesai saatleri belirleme",
    "Gönderim sonrası yanıt düzenleme",
    "Temsilciler arası sohbet aktarımı",
    "Yazılımınızla entegrasyon için JavaScript API ve WebHooklar",
    "CRM sağlayıcılarla tek tıkla entegrasyon",
    "Spam koruması"
  ];
  if (proFeatures.some(hasFeatureLabel)) {
    const list = proFeatures.filter(hasFeatureLabel);
    return {
      packageSuggestion: 'Pro Paket',
      packageDescription: 'Pro özellikler seçildi',
      packageReason: `Seçilenler: ${list.join(', ')}`
    };
  }

  // Ücretsiz (öncelik 7)
  if (temsilciCount === 'up-to-2' && monthlyMessages === '0-1000') {
    return {
      packageSuggestion: 'Ücretsiz Paket',
      packageDescription: '2 temsilciye kadar, düşük hacim',
      packageReason: '0-1K mesaj + 2 temsilci'
    };
  }

  // Varsayılan durumlar
  if (!temsilciCount && !monthlyMessages) {
    return { packageSuggestion:'Paket Seçimi Gerekli', packageDescription:'Lütfen temsilci ve aylık mesaj sayılarını seçin', packageReason:'Eksik seçim' };
  } else if (!temsilciCount) {
    return { packageSuggestion:'Paket Seçimi Gerekli', packageDescription:'Lütfen temsilci sayısını seçin', packageReason:'Temsilci seçilmedi' };
  } else if (!monthlyMessages) {
    return { packageSuggestion:'Paket Seçimi Gerekli', packageDescription:'Lütfen aylık mesaj sayısını seçin', packageReason:'Mesaj hacmi seçilmedi' };
  }
  return { packageSuggestion:'Bilgi Yetersiz', packageDescription:'Seçimleri gözden geçirin', packageReason:'—' };
}

function showPackageSuggestion() {
  const { packageSuggestion, packageDescription, packageReason } = getPackageSuggestion();
  let suggestionDiv = document.getElementById('packageSuggestion');
  if (!suggestionDiv) {
    suggestionDiv = document.createElement('div');
    suggestionDiv.id = 'packageSuggestion';
    suggestionDiv.className = 'card';
    suggestionDiv.style.marginTop = '16px';
    suggestionDiv.style.border = '2px solid var(--primary)';
    suggestionDiv.style.background = 'linear-gradient(180deg, rgba(34,211,238,.08), rgba(17,24,39,.95))';
    const devamEtButton = document.getElementById('devamEt').closest('.card');
    devamEtButton.parentNode.insertBefore(suggestionDiv, devamEtButton.nextSibling);
  }
  suggestionDiv.innerHTML = `
    <h3 style="margin:0 0 12px 0; color:var(--primary); font-size:20px;">${packageSuggestion}</h3>
    <p style="margin:0 0 16px 0; color:var(--text);">${packageDescription}</p>
    <p style="margin:0 0 16px 0; color:var(--muted); font-size:14px; font-style:italic;">${packageReason}</p>
    <div style="display:flex; gap:10px; flex-wrap:wrap;">
      <button class="btn" onclick="showPackageDetails()">Paket Detayları</button>
      <button class="btn primary" onclick="contactSales()">Satış Ekibiyle İletişim</button>
    </div>
  `;
  suggestionDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function showPackageDetails() { alert('Paket detayları yakında eklenecek...'); }
function contactSales() { alert('Satış ekibiyle iletişim bilgileri yakında eklenecek...'); }

// ---- Checkbox render ----
function makeOption(item){
  const wrap = document.createElement('label');
  wrap.className = 'option';
  const cb = document.createElement('input');
  cb.type = 'checkbox';
  cb.name = 'features[]';
  cb.value = item.slug;               // backend’e gidecek değer
  cb.checked = state.selected.has(item.slug);
  cb.dataset.label = item.label;      // UI gösterimi için
  cb.addEventListener('change', ()=> toggle(item.slug));
  const span = document.createElement('span'); span.textContent = item.label;
  wrap.appendChild(cb); wrap.appendChild(span);
  return wrap;
}

function renderGroups(){
  Object.keys(GROUPS).forEach(key => { const c = document.getElementById('grp-'+key); if(c) c.innerHTML=''; });
  const q = state.query.trim().toLowerCase();
  $('#filterStat').textContent = q? `"${q}" ile filtrelendi` : 'tüm özellikler';
  const matcher = (s)=> s.toLowerCase().includes(q);
  for(const [key, items] of Object.entries(GROUPS)){
    const container = document.getElementById('grp-'+key);
    if(!container) continue;
    items
      .filter(it => matcher(it.label))
      .forEach(item => container.appendChild(makeOption(item)));
  }
  updateSelStat();
}

function toggle(slug){
  if(state.selected.has(slug)) state.selected.delete(slug); else state.selected.add(slug);
  persist(); updateSelStat();
}

function updateSelStat(){ $('#selStat').textContent = `${state.selected.size} özellik seçildi`; }

function selectAllVisible(){
  const q = state.query.trim().toLowerCase();
  const matcher = (s)=> s.toLowerCase().includes(q);
  Object.values(GROUPS).flat()
    .filter(it => matcher(it.label))
    .forEach(it => state.selected.add(it.slug));
  persist(); renderGroups();
}
function clearAll(){ state.selected.clear(); persist(); renderGroups(); }

function expandAll(){ $$('details').forEach(d=> d.open = true); }
function collapseAll(){ $$('details').forEach(d=> d.open = false); }

// ---- Özet / Export ----
function buildSummary(){
  // gruplara göre seçilenleri hem label hem slug olarak topla
  const selectedByGroup = {};
  for(const [key, items] of Object.entries(GROUPS)){
    const chosen = items.filter(it=> state.selected.has(it.slug));
    if(chosen.length) {
      selectedByGroup[key] = chosen.map(it => ({ label: it.label, slug: it.slug }));
    }
  }

  const payload = {
    company: state.fields.company || null,
    website: state.fields.website || null,
    industry: state.fields.industry || null,
    email: state.fields.email || null,
    monthlyMessages: state.fields.monthlyMessages || null,
    temsilciCount: state.fields.temsilciCount || null,
    selectedFeatures: [...state.selected],   // slug listesi
    selectedByGroup,                         // detaylı
    selectedCount: state.selected.size,
    exportedAt: new Date().toISOString()
  };

  const pretty = JSON.stringify(payload, null, 2);
  $('#summaryText').textContent = pretty;
  $('#summary').style.display = 'block';
  return payload;
}

function download(filename, content){
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([content], {type: 'text/plain'}));
  a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 500);
}

function exportJSON(){
  const payload = buildSummary();
  if(!payload.selectedCount){ alert('Seçim yok.'); return; }
  download('canli-destek-form.json', JSON.stringify(payload, null, 2));
}
function exportCSV(){
  const rows = ['Grup,Etiket,Slug'];
  for(const [key, items] of Object.entries(GROUPS)){
    items
      .filter(it=> state.selected.has(it.slug))
      .forEach(it=> rows.push(`${key},"${it.label.replace(/"/g,'\\"')}",${it.slug}`));
  }
  if(rows.length===1){ alert('Seçim yok.'); return; }
  download('canli-destek-ozellikler.csv', rows.join('\n'));
}
function copySummary(){
  const text = $('#summaryText').textContent;
  if(!text){ alert('Önce özet oluştur.'); return; }
  navigator.clipboard.writeText(text).then(()=> toast('Özet panoya kopyalandı.'));
}

function shareLink(){
  if(!state.selected.size){ alert('Paylaşılabilir bağlantı için en az bir seçim yap.'); return; }
  const u = new URL(location.href);
  // slug listesi olarak paylaş
  u.searchParams.set('select', encodeURIComponent(JSON.stringify([...state.selected])));
  navigator.clipboard.writeText(u.toString()).then(()=> toast('Bağlantı panoya kopyalandı.'));
  history.replaceState({}, '', u);
}

function toast(msg){
  const t = document.createElement('div');
  t.textContent = msg;
  t.style.position='fixed'; t.style.bottom='20px'; t.style.left='50%'; t.style.transform='translateX(-50%)';
  t.style.background='linear-gradient(135deg, var(--primary), var(--accent))'; t.style.color='#0b1220';
  t.style.padding='10px 14px'; t.style.borderRadius='12px'; t.style.boxShadow= 'var(--shadow)'; t.style.zIndex=1000; t.style.fontWeight='600';
  document.body.appendChild(t);
  setTimeout(()=> t.remove(), 1500);
}

async function saveSummary(){
  const payload = buildSummary(); // "Özet Oluştur" ile aynı içerik
  try {
    const res = await fetch('/api/summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    toast('Özet kaydedildi • ID: ' + (data.id || '—'));
  } catch (err) {
    console.error(err);
    alert('Kaydetme sırasında bir hata oluştu.');
  }
}


// ---- Form submit → Backend JSON ----
function bindFormSubmit() {
  const form = document.getElementById('featureForm');
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const payload = {
      company: document.getElementById('company')?.value?.trim() || '',
      website: document.getElementById('website')?.value?.trim() || '',
      industry: document.getElementById('industry')?.value?.trim() || '',
      email: document.getElementById('email')?.value?.trim() || '',
      phone: document.getElementById('phone')?.value?.trim() || '',
      monthlyMessages: (new FormData(form)).get('monthlyMessages') || null,
      temsilciCount: (new FormData(form)).get('temsilciCount') || null,
      // slug listesi
      features: [...state.selected],
      // backend CSRF (sunucu dolduracak)
      csrf_token: document.getElementById('csrf_token')?.value || null
    };

    try {
      const res = await fetch('/api/needs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json().catch(()=> ({}));
      toast('Talebiniz alındı!');
      if (data?.id) {
        setTimeout(()=> window.location.href = `/teklif/${data.id}`, 600);
      }
    } catch (err) {
      console.error(err);
      alert('Gönderim sırasında bir hata oluştu.');
    }
  });
}

// ---- Events ----
document.getElementById('q').addEventListener('input', (e)=>{ state.query = e.target.value; renderGroups(); });
document.getElementById('selectAll').addEventListener('click', selectAllVisible);
document.getElementById('clearAll').addEventListener('click', clearAll);
document.getElementById('expandAll').addEventListener('click', expandAll);
document.getElementById('collapseAll').addEventListener('click', collapseAll);
document.getElementById('buildSummary').addEventListener('click', buildSummary);
document.getElementById('devamEt').addEventListener('click', async () => {
  showPackageSuggestion();     // mevcut davranış dursun
  await saveSummary();         // özet JSON’unu Mongo’ya kaydet
});
document.getElementById('jsonBtn').addEventListener('click', exportJSON);
document.getElementById('csvBtn').addEventListener('click', exportCSV);
document.getElementById('copyBtn').addEventListener('click', copySummary);
document.getElementById('shareBtn').addEventListener('click', shareLink);

// ---- Init ----
hydrate();
bindCompanyFields();
bindMonthlyMessages();
bindTemsilciCount();
renderGroups();
bindFormSubmit();
