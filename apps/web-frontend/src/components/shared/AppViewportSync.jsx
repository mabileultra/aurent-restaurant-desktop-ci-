import { useAppViewportProfile } from '../../hooks/useAppViewportProfile';

/** Синхронизирует классы viewport на <html> для CSS-токенов всех оболочек. */
export default function AppViewportSync() {
  useAppViewportProfile();
  return null;
}
