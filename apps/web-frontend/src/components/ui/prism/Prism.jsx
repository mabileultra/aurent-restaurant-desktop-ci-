import React, { useEffect, useRef } from 'react';
import './Prism.css';
import { clamp } from './prismMath';
import { usePrismRenderer } from './usePrismRenderer';

export default function Prism({
  height = 3.5,
  baseWidth = 5.5,
  animationType = 'rotate',
  glow = 1,
  offset,
  noise = 0,
  scale = 3.6,
  hueShift = 0,
  colorFrequency = 1,
  colors,
  saturation = 1.5,
  timeScale = 0.5,
  interactive = true,
  hoverStrength = 2,
  inertia = 0.05,
  intro = true,
  resolution = 0.5,
  lightMode = false,
  dpr,
  className = '',
  style,
  ...rest
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const wakeRef = useRef(null);
  const palette = Array.isArray(colors) ? colors.filter(Boolean).slice(0, 8) : [];

  const settings = {
    height: Math.max(0.1, height),
    baseWidth: Math.max(0.1, baseWidth),
    animationType: animationType === 'rotate3d' ? '3drotate' : animationType,
    glow: Math.max(0, glow),
    offsetX: offset?.x ?? 0,
    offsetY: offset?.y ?? 0,
    noise: Math.max(0, noise),
    scale: Math.max(0.1, scale),
    hueShift: ((hueShift || 0) * Math.PI) / 180,
    colorFrequency: Math.max(0, colorFrequency),
    colors: palette,
    saturation: Math.max(0, saturation),
    timeScale: Math.max(0, timeScale),
    interactive,
    hoverStrength: Math.max(0, hoverStrength),
    inertia: clamp(inertia, 0.001, 1),
    intro,
    resolution: clamp(resolution, 0.25, 1),
    lightMode,
    dpr,
  };

  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  usePrismRenderer(containerRef, canvasRef, settingsRef, wakeRef);

  useEffect(() => {
    wakeRef.current?.();
  });

  return (
    <div
      ref={containerRef}
      className={`prism${className ? ` ${className}` : ''}`}
      style={style}
      {...rest}
    >
      <canvas ref={canvasRef} className="prism-canvas" aria-hidden="true" />
    </div>
  );
}
