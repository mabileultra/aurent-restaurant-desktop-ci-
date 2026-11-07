import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { platformModuleAccessApi } from '../../../../../api';
import AccessRightsHistoryFiltersBar from './AccessRightsHistoryFiltersBar';
import AccessRightsHistoryItemCard from './AccessRightsHistoryItemCard';
import AccessRightsHistoryEmptyState from './AccessRightsHistoryEmptyState';
import {
  formatHistoryDateHeader,
  formatHistoryTime,
  formatHistoryDiff,
} from './historyFormatUtils';

export default function AccessRightsHistoryTab({ onReverted }) {
  const qc = useQueryClient();
  const { i18n } = useTranslation();
  const isRu = i18n.language === 'ru';

  const [search, setSearch] = useState('');
  const [datePreset, setDatePreset] = useState('7d');
  const [actionType, setActionType] = useState('all');

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
      toast.success(
        isRu
          ? 'Действие успешно отменено (предыдущее состояние восстановлено)'
          : 'O‘zgarish muvaffaqiyatli bekor qilindi (avvalgi holatga qaytarildi)'
      );
      refetch();
      qc.invalidateQueries({ queryKey: ['access-v2-users'] });
      qc.invalidateQueries({ queryKey: ['platform-module-access-stats'] });
      if (onReverted) onReverted();
    },
    onError: (err) => {
      toast.error(
        err?.response?.data?.message ||
          (isRu ? 'Ошибка при отмене действия' : 'Qaytarishda xatolik yuz berdi')
      );
    },
  });

  const items = useMemo(() => {
    return rawHistory.map((h, i) => {
      const createdAt = h.createdAt ? new Date(h.createdAt) : null;
      const diffMs = createdAt ? Date.now() - createdAt.getTime() : 0;
      const daysAgo = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

      let type = 'exception';
      if (h.action === 'RESET') type = 'exception';
      else if (h.action === 'BULK_RESET') type = 'bulk';
      else if (h.action === 'COPY') type = 'copy';
      else if (h.action === 'TEMPLATE') type = 'template';

      const actor = h.actorName || (isRu ? 'Оператор' : 'Platforma operatori');
      const target = h.targetFullName || h.targetUsername || (isRu ? 'сотрудник' : 'xodim');
      const actionTitle = isRu
        ? `${actor} изменил доступ для ${target}`
        : `${actor} ${target} uchun huquqlarni o‘zgartirdi`;

      const initials = (actor.slice(0, 2) || 'OP').toUpperCase();

      return {
        id: h.id || `h-${i}`,
        dateHeader: formatHistoryDateHeader(h.createdAt, isRu),
        daysAgo,
        time: formatHistoryTime(h.createdAt),
        operatorInitials: initials,
        title: actionTitle,
        actionType: type,
        subtitle: `${target}${h.strategy ? ` · ${h.strategy}` : ''}`,
        details: formatHistoryDiff(h.beforeModules, h.afterModules, h.action, isRu),
        canRevert: h.canRevert ?? true,
        revertedAt: h.revertedAt,
      };
    });
  }, [rawHistory, isRu]);

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
        const matchesDetails = item.details.toLowerCase().includes(query);
        if (!matchesTitle && !matchesSub && !matchesDetails) return false;
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

  const groupedByDate = useMemo(() => {
    const map = new Map();
    filteredItems.forEach((it) => {
      const header = it.dateHeader || (isRu ? 'Ранее' : 'Oldingi');
      if (!map.has(header)) map.set(header, []);
      map.get(header).push(it);
    });
    return Array.from(map.entries());
  }, [filteredItems, isRu]);

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
            canClear={Boolean(search || datePreset !== '7d' || actionType !== 'all')}
            onClearFilters={() => {
              setSearch('');
              setDatePreset('7d');
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
