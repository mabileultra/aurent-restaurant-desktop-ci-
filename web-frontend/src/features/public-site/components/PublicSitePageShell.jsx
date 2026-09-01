import PublicSiteHeader from '../components/PublicSiteHeader';
import PublicSiteFooter from '../components/PublicSiteFooter';
import PublicFloatingChat from '../components/layout/PublicFloatingChat';
import '../../../styles/public-site/public-site-shell.css';

export default function PublicSitePageShell({ children, showLoginCta = true, showChat = true }) {
  return (
    <div className="public-site">
      <PublicSiteHeader showLoginCta={showLoginCta} />
      <main className="public-site__main public-static-page">
        {children}
      </main>
      <PublicSiteFooter />
      {showChat ? <PublicFloatingChat /> : null}
    </div>
  );
}
