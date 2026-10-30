import { useState } from 'react';
import toast from 'react-hot-toast';
import { downloadSpreadsheet } from '../../../utils/downloadSpreadsheet';
import {
  buildMenuDishExportBytes,
  buildMenuDishTemplateBytes,
} from '../utils/menuDishSpreadsheet';

export function useMenuDishExport({ t, items, stations, menuCategories }) {
  const [busy, setBusy] = useState(false);

  const downloadBytes = async (bytes, prefix) => {
    const blob = new Blob([bytes], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    await downloadSpreadsheet(blob, prefix);
  };

  const exportList = async () => {
    setBusy(true);
    try {
      const bytes = await buildMenuDishExportBytes(items || [], { stations, menuCategories });
      await downloadBytes(bytes, 'menu_dishes');
      toast.success(t('rst.admin.menuExportDone'));
    } catch {
      toast.error(t('rst.admin.menuExportFailed'));
    } finally {
      setBusy(false);
    }
  };

  const downloadTemplate = async () => {
    setBusy(true);
    try {
      const bytes = await buildMenuDishTemplateBytes();
      await downloadBytes(bytes, 'menu_dishes_template');
      toast.success(t('rst.admin.menuImportTemplateDone'));
    } catch {
      toast.error(t('rst.admin.menuExportFailed'));
    } finally {
      setBusy(false);
    }
  };

  return { busy, exportList, downloadTemplate };
}
