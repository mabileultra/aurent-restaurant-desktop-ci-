export const EMAIL_TAB_KEYS = {
  SEND: 'send',
  HISTORY: 'history',
  TEMPLATES: 'templates',
  SETTINGS: 'settings',
};

export const AUDIENCE_MODES = [
  { id: 'all', title: 'Barcha faol', sub: 'Barcha faol xodimlar' },
  { id: 'role', title: 'Rol bo‘yicha', sub: 'Lavozimlar bo‘yicha' },
];

export const ROLE_OPTIONS = [
  { id: 'ADMIN', label: 'Administrator', count: 0 },
  { id: 'CASHIER', label: 'Kassir', count: 0 },
  { id: 'WAITER', label: 'Ofitsiant', count: 0 },
  { id: 'MANAGER', label: 'Menejer', count: 0 },
  { id: 'COOK', label: 'Oshpaz', count: 0 },
];

export const INITIAL_PEOPLE = [];

export const INITIAL_COMPANIES = [];

export const HISTORY_TYPES = [
  { id: 'all', label: 'Barchasi' },
  { id: 'bulk', label: 'Ommaviy' },
  { id: 'cred', label: 'Kirish ma’lumotlari' },
  { id: 'login', label: 'Super-admin kirishi' },
];

export const INITIAL_HISTORY_ROWS = [];

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
