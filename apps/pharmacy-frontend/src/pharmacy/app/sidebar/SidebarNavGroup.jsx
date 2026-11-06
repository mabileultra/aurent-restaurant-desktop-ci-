import SidebarGroupCompact from './SidebarGroupCompact';
import SidebarGroupExpanded from './SidebarGroupExpanded';

export default function SidebarNavGroup({
  show, labels, t, label, icon, open, setOpen, active, items, subLinkClass,
}) {
  if (!show) return null;
  if (!labels) return <SidebarGroupCompact t={t} items={items} />;
  return (
    <SidebarGroupExpanded
      t={t}
      label={label}
      icon={icon}
      isOpen={open}
      onToggle={() => setOpen((o) => !o)}
      isActive={active}
      items={items}
      subLinkClass={subLinkClass}
    />
  );
}
