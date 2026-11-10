import React from 'react';

function IsometricPattern() {
  return (
    <svg className="absolute inset-0 w-full h-full opacity-15" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="iso-cubes" width="60" height="104" patternUnits="userSpaceOnUse" patternTransform="scale(1)">
          <path d="M30 0 L60 17.32 L60 51.96 L30 69.28 L0 51.96 L0 17.32 Z" fill="none" stroke="currentColor" strokeWidth="1" className="text-blue-400" />
          <path d="M30 0 L30 34.64 L60 51.96" fill="none" stroke="currentColor" strokeWidth="1" className="text-blue-400" />
          <path d="M30 34.64 L0 51.96" fill="none" stroke="currentColor" strokeWidth="1" className="text-blue-400" />
          <path d="M30 69.28 L30 104 L60 121.32" fill="none" stroke="currentColor" strokeWidth="1" className="text-blue-400" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#iso-cubes)" />
    </svg>
  );
}

function CoverImage({ src, alt }) {
  return (
    <>
      <img src={src} alt={alt} className="absolute inset-0 w-full h-full object-cover object-center" />
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-slate-950/45" />
    </>
  );
}

function layerClass(active) {
  return `absolute inset-0 ${active ? 'opacity-100' : 'opacity-0 pointer-events-none'}`;
}

/** Keep all layers mounted — no remount / transition wave on tab click. */
export default function ViloyatHeroBackground({ activeType = 'A' }) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div className={layerClass(activeType === 'A')} aria-hidden={activeType !== 'A'}>
        <div className="absolute top-0 right-0 bottom-0 w-full md:w-3/5 lg:w-1/2 flex">
          <div className="w-1/3 h-full overflow-hidden relative">
            <img src="/analytics/grocery.jpg" alt="Oziq-ovqat" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-slate-950/20" />
          </div>
          <div className="w-1/3 h-full overflow-hidden relative border-l border-white/10">
            <img src="/analytics/restaurant.jpg" alt="Restoran" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-slate-950/20" />
          </div>
          <div className="w-1/3 h-full overflow-hidden relative border-l border-white/10">
            <img src="/analytics/pharmacy.jpg" alt="Dorixona" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-slate-950/20" />
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent md:hidden" />
      </div>

      <div className={layerClass(activeType === 'F')} aria-hidden={activeType !== 'F'} data-hero="grocery">
        <CoverImage src="/analytics/grocery.jpg" alt="Oziq-ovqat" />
      </div>
      <div className={layerClass(activeType === 'R')} aria-hidden={activeType !== 'R'} data-hero="restaurant">
        <CoverImage src="/analytics/restaurant.jpg" alt="Restoranlar" />
      </div>
      <div className={layerClass(activeType === 'P')} aria-hidden={activeType !== 'P'} data-hero="pharmacy">
        <CoverImage src="/analytics/pharmacy.jpg" alt="Dorixonalar" />
      </div>
      <div
        className={`${layerClass(activeType === 'O')} bg-gradient-to-br from-slate-950 via-[#0B1528] to-slate-900`}
        aria-hidden={activeType !== 'O'}
        data-hero="other"
      >
        <IsometricPattern />
        <div className="absolute inset-0 bg-radial from-transparent to-slate-950/80" />
      </div>
    </div>
  );
}
