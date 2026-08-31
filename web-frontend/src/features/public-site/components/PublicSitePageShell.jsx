import PublicSiteHeader from '../components/PublicSiteHeader';
import PublicSiteFooter from '../components/PublicSiteFooter';
import '../../../styles/public-site/public-site-shell.css';
import '../../../styles/public-site/public-static-page.css';

export default function PublicSitePageShell({ children, showLoginCta = true }) {
  return (
    <div className="public-site">
      <PublicSiteHeader showLoginCta={showLoginCta} />
      <main className="public-site__main public-static-page">
        {children}
      </main>
      <PublicSiteFooter />
    </div>
  );
}
