import { useMemo, useState } from 'react';

const AUDIT_PEOPLE = {
  sys: { name: 'Tizim', ini: 'T', bg: '#F1F5F9', fg: '#334155' },
  sa: { name: 'Administrator Super', ini: 'AS', bg: '#006847', fg: '#FFFFFF' },
  op: { name: 'Operator Platform', ini: 'OP', bg: '#E6F2EC', fg: '#043D2C' },
  an: { name: 'Analitika Analitika', ini: 'AA', bg: '#EFF6FF', fg: '#1D4ED8' },
};

const AUDIT_ROWS = [
  {
    id: 'a1',
    moduleKey: 'security',
    moduleName: 'Xavfsizlik',
    personKey: 'sys',
    time: '6-noy 11:58',
    fullTime: '6-noyabr 2026, 11:58:12',
    from: '185.139.137.4 · Toshkent · Firefox, Windows',
    action: 'platformadmin hisobi 15 daqiqaga bloklandi',
    diff: [
      { field: 'Holat', before: 'Faol', after: 'Vaqtincha bloklangan' },
      { field: 'Sabab', before: '—', after: '3 marta noto‘g‘ri parol' },
    ],
    linkText: 'Kirishlar tarixini ochish',
  },
  {
    id: 'a2',
    moduleKey: 'security',
    moduleName: 'Xavfsizlik',
    personKey: 'an',
    time: '6-noy 10:42',
    fullTime: '6-noyabr 2026, 10:42:05',
    from: '89.236.218.5 · Samarqand · Chrome, macOS',
    action: 'O‘z parolini almashtirdi',
    diff: [
      { field: 'Parol', before: '••••••', after: 'yangilandi' },
      { field: 'Boshqa seanslar', before: '2 ta faol', after: 'yopildi' },
    ],
  },
  {
    id: 'a3',
    moduleKey: 'billing',
    moduleName: 'To‘lov va tariflar',
    personKey: 'op',
    time: '6-noy 09:15',
    fullTime: '6-noyabr 2026, 09:15:41',
    from: '195.158.8.40 · Toshkent · Edge, Windows',
    action: 'XAN BALIQ MCHJ tarifini o‘zgartirdi',
    diff: [
      { field: 'Tarif', before: 'Biznes', after: 'Standart' },
      { field: 'Amal qilish', before: '—', after: '1-dekabrdan' },
    ],
    linkText: 'XAN BALIQ MCHJ kartasini ochish',
  },
  {
    id: 'a4',
    moduleKey: 'mail',
    moduleName: 'Pochta',
    personKey: 'sa',
    time: '6-noy 09:14',
    fullTime: '6-noyabr 2026, 09:14:02',
    from: '213.230.98.17 · Samarqand · Chrome, Linux',
    action: '128 kishiga ommaviy xabar yubordi',
    diff: [
      { field: 'Mavzu', before: '—', after: 'Ertaga texnik ishlar olib boriladi' },
      { field: 'Auditoriya', before: '—', after: 'Administrator, Menejer' },
    ],
    linkText: 'Pochta tarixida ochish',
  },
  {
    id: 'a5',
    moduleKey: 'access',
    moduleName: 'Ruxsatlar',
    personKey: 'sa',
    time: '5-noy 17:20',
    fullTime: '5-noyabr 2026, 17:20:33',
    from: '213.230.98.17 · Samarqand · Chrome, Linux',
    action: 'Platforma operatoriga «Analitika» bo‘limini ochdi',
    diff: [{ field: 'Analitika', before: 'Yopiq', after: 'Ko‘rish' }],
    linkText: 'Kirish huquqlarini ochish',
  },
  {
    id: 'a6',
    moduleKey: 'comp',
    moduleName: 'Kompaniyalar',
    personKey: 'op',
    time: '5-noy 15:03',
    fullTime: '5-noyabr 2026, 15:03:18',
    from: '195.158.8.40 · Toshkent · Edge, Windows',
    action: '404 Toys uchun yangi filial qo‘shdi',
    diff: [
      { field: 'Nomi', before: '—', after: 'Urgut filiali' },
      { field: 'Turi', before: '—', after: 'Oziq-ovqat' },
    ],
    linkText: 'Filialni ochish',
  },
];

/**
 * Xavfsizlik "Harakatlar jurnali" tabi mantiq hooki.
 */
export function useSecurityAuditFlow() {
  const [selectedModule, setSelectedModule] = useState('all');
  const [selectedId, setSelectedId] = useState('a1');

  const filteredRows = useMemo(() => {
    return AUDIT_ROWS.filter((r) => {
      if (selectedModule === 'all') return true;
      return r.moduleKey === selectedModule;
    }).map((r) => {
      const person = AUDIT_PEOPLE[r.personKey] ?? AUDIT_PEOPLE.sys;
      return {
        ...r,
        personName: person.name,
        personInitials: person.ini,
        personBg: person.bg,
        personFg: person.fg,
      };
    });
  }, [selectedModule]);

  const selectedItem = useMemo(() => {
    const found = filteredRows.find((r) => r.id === selectedId);
    return found ?? filteredRows[0] ?? null;
  }, [filteredRows, selectedId]);

  return {
    selectedModule,
    setSelectedModule,
    filteredRows,
    selectedItem,
    selectedId: selectedItem?.id ?? '',
    selectRow: setSelectedId,
  };
}
