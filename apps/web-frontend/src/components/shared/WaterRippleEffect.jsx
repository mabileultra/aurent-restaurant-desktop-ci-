import React, { useEffect, useRef } from 'react';
import {
  createWaterRippleGroup,
  updateWaterRippleGroups,
  renderWaterRippleGroups,
} from '../../utils/waterRippleEngine';

/**
 * Global water ripple animation on click/touch.
 * Lightweight HTML5 canvas overlay with zero DOM thrashing and zero idle overhead.
 */
export default function WaterRippleEffect({
  color = '56, 189, 248',
  maxRadius = 80,
  speed = 1.4,
  disabled = false,
}) {
  const canvasRef = useRef(null);
  const groupsRef = useRef([]);
  const animFrameIdRef = useRef(null);

  useEffect(() => {
    if (disabled) return;

    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const handleResize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const renderLoop = () => {
      const dpr = window.devicePixelRatio || 1;
      ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

      groupsRef.current = updateWaterRippleGroups(groupsRef.current);
      renderWaterRippleGroups(ctx, groupsRef.current);

      if (groupsRef.current.length > 0) {
        animFrameIdRef.current = requestAnimationFrame(renderLoop);
      } else {
        animFrameIdRef.current = null;
      }
    };

    const handlePointerDown = (e) => {
      if (e.button !== undefined && e.button !== 0) return;

      const newGroup = createWaterRippleGroup(e.clientX, e.clientY, {
        color,
        maxRadius,
        speed,
      });

      groupsRef.current.push(newGroup);

      if (!animFrameIdRef.current) {
        animFrameIdRef.current = requestAnimationFrame(renderLoop);
      }
    };

    window.addEventListener('pointerdown', handlePointerDown, { passive: true });

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('pointerdown', handlePointerDown);
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
        animFrameIdRef.current = null;
      }
      groupsRef.current = [];
    };
  }, [color, maxRadius, speed, disabled]);

  if (disabled) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-[99999] select-none"
      style={{ width: '100vw', height: '100vh' }}
    />
  );
}
