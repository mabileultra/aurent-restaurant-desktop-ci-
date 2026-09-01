import PublicLazyImage from './PublicLazyImage';

export default function PublicDeviceFrame({
  src,
  srcSet,
  alt,
  variant = 'tablet',
  loading = 'lazy',
  sizes = '(max-width: 900px) 100vw, 480px',
  className = '',
}) {
  return (
    <div className={`public-device-frame public-device-frame--${variant} ${className}`.trim()}>
      <div className="public-device-frame__glow" aria-hidden />
      <div className={`public-device-frame__bezel${variant === 'phone' ? ' public-device-frame__bezel--phone' : ''}`}>
        <PublicLazyImage
          src={src}
          srcSet={srcSet}
          alt={alt}
          loading={loading}
          sizes={sizes}
        />
      </div>
    </div>
  );
}
