import React, { useRef } from 'react';
import { clamp } from './lightTunnelShaders';
import { useLightTunnelRenderer } from './useLightTunnelRenderer';
import './LightTunnel.css';

export function LightTunnel({
  cableColor = '#ffffff',
  pulseColor = '#ffffff',
  tunnelColor = '#ffffff',
  tunnelOpacity = 0,
  speed = 0.1,
  flowDirection = 'inward',
  pulseSpeed = 2,
  pulseLength = 0.28,
  pulseBlend = 0.6,
  pulseWidth = 1,
  pulseDensity = 0.5,
  cableCount = 56,
  thickness = 0.35,
  rimWidth = 0.15,
  waviness = 0.3,
  sway = 0.5,
  bend = 0.4,
  size = 1,
  centerX = 0,
  centerY = 0,
  glow = 1,
  fadeNear = 0.5,
  fadeFar = 2,
  brightness = 1,
  colorVariance = true,
  grain = false,
  grainIntensity = 0.05,
  opacity = 1,
  mouseInteraction = true,
  mouseStrength = 0.1,
  clickSurge = true,
  intro = true,
  variation = 0,
  lightMode = false,
  dpr,
  className = '',
  style,
  ...rest
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);

  const settings = {
    cableColor,
    pulseColor,
    tunnelColor,
    tunnelOpacity: clamp(tunnelOpacity, 0, 1),
    speed: Math.max(0, speed),
    flow: flowDirection === 'outward' ? 1 : -1,
    pulseSpeed: Math.max(0, pulseSpeed),
    pulseLength: clamp(pulseLength, 0.02, 1),
    pulseBlend: clamp(pulseBlend, 0, 1),
    pulseWidth: clamp(pulseWidth, 0.1, 3),
    pulseDensity: clamp(pulseDensity, 0, 1),
    cableCount: clamp(Math.round(cableCount), 4, 200),
    thickness: clamp(thickness, 0.05, 2),
    rimWidth: clamp(rimWidth, 0, 1),
    waviness: Math.max(0, waviness),
    sway: Math.max(0, sway),
    bend: Math.max(0, bend),
    size: Math.max(0.05, size),
    centerX,
    centerY,
    glow: Math.max(0, glow),
    fadeNear: Math.max(0.001, fadeNear),
    fadeFar: Math.max(0.01, fadeFar),
    brightness: Math.max(0, brightness),
    colorVariance,
    grain,
    grainIntensity: Math.max(0, grainIntensity),
    opacity: clamp(opacity, 0, 1),
    mouseInteraction,
    mouseStrength: Math.max(0, mouseStrength),
    clickSurge,
    intro,
    variation,
    lightMode,
    dpr,
  };

  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  useLightTunnelRenderer({ containerRef, canvasRef, settingsRef });

  return (
    <div
      ref={containerRef}
      className={`light-tunnel-container${className ? ` ${className}` : ''}`}
      style={style}
      {...rest}
    >
      <canvas ref={canvasRef} className="light-tunnel-canvas" aria-hidden="true" />
    </div>
  );
}

export default LightTunnel;
