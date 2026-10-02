/**
 * When restaurant local-first is on and API is reachable, snapshot menu + tables into SQLite.
 */
import { useEffect, useRef } from 'react';
import { rstMenuApi } from '../../api/menu.api';
import { rstFloorApi } from '../../api/floor.api';
import {
  isRestaurantLocalFirstDesktop,
  isRestaurantOfflineBridge,
  rstOfflineImportBootstrap,
  rstOfflineGetStatus,
} from '../../../services/offline/restaurantOfflineBridge';
import { logLocalFirst } from '../../../services/desktop/activityLog';

const BOOTSTRAP_TTL_MS = 5 * 60_000;

export function useRestaurantOfflineBootstrap(storeId) {
  const lastAtRef = useRef(0);

  useEffect(() => {
    if (storeId == null) return undefined;
    if (!isRestaurantLocalFirstDesktop() || !isRestaurantOfflineBridge()) return undefined;

    let cancelled = false;

    const run = async () => {
      const now = Date.now();
      if (now - lastAtRef.current < BOOTSTRAP_TTL_MS) {
        const status = await rstOfflineGetStatus().catch(() => null);
        if (status?.bootstrapReady) return;
      }

      try {
        const [catRes, menuRes, floorRes] = await Promise.all([
          rstMenuApi.listCategories(storeId, true),
          rstMenuApi.list(storeId, true),
          rstFloorApi.getFloorSnapshot(storeId),
        ]);
        if (cancelled) return;

        const categories = catRes?.data || [];
        const menuItems = (menuRes?.data || []).map((row) => ({
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
        });
        lastAtRef.current = Date.now();
        logLocalFirst('Меню/столы сохранены локально', {
          storeId,
          categories: categories.length,
          menuItems: menuItems.length,
          tables: tables.length,
        });
      } catch (err) {
        logLocalFirst(
          'Bootstrap меню пропущен (офлайн или ошибка API)',
          { storeId, error: err?.message || String(err) },
          'warn',
        );
      }
    };

    void run();
    const timer = window.setInterval(run, BOOTSTRAP_TTL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [storeId]);
}
