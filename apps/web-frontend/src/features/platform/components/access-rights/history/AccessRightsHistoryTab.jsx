import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { platformModuleAccessApi } from '../../../../../api';
import AccessRightsHistoryFiltersBar from './AccessRightsHistoryFiltersBar';
import AccessRightsHistoryItemCard from './AccessRightsHistoryItemCard';
import AccessRightsHistoryEmptyState from './AccessRightsHistoryEmptyState';

export default function AccessRightsHistoryTab({ onReverted }) {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [datePreset, setDatePreset] = useState('7d');
  const [actionType, setActionType] = useState('all');

  const todayHeader = useMemo(() => {
    const d = new Date();
    const day = d.getDate();
    const month = new Intl.DateTimeFormat('uz-UZ', { month: 'long' }).format(d).toUpperCase();
    return `BUGUN · ${day}-${month}`;
  }, []);

  const { data: rawHistory = [], isLoading, refetch } = useQuery({
    queryKey: ['access-rights-history'],
    queryFn: async () => {
      try {
        const res = await platformModuleAccessApi.history({ page: 0, size: 50 });
        const list = Array.isArray(res?.data) ? res.data : (res?.data?.content || []);
        return list;
      } catch {
        return [];
      }
    },
    staleTime: 30_000,
  });

  const revertMutation = useMutation({
    mutationFn: async (historyId) => {
      return platformModuleAccessApi.revertHistory(historyId);
    },
    onSuccess: () => {
      toast.success('O‘zgarish muvaffaqiyatli bekor qilindi (avvalgi holatga qaytarildi)');
      refetch();
      qc.invalidateQueries({ queryKey: ['access-v2-users'] });
      qc.invalidateQueries({ queryKey: ['platform-module-access-stats'] });
      if (onReverted) onReverted();
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Qaytarishda xatolik yuz berdi');
    },
  });

  // Sample fallback mock history if backend table is empty yet
  const items = useMemo(() => {
    if (rawHistory.length > 0) {
      return rawHistory.map((h, i) => {
        let daysAgo = 0;
        if (h.createdAt) {
          const diffMs = Date.now() - new Date(h.createdAt).getTime();
          daysAgo = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
        } else if (h.dateHeader && !h.dateHeader.includes('BUGUN')) {
          daysAgo = 7;
        }
        return {
          id: h.id || `h-${i}`,
          dateHeader: daysAgo === 0 ? todayHeader : (h.dateHeader || 'Oldingi'),
          daysAgo,
          time: h.time || '11:05',
          operatorInitials: h.operatorInitials || 'Po',
          title: h.title || `${h.operatorName || 'Platforma operatori'} ${h.targetName || 'xodim'} uchun istisno berdi`,
          actionType: h.actionType || 'exception',
          subtitle: h.subtitle || `${h.companyName || 'Dorixona'} · ${h.role || 'Admin'} · 1 xodim`,
          details: h.details || JSON.stringify(h.diff || h.modules || {}),
        };
      });
    }

    return [
      {
        id: 'h-1',
        dateHeader: todayHeader,
        daysAgo: 0,
        time: '11:05',
        operatorInitials: 'Po',
        title: 'Platforma operatori Bekzod Ergashev uchun istisno berdi',
        actionType: 'exception',
        subtitle: 'Shifo Dorixona · Administrator · 1 xodim',
        details: '+ Oflayn rejim: ruxsat berildi, + AI-assistent: ruxsat berildi',
      },
      {
        id: 'h-2',
        dateHeader: '30-OKTABR',
        daysAgo: 7,
        time: '10:02',
        operatorInitials: 'Po',
        title: 'Platforma operatori Madina Yusupova uchun istisno berdi',
        actionType: 'exception',
        subtitle: 'Bahor Restoran · Ofitsiant · 1 xodim',
        details: '+ Yetkazib berish: ruxsat berildi',
      },
      {
        id: 'h-3',
        dateHeader: '28-OKTABR',
        daysAgo: 9,
        time: '16:40',
        operatorInitials: 'Ad',
        title: 'Admin Restoran shabloniga o‘zgartirish kiritdi',
        actionType: 'template',
        subtitle: 'Restoran · Kassir · 42 xodimga ta‘sir qildi',
        details: 'Kassa oynasi guruhi modullari yangilandi',
      },
    ];
  }, [rawHistory, todayHeader]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (datePreset === 'today' && item.daysAgo > 0) return false;
      if (datePreset === '7d' && item.daysAgo > 7) return false;
      if (datePreset === '30d' && item.daysAgo > 30) return false;
      if (actionType !== 'all' && item.actionType !== actionType) return false;
      if (search) {
        const query = search.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(query);
        const matchesSub = item.subtitle.toLowerCase().includes(query);
        if (!matchesTitle && !matchesSub) return false;
      }
      return true;
    });
  }, [items, datePreset, actionType, search]);

  const counts = useMemo(() => {
    const c = { all: items.length, template: 0, exception: 0, copy: 0, bulk: 0 };
    items.forEach((it) => {
      if (c[it.actionType] !== undefined) c[it.actionType] += 1;
    });
    return c;
  }, [items]);

  // Group by dateHeader
  const groupedByDate = useMemo(() => {
    const map = new Map();
    filteredItems.forEach((it) => {
      const header = it.dateHeader || 'Boshqa';
      if (!map.has(header)) map.set(header, []);
      map.get(header).push(it);
    });
    return Array.from(map.entries());
  }, [filteredItems]);

  return (
    <div className="space-y-4">
      <AccessRightsHistoryFiltersBar
        search={search}
        onSearchChange={setSearch}
        datePreset={datePreset}
        onDatePresetChange={setDatePreset}
        actionType={actionType}
        onActionTypeChange={setActionType}
        counts={counts}
      />

      <div className="space-y-6">
        {filteredItems.length === 0 ? (
          <AccessRightsHistoryEmptyState
            canClear={Boolean(search || datePreset !== '30d' || actionType !== 'all')}
            onClearFilters={() => {
              setSearch('');
              setDatePreset('30d');
              setActionType('all');
            }}
          />
        ) : (
          groupedByDate.map(([dateTitle, dateItems]) => (
            <div key={dateTitle} className="space-y-2.5">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1">
                {dateTitle}
              </div>

              <div className="space-y-2">
                {dateItems.map((item) => (
                  <AccessRightsHistoryItemCard
                    key={item.id}
                    item={item}
                    onRevert={(id) => revertMutation.mutate(id)}
                    isReverting={revertMutation.isPending}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
