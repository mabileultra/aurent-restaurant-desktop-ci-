import { resolveAppHomePath } from './appHomePath';

/** Домашний маршрут после входа / при отказе в доступе (без типа бизнеса — платформа). */
export function resolveRoleHomePath(role) {
  return resolveAppHomePath(role, null);
}
