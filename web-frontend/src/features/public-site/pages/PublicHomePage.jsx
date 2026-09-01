import PublicSitePageShell from '../components/PublicSitePageShell';
import PublicHeroSection from '../components/hero/PublicHeroSection';
import PublicAudienceSection from '../components/audience/PublicAudienceSection';
import PublicTerminalSection from '../components/features/PublicTerminalSection';
import PublicFeatureBlock from '../components/features/PublicFeatureBlock';
import PublicControlPanelSection from '../components/dashboard/PublicControlPanelSection';
import PublicGrowthCtaSection from '../components/cta/PublicGrowthCtaSection';
import PublicIncludedBand from '../components/pricing/PublicIncludedBand';
import PublicPricingSection from '../components/pricing/PublicPricingSection';
import PublicEquipmentSection from '../components/equipment/PublicEquipmentSection';
import PublicAboutSection from '../components/about/PublicAboutSection';
import PublicContactsSection from '../components/contacts/PublicContactsSection';
import { PUBLIC_FEATURE_BLOCKS } from '../constants/publicSiteFeatures';

export default function PublicHomePage() {
  return (
    <PublicSitePageShell>
      <PublicHeroSection />
      <PublicAudienceSection />
      <PublicTerminalSection />
      {PUBLIC_FEATURE_BLOCKS.map((block) => (
        <PublicFeatureBlock key={block.id} {...block} />
      ))}
      <PublicControlPanelSection />
      <PublicGrowthCtaSection />
      <PublicIncludedBand />
      <PublicPricingSection />
      <PublicEquipmentSection />
      <PublicAboutSection />
      <PublicContactsSection />
    </PublicSitePageShell>
  );
}
