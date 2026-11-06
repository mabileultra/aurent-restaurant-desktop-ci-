export const EMAIL_TAB_KEYS = {
  SEND: 'send',
  HISTORY: 'history',
  TEMPLATES: 'templates',
  SETTINGS: 'settings',
};

export const AUDIENCE_MODES = [
  { id: 'all', title: 'Barcha faol', sub: '349 foydalanuvchi' },
  { id: 'role', title: 'Rol bo‘yicha', sub: '5 ta rol' },
  { id: 'company', title: 'Korxona bo‘yicha', sub: '111 ta korxona' },
  { id: 'manual', title: 'Qo‘lda tanlash', sub: 'Ism yoki email bo‘yicha' },
];

export const ROLE_OPTIONS = [
  { id: 'ADMIN', label: 'Administrator', count: 110 },
  { id: 'CASHIER', label: 'Kassir', count: 115 },
  { id: 'WAITER', label: 'Ofitsiant', count: 104 },
  { id: 'MANAGER', label: 'Menejer', count: 18 },
  { id: 'COOK', label: 'Oshpaz', count: 1 },
];

export const INITIAL_PEOPLE = [
  { id: 'p1', ini: 'DK', name: 'Dilshod Karimov', email: 'd.karimov@dostonkafe.uz', role: 'Administrator', company: 'DOSTON KAFE', checked: true },
  { id: 'p2', ini: 'MY', name: 'Malika Yusupova', email: 'malika.y@xanbaliq.uz', role: 'Kassir', company: 'XAN BALIQ MCHJ', checked: true },
  { id: 'p3', ini: 'SA', name: 'Sardor Aliyev', email: 's.aliyev@gijdivon.uz', role: 'Menejer', company: 'GIJDIVON SHASHLIK', checked: true },
  { id: 'p4', ini: 'NR', name: 'Nodira Rahimova', email: 'nodira.r@alinurgarden.uz', role: 'Ofitsiant', company: 'Alinur Garden', checked: false },
  { id: 'p5', ini: 'JT', name: 'Jasur Toshmatov', email: 'j.toshmatov@zafar.uz', role: 'Administrator', company: 'ZAFAR TAMADDIXONA', checked: false },
];

export const INITIAL_COMPANIES = [
  { id: 'c1', name: 'XAN BALIQ MCHJ', count: 13 },
  { id: 'c2', name: 'DOSTON KAFE', count: 12 },
  { id: 'c3', name: 'GIJDIVON SHASHLIK', count: 11 },
];

export const HISTORY_TYPES = [
  { id: 'all', label: 'Barchasi' },
  { id: 'bulk', label: 'Ommaviy' },
  { id: 'cred', label: 'Kirish ma’lumotlari' },
  { id: 'login', label: 'Super-admin kirishi' },
];

export const INITIAL_HISTORY_ROWS = [
  {
    id: 'b0', type: 'bulk', subject: 'Kassa ilovasining yangi versiyasi', audience: 'Rol: Kassir',
    total: 115, ok: 64, fail: 0, queued: 51, time: 'Bugun, 09:20', sender: 'Administrator Super', fails: []
  },
  {
    id: 'b1', type: 'bulk', subject: 'Ertaga texnik ishlar olib boriladi', audience: 'Rol: Administrator, Menejer',
    total: 128, ok: 126, fail: 2, queued: 0, time: 'Bugun, 09:14', sender: 'Administrator Super',
    fails: [
      { who: 'Nodira Rahimova · Alinur Garden', email: 'nodira.r@alinurgarden.uz', reason: 'Pochta qutisi topilmadi (550)' },
      { who: 'Jasur Toshmatov · ZAFAR TAMADDIXONA', email: 'j.toshmatov@zafar.uz', reason: 'Email manzili noto‘g‘ri' }
    ]
  },
  {
    id: 'c1', type: 'cred', subject: 'Kirish ma’lumotlari — Aurent POS', audience: 'Malika Yusupova · XAN BALIQ MCHJ',
    total: 1, ok: 1, fail: 0, queued: 0, time: 'Bugun, 08:52', sender: 'Avtomatik', fails: []
  },
  {
    id: 's1', type: 'login', subject: 'Super-admin kirishi: Administrator Super', audience: '2 ta nazorat manzili',
    total: 2, ok: 2, fail: 0, queued: 0, time: 'Bugun, 08:31', sender: 'Avtomatik', fails: []
  },
  {
    id: 'b2', type: 'bulk', subject: 'Yangi hisobotlar bo‘limi ishga tushdi', audience: 'Barcha faol foydalanuvchilar',
    total: 349, ok: 343, fail: 6, queued: 0, time: '4-noy, 15:40', sender: 'Administrator Super',
    fails: [
      { who: '6 ta qabul qiluvchi', email: 'Ro‘yxatni yuklab olish mumkin', reason: '4 tasida pochta qutisi to‘la, 2 tasida domen topilmadi' }
    ]
  },
  {
    id: 'c2', type: 'cred', subject: 'Kirish ma’lumotlari — Aurent POS', audience: 'Sardor Aliyev · GIJDIVON SHASHLIK',
    total: 1, ok: 0, fail: 1, queued: 0, time: '4-noy, 11:03', sender: 'Avtomatik',
    fails: [
      { who: 'Sardor Aliyev · GIJDIVON SHASHLIK', email: 's.aliyev@gijdivon.uz', reason: 'Pochta qutisi topilmadi (550)' }
    ]
  },
  {
    id: 'b3', type: 'bulk', subject: 'Noyabr oyi uchun to‘lov eslatmasi', audience: 'Korxona: 12 ta tanlangan',
    total: 47, ok: 47, fail: 0, queued: 0, time: '1-noy, 10:00', sender: 'Administrator Super', fails: []
  },
  {
    id: 's2', type: 'login', subject: 'Super-admin kirishi: yangi IP manzil', audience: '2 ta nazorat manzili',
    total: 2, ok: 2, fail: 0, queued: 0, time: '31-okt, 22:47', sender: 'Avtomatik', fails: []
  }
];

export const INITIAL_TEMPLATES_CONFIG = {
  USER_CREDENTIALS: {
    id: 'cred',
    code: 'USER_CREDENTIALS',
    title: 'Kirish ma’lumotlari',
    trigger: 'Yangi foydalanuvchi yaratilganda unga avtomatik yuboriladi',
    last: 'Oxirgisi bugun 08:52 · noyabrda 41 ta',
    secure: true,
    hasSwitch: true,
    enabled: true,
    uz: {
      subject: 'Aurent POS — kirish ma’lumotlaringiz',
      button: 'Tizimga kirish',
      body: 'Assalomu alaykum, {{fullName}}!\n\n{{companyName}} uchun Aurent POS tizimida sizga hisob yaratildi.\n\nLogin: {{username}}\nParol: {{password}}\nRol: {{role}}\nKorxona kodi (kassa uchun): {{companyLoginCode}}\n\nBirinchi kirishdan so‘ng parolni profil sozlamalarida almashtirishni tavsiya qilamiz.'
    },
    ru: {
      subject: 'Данные для входа — Aurent POS',
      button: 'Войти в систему',
      body: 'Здравствуйте, {{fullName}}!\n\nДля вас создана учётная запись в системе Aurent POS ({{companyName}}).\n\nЛогин: {{username}}\nПароль: {{password}}\nРоль: {{role}}\nКод компании (для кассы): {{companyLoginCode}}\n\nПосле первого входа рекомендуем сменить пароль в настройках профиля.'
    },
    vars: [
      { key: '{{fullName}}', desc: 'To‘liq ism' },
      { key: '{{username}}', desc: 'Login' },
      { key: '{{password}}', desc: 'Vaqtinchalik parol' },
      { key: '{{role}}', desc: 'Rol' },
      { key: '{{companyName}}', desc: 'Korxona nomi' },
      { key: '{{companyLoginCode}}', desc: 'Korxona kodi' },
      { key: '{{loginUrl}}', desc: 'Kirish havolasi' }
    ]
  },
  SUPER_ADMIN_LOGIN: {
    id: 'login',
    code: 'SUPER_ADMIN_LOGIN',
    title: 'Super-admin kirishi',
    trigger: 'SUPER_ADMIN roli bilan kirilganda nazorat manzillariga yuboriladi',
    last: 'Oxirgisi bugun 08:31 · noyabrda 195 ta',
    secure: false,
    hasSwitch: true,
    enabled: true,
    uz: {
      subject: 'Super-admin kirishi: {{fullName}}',
      button: 'Xavfsizlik jurnalini ochish',
      body: '{{fullName}} ({{username}}) super-admin paneliga kirdi.\n\nVaqt: {{loginTime}}\nIP manzil: {{ipAddress}}\nQurilma: {{userAgent}}\n\nAgar bu kirishni siz amalga oshirmagan bo‘lsangiz, darhol parolni almashtiring va xavfsizlik jurnalini tekshiring.'
    },
    ru: {
      subject: 'Вход супер-админа: {{fullName}}',
      button: 'Открыть журнал безопасности',
      body: 'Пользователь {{fullName}} ({{username}}) вошёл в панель супер-админа.\n\nВремя: {{loginTime}}\nIP-адрес: {{ipAddress}}\nУстройство: {{userAgent}}\n\nЕсли это были не вы, немедленно смените пароль и проверьте журнал безопасности.'
    },
    vars: [
      { key: '{{fullName}}', desc: 'To‘liq ism' },
      { key: '{{username}}', desc: 'Login' },
      { key: '{{email}}', desc: 'Email' },
      { key: '{{loginTime}}', desc: 'Kirish vaqti' },
      { key: '{{ipAddress}}', desc: 'IP manzil' },
      { key: '{{userAgent}}', desc: 'Brauzer va qurilma' }
    ]
  },
  BROADCAST: {
    id: 'bulk',
    code: 'BROADCAST',
    title: 'Ommaviy xabar',
    trigger: 'Pochta › Yuborish sahifasidan qo‘lda yuboriladigan xatlar qolipi',
    last: 'Oxirgisi bugun 09:20 · noyabrda 8 ta',
    secure: false,
    hasSwitch: false,
    enabled: true,
    uz: {
      subject: '{{subject}}',
      button: 'Tizimga kirish',
      body: 'Assalomu alaykum, {{recipientName}}!\n\n{{message}}\n\nHurmat bilan,\nAurent POS jamoasi'
    },
    ru: {
      subject: '{{subject}}',
      button: 'Войти в систему',
      body: 'Здравствуйте, {{recipientName}}!\n\n{{message}}\n\nС уважением,\nкоманда Aurent POS'
    },
    vars: [
      { key: '{{recipientName}}', desc: 'Qabul qiluvchi ismi' },
      { key: '{{subject}}', desc: 'Yuborishda kiritilgan mavzu' },
      { key: '{{message}}', desc: 'Yuborishda kiritilgan matn' }
    ]
  }
};
