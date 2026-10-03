/**
 * When restaurant local-first is on and API is reachable, snapshot menu + tables into SQLite.
 */
import { useEffect, useRef } from 'react';
import { rstMenuApi } from '../../api/menu.api';
import { rstFloorApi } from '../../api/floor.api';
import { userApi } from '../../../api';
import {
  isRestaurantLocalFirstOn,
  rstOfflineImportBootstrap,
  rstOfflineGetStatus,
} from '../../../services/offline/restaurantOfflineBridge';
import { logLocalFirst } from '../../../services/desktop/activityLog';
import { BOOTSTRAP_REFRESH_EVENT } from '../../../services/offline/peerHubSettings';

const BOOTSTRAP_TTL_MS = 5 * 60_000;

export function useRestaurantOfflineBootstrap(storeId) {
  const lastAtRef = useRef(0);

  useEffect(() => {
    if (storeId == null) return undefined;
    if (!isRestaurantLocalFirstOn()) return undefined;

    let cancelled = false;

    const run = async (force = false) => {
      const now = Date.now();
      if (!force && now - lastAtRef.current < BOOTSTRAP_TTL_MS) {
        const status = await rstOfflineGetStatus().catch(() => null);
        if (status?.bootstrapReady) return;
      }

      try {
        const [catRes, menuRes, floorRes, rosterRes] = await Promise.all([
          rstMenuApi.listCategories(storeId, true),
          rstMenuApi.list(storeId, true),
          rstFloorApi.getFloorSnapshot(storeId),
          userApi.getPosRoster(storeId).catch(() => ({ data: [] })),
        ]);
        if (cancelled) return;

        const categories = catRes?.data || [];
        const menuItems = (menuRes?.data || []).map((row) => ({
          ...row,
          id: row.id,
          serverId: row.id,
          categoryId: row.categoryId,
          name: row.name,
          price: row.price ?? row.sellingPrice,
          active: row.active !== false,
        }));
        const halls = floorRes?.data?.halls || floorRes?.data || [];
        const tables = [];
        const hallList = Array.isArray(halls) ? halls : [];
        for (const hall of hallList) {
          for (const table of hall.tables || []) {
            tables.push({
              id: table.id,
              serverId: table.id,
              name: table.code || table.name || String(table.id),
              zoneName: hall.name || null,
              sortOrder: table.sortOrder,
              active: table.active !== false,
              hallId: hall.id,
              hallName: hall.name,
              code: table.code,
              label: table.label,
              seatCount: table.seatCount,
              posX: table.posX,
              posY: table.posY,
              width: table.width,
              height: table.height,
              status: table.status,
              servicePercent: table.servicePercent ?? hall.servicePercent,
              hallSortOrder: hall.sortOrder,
              hallServicePercent: hall.servicePercent,
            });
          }
        }

        await rstOfflineImportBootstrap({
          storeId,
          syncedAt: new Date().toISOString(),
          categories: categories.map((c) => ({
            id: c.id,
            serverId: c.id,
            name: c.name,
            sortOrder: c.sortOrder,
            autoPrint: c.autoPrint,
            printPrinterName: c.printPrinterName,
            active: c.active !== false,
          })),
          menuItems,
          tables,
          roster: rosterRes?.data || [],
        });
        lastAtRef.current = Date.now();
        logLocalFirst('Меню/столы сохранены локально', {
          storeId,
          categories: categories.length,
          menuItems: menuItems.length,
          tables: tables.length,
          roster: (rosterRes?.data || []).length,
          force: Boolean(force),
        });
      } catch (err) {
        logLocalFirst(
          'Bootstrap меню пропущен (офлайн или ошибка API)',
          { storeId, error: err?.message || String(err) },
          'warn',
        );
      }
    };

    const onForce = () => {
      lastAtRef.current = 0;
      void run(true);
    };

    void run();
    const timer = window.setInterval(() => void run(false), BOOTSTRAP_TTL_MS);
    window.addEventListener(BOOTSTRAP_REFRESH_EVENT, onForce);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.removeEventListener(BOOTSTRAP_REFRESH_EVENT, onForce);
    };
  }, [storeId]);
}
