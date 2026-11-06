import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';

const INITIAL_SESSIONS = [
  {
    id: 's1',
    deviceType: 'desktop',
    device: 'Chrome · Linux',
    who: 'Administrator Super · Super-admin',
    where: '213.230.98.17 · Samarqand',
    when: 'Boshlangan bugun 12:31 · faol hozir',
    current: true,
    isNew: false,
  },
  {
    id: 's2',
    deviceType: 'phone',
    device: 'Safari · iPhone',
    who: 'Administrator Super · Super-admin',
    where: '84.54.70.212 · Toshkent',
    when: 'Boshlangan kecha 22:47 · 3 soat oldin faol',
    current: false,
    isNew: true,
  },
  {
    id: 's3',
    deviceType: 'desktop',
    device: 'Edge · Windows',
    who: 'Operator Platform · Platforma operatori',
    where: '195.158.8.40 · Toshkent',
    when: 'Boshlangan bugun 09:02 · 12 daqiqa oldin faol',
    current: false,
    isNew: false,
  },
  {
    id: 's4',
    deviceType: 'desktop',
    device: 'Chrome · macOS',
    who: 'Analitika Analitika · Platforma analitigi',
    where: '89.236.218.5 · Samarqand',
    when: 'Boshlangan bugun 10:40 · 1 soat oldin faol',
    current: false,
    isNew: false,
  },
];

const LOGIN_ATTEMPTS = [
  {
    id: 'l1',
    status: 'ok',
    time: 'Bugun 12:31',
    who: 'Administrator Super',
    login: 'superadmin',
    ip: '213.230.98.17',
    geo: 'Samarqand, UZ',
    device: 'Chrome · Linux',
    note: 'Odatiy qurilma',
  },
  {
    id: 'l2',
    status: 'blocked',
    time: 'Bugun 11:58',
    who: 'Operator Platform',
    login: 'platformadmin',
    ip: '185.139.137.4',
    geo: 'Toshkent, UZ',
    device: 'Firefox · Windows',
    note: '3 ta xatodan keyin 15 daqiqaga bloklandi',
  },
  {
    id: 'l3',
    status: 'fail',
    time: 'Bugun 11:57',
    who: 'Operator Platform',
    login: 'platformadmin',
    ip: '185.139.137.4',
    geo: 'Toshkent, UZ',
    device: 'Firefox · Windows',
    note: '2-urinish',
  },
  {
    id: 'l4',
    status: 'fail',
    time: 'Bugun 11:56',
    who: 'Operator Platform',
    login: 'platformadmin',
    ip: '185.139.137.4',
    geo: 'Toshkent, UZ',
    device: 'Firefox · Windows',
    note: '1-urinish',
  },
  {
    id: 'l5',
    status: 'ok',
    time: 'Bugun 10:40',
    who: 'Analitika Analitika',
    login: 'analitik',
    ip: '89.236.218.5',
    geo: 'Samarqand, UZ',
    device: 'Chrome · macOS',
    note: 'Odatiy qurilma',
  },
  {
    id: 'l6',
    status: 'ok',
    time: 'Bugun 09:02',
    who: 'Operator Platform',
    login: 'platformadmin',
    ip: '195.158.8.40',
    geo: 'Toshkent, UZ',
    device: 'Edge · Windows',
    note: 'Odatiy qurilma',
  },
  {
    id: 'l7',
    status: 'unknown',
    time: 'Bugun 03:14',
    who: 'Noma’lum',
    login: 'admin',
    ip: '45.143.200.18',
    geo: 'Niderlandiya',
    device: 'python-requests',
    note: 'Mavjud bo‘lmagan login · avtomatik so‘rov',
  },
];

/**
 * Xavfsizlik "Kirishlar va seanslar" tabi mantiq hooki.
 */
export function useSecuritySessionsFlow() {
  const [closedIds, setClosedIds] = useState({});
  const [filter, setFilter] = useState('all');
  const [pendingCloseSession, setPendingCloseSession] = useState(null);
  const [isCloseAllPending, setIsCloseAllPending] = useState(false);

  const activeSessions = useMemo(
    () => INITIAL_SESSIONS.filter((s) => !closedIds[s.id]),
    [closedIds]
  );

  const filteredAttempts = useMemo(() => {
    return LOGIN_ATTEMPTS.filter((r) => {
      if (filter === 'all') return true;
      if (filter === 'ok') return r.status === 'ok';
      if (filter === 'fail') return r.status === 'fail' || r.status === 'unknown';
      if (filter === 'blocked') return r.status === 'blocked';
      return true;
    });
  }, [filter]);

  const requestCloseSession = (session) => {
    setPendingCloseSession(session);
  };

  const confirmCloseSession = () => {
    if (!pendingCloseSession) return;
    setClosedIds((prev) => ({ ...prev, [pendingCloseSession.id]: true }));
    toast.success('Seans muvaffaqiyatli yopildi');
    setPendingCloseSession(null);
  };

  const cancelCloseSession = () => {
    setPendingCloseSession(null);
  };

  const requestCloseAllOthers = () => {
    setIsCloseAllPending(true);
  };

  const confirmCloseAllOthers = () => {
    const toClose = {};
    INITIAL_SESSIONS.forEach((s) => {
      if (!s.current) toClose[s.id] = true;
    });
    setClosedIds((prev) => ({ ...prev, ...toClose }));
    toast.success('Boshqa barcha seanslar yopildi');
    setIsCloseAllPending(false);
  };

  const cancelCloseAllOthers = () => {
    setIsCloseAllPending(false);
  };

  return {
    sessions: activeSessions,
    attempts: filteredAttempts,
    filter,
    setFilter,
    pendingCloseSession,
    requestCloseSession,
    confirmCloseSession,
    cancelCloseSession,
    isCloseAllPending,
    requestCloseAllOthers,
    confirmCloseAllOthers,
    cancelCloseAllOthers,
  };
}
