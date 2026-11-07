import React from 'react';

const COLOR_CLASSES = [
  'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
  'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300',
  'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300',
  'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-300',
];

export function resolveAvatarInitials(name = '') {
  const cleanName = String(name || '').trim();
  const words = cleanName
    .split(/\s+/)
    .map((w) => w.replace(/[^\p{L}\p{N}]/gu, ''))
    .filter(Boolean);

  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }
  const fallback = cleanName.replace(/[^\p{L}\p{N}]/gu, '');
  return (fallback.slice(0, 2) || 'U').toUpperCase();
}

export default function AccessRightsAvatar({ name = '', size = 'md', className = '' }) {
  const cleanName = String(name || '').trim();
  const initials = resolveAvatarInitials(cleanName);

  let hash = 0;
  for (let i = 0; i < cleanName.length; i += 1) {
    hash = (hash + cleanName.charCodeAt(i)) % COLOR_CLASSES.length;
  }
  const colorClass = COLOR_CLASSES[hash] || COLOR_CLASSES[0];

  const sizeClasses = {
    sm: 'w-7 h-7 text-[11px]',
    md: 'w-9 h-9 text-xs',
    lg: 'w-11 h-11 text-sm',
  }[size] || 'w-9 h-9 text-xs';

  return (
    <div
      className={`inline-flex items-center justify-center rounded-xl font-bold shrink-0 select-none ${sizeClasses} ${colorClass} ${className}`}
    >
      {initials}
    </div>
  );
}
