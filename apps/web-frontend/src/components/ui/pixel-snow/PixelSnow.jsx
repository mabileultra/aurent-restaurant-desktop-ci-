import React, { useEffect, useRef } from 'react';
import { VARIANTS } from './pixelSnowSprites';
import { usePixelSnowRenderer } from './usePixelSnowRenderer';
import './PixelSnow.css';

export default function PixelSnow({
  color = '#ffffff',
  variant = 'snowflake',
  density = 1,
  speed = 1,
  wind = 0,
  flakeSize = 1,
  pixelSize = 4,
  glow = 0.5,
  mouseInteraction = true,
  sway = 1,
  twinkle = 0.3,
  accumulate = false,
  depth = 0.5,
  brightness = 1,
  fade = 0.2,
  opacity = 1,
  intro = true,
  lightMode = false,
  paused = false,
  dpr,
  className = '',
  ...rest
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);

  const settings = {
    color,
    variant: Math.max(0, VARIANTS.indexOf(variant)),
    density,
    speed,
    wind,
    flakeSize,
    pixelSize,
    glow,
    mouseInteraction,
    sway,
    twinkle,
    accumulate,
    depth,
    brightness,
    fade,
    opacity,
    intro,
    lightMode,
    paused,
    dpr,
  };

  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const wakeRef = usePixelSnowRenderer(containerRef, canvasRef, settingsRef);

  useEffect(() => {
    wakeRef.current?.();
  });

  return (
    <div ref={containerRef} className={`pixel-snow-container${className ? ` ${className}` : ''}`} {...rest}>
      <canvas ref={canvasRef} className="pixel-snow-canvas" aria-hidden="true" />
    </div>
  );
}
