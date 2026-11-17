import React from 'react';
import SidebarGroupCompact from './SidebarGroupCompact';
import SidebarGroupExpanded from './SidebarGroupExpanded';

export default function SidebarNavSection({
  show,
  navLabelsVisible,
  label,
  icon,
  isOpen,
  onToggle,
  isActive,
  items,
  subLinkClass,
  t,
}) {
  if (!show) return null;

  if (navLabelsVisible) {
    return (
      <SidebarGroupExpanded
        t={t}
        label={label}
        icon={icon}
        isOpen={isOpen}
        onToggle={onToggle}
        isActive={isActive}
        items={items}
        subLinkClass={subLinkClass}
      />
    );
  }

  return <SidebarGroupCompact t={t} items={items} />;
}
