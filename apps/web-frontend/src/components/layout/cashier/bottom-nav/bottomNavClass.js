export function bottomNavLinkClass(isActive, { primary = false } = {}) {
  return `cashier-bottom-nav__btn${primary ? ' cashier-bottom-nav__btn--primary' : ''}${isActive ? ' is-active' : ''}`;
}
