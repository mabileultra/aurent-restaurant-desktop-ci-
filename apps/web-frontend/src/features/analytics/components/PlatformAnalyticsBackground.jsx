import React from 'react';
import Prism from '../../../components/ui/prism/Prism';
import PixelSnow from '../../../components/ui/pixel-snow/PixelSnow';

export default function PlatformAnalyticsBackground({ isAlert = false }) {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden="true"
    >
      {/* Normal State: Prism Crystal Background */}
      <div
        className={`absolute inset-0 transition-opacity duration-700 ease-out ${
          isAlert ? 'opacity-0 pointer-events-none' : 'opacity-95'
        }`}
      >
        <Prism
          animationType="rotate"
          timeScale={0.5}
          height={3.5}
          baseWidth={4.7}
          scale={3.5}
          hueShift={0}
          colorFrequency={1.05}
          glow={1.1}
          colors={[]}
          saturation={1.3}
          noise={0}
          interactive
          hoverStrength={2}
          inertia={0.06}
          intro
          resolution={0.5}
          lightMode={true}
        />
        <div className="absolute inset-0 bg-slate-900/[0.04] pointer-events-none" />
      </div>

      {/* Alert State: Red Warning PixelSnow Background */}
      {isAlert && (
        <div className="absolute inset-0 transition-opacity duration-700 ease-out opacity-100">
          <PixelSnow
            color="#cc0505"
            variant="snowflake"
            density={0.45}
            speed={1}
            wind={0.25}
            flakeSize={1}
            pixelSize={3}
            glow={0.8}
            mouseInteraction
            sway={0.5}
            twinkle={0.35}
            accumulate={false}
            depth={0.6}
            brightness={1}
            fade={0}
            opacity={0.9}
            intro
            lightMode={false}
          />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(239,68,68,0.18)_0%,_rgba(190,18,60,0.22)_60%,_rgba(136,19,55,0.35)_100%)] pointer-events-none animate-pulse" />
        </div>
      )}
    </div>
  );
}
