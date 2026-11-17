import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { UserCog } from 'lucide-react';
import { APP_NAME } from '../../../../config/brand';
import {
  USER_FORM_FIELD_DEFS,
  useTenantDisplayStore,
  SYSTEM_LOGO_SIZE_MIN_PX,
  SYSTEM_LOGO_SIZE_MAX_PX,
} from '../../../../store/tenantDisplayStore';
import LogoUploadField from './LogoUploadField';
import ReceiptLogoSizeControl from './ReceiptLogoSizeControl';
import SettingsFieldToggles from './SettingsFieldToggles';
import BrandMark from '../../../../components/shared/BrandMark';
import TenantSettingsSaveBar from './TenantSettingsSaveBar';

const inputCls = 'ui-input mt-1';

export default function UserBrandingSettingsPanel() {
  const { t } = useTranslation();
  const fetchFromServer = useTenantDisplayStore((s) => s.fetchFromServer);
  const systemLogoDataUrl = useTenantDisplayStore((s) => s.draft.systemLogoDataUrl);
  const systemLogoSizePx = useTenantDisplayStore((s) => s.draft.systemLogoSizePx);
  const systemAppName = useTenantDisplayStore((s) => s.draft.systemAppName);
  const receiptLogoDataUrl = useTenantDisplayStore((s) => s.draft.receiptLogoDataUrl);
  const receiptLogoMaxHeightMm = useTenantDisplayStore((s) => s.draft.receiptLogoMaxHeightMm);
  const userFormFields = useTenantDisplayStore((s) => s.draft.userFormFields);
  const setSystemLogo = useTenantDisplayStore((s) => s.setSystemLogo);
  const clearSystemLogo = useTenantDisplayStore((s) => s.clearSystemLogo);
  const setSystemLogoSizePx = useTenantDisplayStore((s) => s.setSystemLogoSizePx);
  const setReceiptLogo = useTenantDisplayStore((s) => s.setReceiptLogo);
  const clearReceiptLogo = useTenantDisplayStore((s) => s.clearReceiptLogo);
  const setReceiptLogoMaxHeightMm = useTenantDisplayStore((s) => s.setReceiptLogoMaxHeightMm);
  const setSystemAppName = useTenantDisplayStore((s) => s.setSystemAppName);
  const setUserFormField = useTenantDisplayStore((s) => s.setUserFormField);
  const resetUserFormFields = useTenantDisplayStore((s) => s.resetUserFormFields);

  const previewAppName = systemAppName.trim() || APP_NAME;

  useEffect(() => {
    fetchFromServer();
  }, [fetchFromServer]);

  return (
    <section className="ui-card">
      <div className="flex items-center gap-2 border-b border-line px-4 py-3">
        <UserCog size={18} strokeWidth={1.75} className="text-primary-600" />
        <h2 className="text-sm font-semibold text-ink">
          {t('tenantSettings.userTitle')}
        </h2>
      </div>
      <div className="space-y-5 p-4">
        <LogoUploadField
          label={t('tenantSettings.systemLogo')}
          hint={t('tenantSettings.systemLogoHint')}
          dataUrl={systemLogoDataUrl}
          onSet={setSystemLogo}
          onClear={clearSystemLogo}
          previewSize={Math.min(96, systemLogoSizePx)}
        />

        {systemLogoDataUrl ? (
          <div>
            <label className="ui-label">
              {t('tenantSettings.systemLogoSize')}
            </label>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <input
                type="range"
                min={SYSTEM_LOGO_SIZE_MIN_PX}
                max={SYSTEM_LOGO_SIZE_MAX_PX}
                step={2}
                value={systemLogoSizePx}
                onChange={(e) => setSystemLogoSizePx(e.target.value)}
                className="min-w-[10rem] flex-1 accent-primary-500"
              />
              <span className="text-sm font-medium ui-tabular text-ink">
                {systemLogoSizePx} {t('tenantSettings.systemLogoSizeUnit')}
              </span>
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-input border border-dashed border-line-strong bg-canvas">
                <BrandMark size={systemLogoSizePx} />
              </div>
            </div>
            <p className="mt-1 text-xs text-ink-muted">
              {t('tenantSettings.systemLogoSizeHint')}
            </p>
          </div>
        ) : null}

        <div className="flex items-center gap-3 rounded-input border border-line bg-canvas px-3 py-2">
          <div className="admin-icon-tile !h-12 !w-12 !rounded-xl">
            <BrandMark size={28} />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-ink-muted">{t('tenantSettings.preview')}</p>
            <p className="truncate font-semibold text-ink">{previewAppName}</p>
          </div>
        </div>

        <div>
          <label className="ui-label">
            {t('tenantSettings.systemAppName')}
          </label>
          <input
            className={inputCls}
            value={systemAppName}
            onChange={(e) => setSystemAppName(e.target.value)}
            placeholder={APP_NAME}
          />
          <p className="mt-1 text-xs text-ink-muted">{t('tenantSettings.systemAppNameHint')}</p>
        </div>

        <div className="border-t border-line pt-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">
            {t('tenantSettings.brandingReceiptSection')}
          </p>
          <div className="space-y-4">
            <LogoUploadField
              label={t('tenantSettings.receiptLogo')}
              hint={t('tenantSettings.receiptLogoHint')}
              dataUrl={receiptLogoDataUrl}
              onSet={setReceiptLogo}
              onClear={clearReceiptLogo}
              previewSize={72}
            />
            <ReceiptLogoSizeControl
              mm={receiptLogoMaxHeightMm}
              onChange={setReceiptLogoMaxHeightMm}
              previewDataUrl={receiptLogoDataUrl}
            />
          </div>
        </div>

        <div>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              {t('tenantSettings.userFieldsTitle')}
            </p>
            <button
              type="button"
              onClick={resetUserFormFields}
              className="text-xs font-medium text-primary-600 hover:text-primary-700"
            >
              {t('tenantSettings.resetFields')}
            </button>
          </div>
          <p className="mb-2 text-xs text-ink-muted">{t('tenantSettings.userFieldsHint')}</p>
          <SettingsFieldToggles
            defs={USER_FORM_FIELD_DEFS}
            values={userFormFields}
            onChange={setUserFormField}
            labelFor={(key) => t(key)}
          />
        </div>

        <TenantSettingsSaveBar />
      </div>
    </section>
  );
}
