import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { BaseButton, BaseInput, BaseSelect } from '../../../components/ui';
import { readImageDataUrl } from '../../../utils/readImageDataUrl';
import { rstKitchenApi } from '../../api/kitchen.api';
import {
  getDesktopPrinterSettings,
  isDesktopPrinter,
  printTicketLines,
} from '../../pos/utils/desktopPrinters';
import {
  styleDishLine,
  ticketPrintOptions,
  wrapSlipLines,
} from '../../shared/printProfile/applyPrintProfile';
import { invalidateStorePrintProfile } from '../../shared/printProfile/loadStorePrintProfile';
import {
  PRINT_FIELD_KEYS,
  PRINT_FONT_OPTIONS,
  PRINT_SIZE_OPTIONS,
  PRINT_SLIP_TYPES,
  factoryPrintProfile,
  fieldStyle,
} from '../../shared/printProfile/printProfileDefaults';
import { emphQtyNameRow } from '../../pos/utils/ticketLayout';

const SLIP_LABEL = {
  CANCEL: 'rst.admin.printSlipCancel',
  GUEST_BILL: 'rst.admin.printSlipGuestBill',
  KITCHEN: 'rst.admin.printSlipKitchen',
  SHIFT_ITEMS: 'rst.admin.printSlipShift',
};

const FIELD_LABEL = {
  logo: 'rst.admin.printFieldLogo',
  storeName: 'rst.admin.printFieldStoreName',
  address: 'rst.admin.printFieldAddress',
  phone: 'rst.admin.printFieldPhone',
  headerTitle: 'rst.admin.printFieldHeader',
  hallTable: 'rst.admin.printFieldHallTable',
  waiter: 'rst.admin.printFieldWaiter',
  time: 'rst.admin.printFieldTime',
  items: 'rst.admin.printFieldItems',
  totals: 'rst.admin.printFieldTotals',
  footer: 'rst.admin.printFieldFooter',
};

export default function RestaurantPrintProfilePanel({ storeId, t }) {
  const [profile, setProfile] = useState(factoryPrintProfile);
  const [slipType, setSlipType] = useState('CANCEL');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [receiptPrinterName, setReceiptPrinterName] = useState('');

  useEffect(() => {
    if (!isDesktopPrinter()) return undefined;
    let cancelled = false;
    getDesktopPrinterSettings()
      .then((s) => {
        if (!cancelled) setReceiptPrinterName(s?.receiptPrinterName || s?.billPrinterName || '');
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (storeId == null) return undefined;
    let cancelled = false;
    setLoading(true);
    rstKitchenApi.getPrintProfile(storeId)
      .then((res) => {
        if (!cancelled) setProfile(res?.data?.profile || factoryPrintProfile());
      })
      .catch(() => {
        if (!cancelled) setProfile(factoryPrintProfile());
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [storeId]);

  const patchRoot = (key, value) => setProfile((p) => ({ ...p, [key]: value }));

  const patchField = (fieldKey, patch) => {
    setProfile((p) => {
      const slips = { ...p.slips };
      const slip = { ...(slips[slipType] || { fields: {} }) };
      const fields = { ...slip.fields };
      fields[fieldKey] = { ...fieldStyle(p, slipType, fieldKey), ...patch };
      slip.fields = fields;
      slips[slipType] = slip;
      return { ...p, slips };
    });
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await rstKitchenApi.savePrintProfile(storeId, profile);
      setProfile(res?.data?.profile || profile);
      invalidateStorePrintProfile(storeId);
      toast.success(t('rst.admin.printersSaved'));
    } catch {
      toast.error(t('rst.admin.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const onLogo = async (file) => {
    if (!file) return;
    try {
      const dataUrl = await readImageDataUrl(file, 350 * 1024);
      patchRoot('logoDataUrl', dataUrl);
    } catch (err) {
      if (err?.message === 'TOO_LARGE') toast.error(t('rst.admin.printLogoTooLarge', { defaultValue: 'Логотип слишком большой' }));
      else toast.error(t('rst.admin.printLogoFailed', { defaultValue: 'Не удалось загрузить логотип' }));
    }
  };

  const testStyled = async () => {
    if (!isDesktopPrinter()) {
      toast.error(t('rst.admin.printersDesktopOnly'));
      return;
    }
    const printer = String(receiptPrinterName || '').trim();
    if (!printer) {
      toast.error(t('rst.admin.printersTestPick'));
      return;
    }
    setTesting(true);
    try {
      const title = t('rst.order.cancelPrintTitle', { defaultValue: 'ОТКАЗ' });
      const opts = ticketPrintOptions(profile, slipType);
      const dish = styleDishLine(emphQtyNameRow(1, 'Тест блюдо'), profile, slipType);
      await printTicketLines({
        title: fieldStyle(profile, slipType, 'headerTitle').on ? title : '',
        printerName: printer,
        lines: wrapSlipLines([
          t('rst.admin.printTestMeta', { defaultValue: 'Зал · Стол 1' }),
          '---',
          ...(dish ? [dish] : []),
          '---',
          t('rst.admin.printersTestOk'),
        ], profile, slipType),
        ...opts,
      });
      toast.success(t('rst.admin.printersTestOk'));
    } catch {
      toast.error(t('rst.admin.printersTestFailed'));
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return <p className="rst-coming__text">{t('common.loading')}</p>;
  }

  const fontOptions = [
    ...PRINT_FONT_OPTIONS.map((f) => ({
      value: f.id,
      label: t(f.labelKey, {
        defaultValue: f.id === 'times' ? 'Times New Roman' : f.id,
      }),
    })),
  ];

  return (
    <section className="rst-printers__block rst-print-profile">
      <h2 className="rst-printers__title">{t('rst.admin.printProfileTitle', { defaultValue: 'Оформление чеков' })}</h2>
      <p className="rst-printers__note">
        {t('rst.admin.printProfileHint', {
          defaultValue: 'Название, телефон, адрес, логотип и подвал печатаются на счёте и фискальном чеке, если поле заполнено. На отказе, кухне и смене их включают галочки на своей вкладке. Адрес без текста на чек не попадает.',
        })}
      </p>

      <div className="rst-admin-form__grid rst-admin-form__grid--printers">
        <div className="rst-admin-field">
          <span className="rst-admin-field__label">{t('rst.admin.printFieldLogo', { defaultValue: 'Логотип' })}</span>
          <div className="rst-print-profile__logo-row">
            {profile.logoDataUrl ? (
              <img src={profile.logoDataUrl} alt="" className="rst-print-profile__logo" />
            ) : (
              <span className="rst-admin-field__hint">—</span>
            )}
            <label className="rst-print-profile__file">
              <input type="file" accept="image/*" onChange={(e) => onLogo(e.target.files?.[0])} />
              {t('rst.admin.printLogoPick', { defaultValue: 'Загрузить' })}
            </label>
            {profile.logoDataUrl ? (
              <BaseButton type="button" variant="ghost" size="sm" onClick={() => patchRoot('logoDataUrl', '')}>
                {t('common.delete')}
              </BaseButton>
            ) : null}
          </div>
          <label className="rst-admin-field__hint">
            {t('rst.admin.printLogoHeight', { defaultValue: 'Высота лого, мм' })}: {profile.logoMaxHeightMm}
            <input
              type="range"
              min={8}
              max={40}
              value={profile.logoMaxHeightMm}
              onChange={(e) => patchRoot('logoMaxHeightMm', Number(e.target.value))}
            />
          </label>
        </div>

        <BaseInput
          label={t('rst.admin.printFieldStoreName', { defaultValue: 'Название' })}
          value={profile.storeName}
          onChange={(e) => patchRoot('storeName', e.target.value)}
        />
        <BaseInput
          label={t('rst.admin.printFieldPhone', { defaultValue: 'Телефон' })}
          value={profile.phone}
          onChange={(e) => patchRoot('phone', e.target.value)}
        />
        <BaseInput
          label={t('rst.admin.printFieldAddress', { defaultValue: 'Адрес' })}
          value={profile.address}
          onChange={(e) => patchRoot('address', e.target.value)}
        />
        <BaseInput
          label={t('rst.admin.printFieldFooter', { defaultValue: 'Подвал' })}
          value={profile.footer || ''}
          onChange={(e) => patchRoot('footer', e.target.value)}
        />
        <BaseSelect
          searchable={false}
          label={t('rst.admin.printDefaultFont', { defaultValue: 'Шрифт по умолчанию' })}
          value={profile.defaultFont || 'monospace'}
          onChange={(e) => patchRoot('defaultFont', e.target.value)}
          options={fontOptions}
        />
      </div>

      <div className="rst-print-profile__slip-tabs" role="tablist">
        {PRINT_SLIP_TYPES.map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            className={`rst-print-profile__tab${slipType === key ? ' is-active' : ''}`}
            onClick={() => setSlipType(key)}
          >
            {t(SLIP_LABEL[key], { defaultValue: key })}
          </button>
        ))}
      </div>

      <div className="rst-print-profile__fields">
        {PRINT_FIELD_KEYS.map((fieldKey) => {
          const style = fieldStyle(profile, slipType, fieldKey);
          return (
            <div key={fieldKey} className="rst-print-profile__field">
              <label className="rst-print-profile__on">
                <input
                  type="checkbox"
                  checked={style.on}
                  onChange={(e) => patchField(fieldKey, { on: e.target.checked })}
                />
                <span>{t(FIELD_LABEL[fieldKey], { defaultValue: fieldKey })}</span>
              </label>
              <label className="rst-print-profile__on">
                <input
                  type="checkbox"
                  checked={style.bold}
                  disabled={!style.on}
                  onChange={(e) => patchField(fieldKey, { bold: e.target.checked })}
                />
                <span>{t('rst.admin.printBold', { defaultValue: 'Жирный' })}</span>
              </label>
              <BaseSelect
                searchable={false}
                size="sm"
                value={style.size}
                disabled={!style.on}
                onChange={(e) => patchField(fieldKey, { size: e.target.value })}
                options={PRINT_SIZE_OPTIONS.map((s) => ({
                  value: s.id,
                  label: t(s.labelKey, {
                    defaultValue: s.id === 'sm' ? 'Мелкий' : s.id === 'lg' ? 'Крупный' : 'Обычный',
                  }),
                }))}
              />
              <BaseSelect
                searchable={false}
                size="sm"
                value={style.font || 'inherit'}
                disabled={!style.on}
                onChange={(e) => patchField(fieldKey, { font: e.target.value })}
                options={[
                  { value: 'inherit', label: t('rst.admin.printFontInherit', { defaultValue: 'Как общий' }) },
                  ...fontOptions,
                ]}
              />
            </div>
          );
        })}
      </div>

      <div className="rst-print-profile__actions">
        <BaseButton type="button" onClick={save} disabled={saving}>
          {saving ? t('common.loading') : t('common.save')}
        </BaseButton>
        <BaseButton type="button" variant="ghost" onClick={testStyled} disabled={testing || saving}>
          {testing ? t('common.loading') : t('rst.admin.printTestStyled', { defaultValue: 'Тест с оформлением' })}
        </BaseButton>
        <BaseButton
          type="button"
          variant="ghost"
          onClick={() => setProfile(factoryPrintProfile())}
          disabled={saving}
        >
          {t('rst.admin.printResetDefaults', { defaultValue: 'Сбросить к текущему виду' })}
        </BaseButton>
      </div>
    </section>
  );
}
