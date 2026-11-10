import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { platformSecurityApi } from '../../../api';
import { DEFAULT_SECURITY_RULES } from '../utils/securityConstants';
import { evaluatePasswordStrength } from '../utils/securityFormatUtils';

function cloneRules(source) {
  return {
    ...source,
    tfa: { ...(source.tfa || {}) },
    req: { ...(source.req || {}) },
    ips: Array.isArray(source.ips) ? source.ips.map((ip) => ({ ...ip })) : [],
  };
}

/**
 * Xavfsizlik "Kirish qoidalari" tabi mantiq hooki.
 */
export function useSecurityRulesFlow() {
  const qc = useQueryClient();
  const [rules, setRules] = useState(() => cloneRules(DEFAULT_SECURITY_RULES));
  const [baseline, setBaseline] = useState(() => cloneRules(DEFAULT_SECURITY_RULES));
  const [newIpAddr, setNewIpAddr] = useState('');
  const [cashierPw1, setCashierPw1] = useState('');
  const [cashierPw2, setCashierPw2] = useState('');
  const [showCashierPw, setShowCashierPw] = useState(false);
  const [isSudoModalOpen, setIsSudoModalOpen] = useState(false);
  const [sudoToken, setSudoToken] = useState(null);

  const { data: remoteRules } = useQuery({
    queryKey: ['platform-security-login-rules'],
    queryFn: () => platformSecurityApi.getLoginRules().then((r) => r.data),
  });

  useEffect(() => {
    if (!remoteRules) return;
    const next = cloneRules({ ...DEFAULT_SECURITY_RULES, ...remoteRules });
    setRules(next);
    setBaseline(cloneRules(next));
  }, [remoteRules]);

  const { data: cashierStatus, isLoading: isCashierLoading } = useQuery({
    queryKey: ['platform-security-password'],
    queryFn: () => platformSecurityApi.getCashierServerPassword().then((r) => r.data),
  });

  const cashierMutation = useMutation({
    mutationFn: (pwd) => platformSecurityApi.updateCashierServerPassword(pwd).then((r) => r.data),
    onSuccess: () => {
      toast.success('Kassa server sozlamalari paroli muvaffaqiyatli saqlandi');
      setCashierPw1('');
      setCashierPw2('');
      qc.invalidateQueries({ queryKey: ['platform-security-password'] });
    },
    onError: (e) => toast.error(e.response?.data?.message ?? 'Kassa parolini saqlashda xatolik yuz berdi'),
  });

  const saveRulesMutation = useMutation({
    mutationFn: ({ payload, token }) => platformSecurityApi.saveLoginRules(payload, token).then((r) => r.data),
    onSuccess: (data) => {
      const next = cloneRules({ ...DEFAULT_SECURITY_RULES, ...data });
      setRules(next);
      setBaseline(cloneRules(next));
      setIsSudoModalOpen(false);
      setSudoToken(null);
      toast.success('Kirish qoidalari saqlandi');
      qc.invalidateQueries({ queryKey: ['platform-security-login-rules'] });
    },
    onError: (e) => toast.error(e.response?.data?.message ?? 'Qoidalarni saqlab bo‘lmadi'),
  });

  const cashierPwStrength = useMemo(() => evaluatePasswordStrength(cashierPw1), [cashierPw1]);
  const isCashierPwMismatch = Boolean(cashierPw2 && cashierPw1 !== cashierPw2);
  const canSaveCashierPw = Boolean(
    cashierPw1 && cashierPw2 && cashierPw1 === cashierPw2 && cashierPwStrength.score >= 2
  );

  const handleCashierPwSave = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!canSaveCashierPw) return;
    cashierMutation.mutate(cashierPw1);
  };

  const dirtyCount = useMemo(() => {
    let count = 0;
    const def = baseline;
    ['method', 'minLen', 'expiry', 'idle', 'maxH', 'conc', 'notify', 'attempts', 'lockMin', 'ipOn'].forEach((k) => {
      if (rules[k] !== def[k]) count++;
    });
    Object.keys(def.tfa || {}).forEach((k) => {
      if (Boolean(rules.tfa?.[k]) !== Boolean(def.tfa?.[k])) count++;
    });
    Object.keys(def.req || {}).forEach((k) => {
      if (Boolean(rules.req?.[k]) !== Boolean(def.req?.[k])) count++;
    });
    if ((rules.ips || []).length !== (def.ips || []).length) count++;
    return count;
  }, [rules, baseline]);

  const toggleTfaRole = (roleKey) => {
    setRules((prev) => ({ ...prev, tfa: { ...prev.tfa, [roleKey]: !prev.tfa[roleKey] } }));
  };

  const setTfaMethod = (method) => setRules((prev) => ({ ...prev, method }));
  const setMinLen = (minLen) => setRules((prev) => ({ ...prev, minLen }));
  const setExpiry = (expiry) => setRules((prev) => ({ ...prev, expiry }));
  const toggleReq = (reqKey) => setRules((prev) => ({ ...prev, req: { ...prev.req, [reqKey]: !prev.req[reqKey] } }));
  const setConc = (conc) => setRules((prev) => ({ ...prev, conc }));
  const toggleNotify = () => setRules((prev) => ({ ...prev, notify: !prev.notify }));
  const toggleIpOn = () => setRules((prev) => ({ ...prev, ipOn: !prev.ipOn }));

  const addIp = () => {
    const trimmed = (newIpAddr || '').trim();
    if (!trimmed) return;
    setRules((prev) => ({ ...prev, ips: [...prev.ips, { addr: trimmed, note: 'Yangi qo‘shilgan' }] }));
    setNewIpAddr('');
    toast.success('IP oq ro‘yxatiga qo‘shildi');
  };

  const removeIp = (index) => {
    setRules((prev) => ({ ...prev, ips: prev.ips.filter((_, i) => i !== index) }));
  };

  const resetRules = () => {
    setRules(cloneRules(baseline));
    toast.success('O‘zgarishlar bekor qilindi');
  };

  const requestSaveRules = () => {
    if (dirtyCount === 0) return;
    setIsSudoModalOpen(true);
  };

  const confirmSudoAndSave = async ({ password, totpCode }) => {
    const reauth = await platformSecurityApi.reauth({ password, totpCode });
    const token = reauth.data?.sudoToken;
    if (!token) {
      toast.error('Qayta tasdiqlash muvaffaqiyatsiz');
      return;
    }
    setSudoToken(token);
    saveRulesMutation.mutate({ payload: rules, token });
  };

  return {
    rules,
    dirtyCount,
    toggleTfaRole,
    setTfaMethod,
    setMinLen,
    setExpiry,
    toggleReq,
    setConc,
    toggleNotify,
    toggleIpOn,
    newIpAddr,
    setNewIpAddr,
    addIp,
    removeIp,
    resetRules,
    requestSaveRules,
    confirmSudoAndSave,
    isSudoModalOpen,
    setIsSudoModalOpen,
    sudoToken,
    cashierStatus,
    isCashierLoading,
    cashierPw1,
    setCashierPw1,
    cashierPw2,
    setCashierPw2,
    showCashierPw,
    setShowCashierPw,
    cashierPwStrength,
    isCashierPwMismatch,
    canSaveCashierPw,
    handleCashierPwSave,
    isCashierSaving: cashierMutation.isPending,
    isSavingRules: saveRulesMutation.isPending,
  };
}
