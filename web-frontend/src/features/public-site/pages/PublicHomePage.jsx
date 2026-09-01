import PublicSitePageShell from '../components/PublicSitePageShell';
import PublicHeroSection from '../components/hero/PublicHeroSection';
import PublicAudienceSection from '../components/audience/PublicAudienceSection';
import PublicTerminalSection from '../components/features/PublicTerminalSection';
import PublicIncludedBand from '../components/pricing/PublicIncludedBand';
import PublicDownloadStrip from '../components/layout/PublicDownloadStrip';

export default function PublicHomePage() {
  return (
    <PublicSitePageShell>
      <PublicHeroSection />
      <PublicAudienceSection />
      <PublicTerminalSection />
      <PublicIncludedBand />
      <PublicDownloadStrip />
    </PublicSitePageShell>
  );
}
