import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { ImagePlus, Trash2 } from 'lucide-react';
import { readImageDataUrl } from '../../../../utils/readImageDataUrl';

export default function LogoUploadField({ label, hint, dataUrl, onSet, onClear, previewSize = 64 }) {
  const { t } = useTranslation();
  const inputRef = useRef(null);

  const onPick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const url = await readImageDataUrl(file);
      onSet(url);
      toast.success(t('tenantSettings.logoUploaded'));
    } catch (err) {
      if (err.message === 'TOO_LARGE') toast.error(t('tenantSettings.logoTooLarge'));
      else if (err.message === 'NOT_IMAGE') toast.error(t('tenantSettings.logoNotImage'));
      else toast.error(t('tenantSettings.logoUploadFailed'));
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-ink-muted">{label}</p>
      <div className="flex flex-wrap items-center gap-3">
        <div
          className="flex shrink-0 items-center justify-center overflow-hidden rounded-control border border-dashed border-line-strong bg-canvas"
          style={{ width: previewSize, height: previewSize }}
        >
          {dataUrl ? (
            <img src={dataUrl} alt="" className="h-full w-full object-contain" />
          ) : (
            <ImagePlus size={24} strokeWidth={1.75} className="text-ink-disabled" aria-hidden />
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="ui-btn ui-btn-secondary ui-btn-sm"
          >
            {t('tenantSettings.uploadLogo')}
          </button>
          {dataUrl ? (
            <button
              type="button"
              onClick={onClear}
              className="ui-btn ui-btn-danger ui-btn-sm"
            >
              <Trash2 size={14} strokeWidth={1.75} />
              {t('tenantSettings.removeLogo')}
            </button>
          ) : null}
        </div>
      </div>
      {hint ? <p className="text-xs text-ink-muted">{hint}</p> : null}
      <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={onPick} />
    </div>
  );
}
