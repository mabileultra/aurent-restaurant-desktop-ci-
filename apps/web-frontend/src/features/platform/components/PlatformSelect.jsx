import React, { forwardRef, useMemo } from 'react';
import clsx from 'clsx';
import { BaseSelect } from '../../../components/ui';
import { cleanGeoName } from '../../shared/geo/geoNameUtils';
import '../../../styles/platform/platform-select.css';

/**
 * Standardized, high-performance Select component for Super Admin (Platform).
 * Wraps BaseSelect with platform defaults, automatic search toggling,
 * active filter highlights, and sanitized labels (e.g. apostrophes in geo names).
 */
const PlatformSelect = forwardRef(function PlatformSelect(
  {
    options = [],
    value = '',
    onChange,
    onValueChange,
    placeholder = '',
    searchable,
    cleanGeo = false,
    size = 'sm',
    className,
    menuClassName,
    theme = 'default',
    disabled = false,
    ariaLabel,
    ...rest
  },
  ref
) {
  // Normalize options: supports strings, objects, and optional cleanGeoName
  const normalizedOptions = useMemo(() => {
    const list = options.map((opt) => {
      if (typeof opt === 'string' || typeof opt === 'number') {
        const str = String(opt);
        return {
          value: str,
          label: cleanGeo ? cleanGeoName(str) : str,
        };
      }
      if (!opt) return { value: '', label: '' };
      const rawLabel = opt.label ?? opt.name ?? opt.value ?? '';
      return {
        ...opt,
        value: opt.value ?? '',
        label: cleanGeo || (typeof rawLabel === 'string' && rawLabel.includes("''"))
          ? cleanGeoName(rawLabel)
          : rawLabel,
      };
    });

    // If placeholder is provided and not already in options as empty value, prepend it
    if (placeholder && !list.some((o) => o.value === '')) {
      return [{ value: '', label: placeholder }, ...list];
    }
    return list;
  }, [options, placeholder, cleanGeo]);

  const hasActiveValue = Boolean(value && value !== '' && value !== 'all');

  const handleChange = (e) => {
    onChange?.(e);
    onValueChange?.(e?.target?.value ?? e);
  };

  const autoSearchable = searchable ?? (normalizedOptions.length > 5);
  const isAnalyticsRoute = typeof window !== 'undefined' && window.location.pathname.includes('/analytics');
  const isBlueTheme =
    theme === 'blue' ||
    (isAnalyticsRoute && theme !== 'emerald' && theme !== 'default' && theme !== 'slate') ||
    (typeof className === 'string' && className.includes('platform-select--blue'));

  return (
    <BaseSelect
      ref={ref}
      size={size}
      searchable={autoSearchable}
      disabled={disabled}
      className={clsx(
        'platform-select',
        isBlueTheme && 'platform-select--blue',
        size === 'md' && 'platform-select--md',
        hasActiveValue && 'platform-select--active base-select--active-filter',
        className
      )}
      menuClassName={clsx(
        isBlueTheme && 'platform-select__menu--blue',
        menuClassName
      )}
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      options={normalizedOptions}
      aria-label={ariaLabel}
      {...rest}
    />
  );
});

export default React.memo(PlatformSelect);
