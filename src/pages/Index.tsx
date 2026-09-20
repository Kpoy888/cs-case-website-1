import { useRef, useState } from 'react';
import Header from '@/components/Header';
import LiveTicker from '@/components/LiveTicker';
import CategorySidebar from '@/components/CategorySidebar';
import CaseGrid from '@/components/CaseGrid';
import OpenCaseDialog from '@/components/OpenCaseDialog';
import RecentDrops from '@/components/RecentDrops';
import TopPlayers from '@/components/TopPlayers';
import TopUp from '@/components/TopUp';
import Bonuses, { BonusesHandle } from '@/components/Bonuses';
import FaqSupport from '@/components/FaqSupport';
import Footer from '@/components/Footer';
import { BalanceProvider } from '@/hooks/use-balance';
import { CaseItem, CategoryId } from '@/data/nicedrop';

const IndexContent = () => {
  const [category, setCategory] = useState<CategoryId>('all');
  const [openCase, setOpenCase] = useState<CaseItem | null>(null);
  const bonusesRef = useRef<BonusesHandle>(null);

  const goPromo = () => {
    document.getElementById('bonuses')?.scrollIntoView({ behavior: 'smooth' });
    setTimeout(() => bonusesRef.current?.focusInput('NICE15'), 500);
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <div className="px-4 pb-5 pt-3.5 sm:px-[18px]">
        {/* Первый экран: nav / side + grid — сетка выбранного варианта */}
        <section
          id="cases"
          className="hero-shell scroll-mt-4"
        >
          <div className="hero-nav">
            <Header />
            <LiveTicker />
          </div>

          <div className="hero-side min-h-0">
            <CategorySidebar active={category} onChange={setCategory} onPromo={goPromo} />
          </div>

          <div className="hero-grid min-h-0">
            <CaseGrid category={category} onOpen={setOpenCase} />
          </div>
        </section>

        <div className="mt-16 flex flex-col gap-16 sm:mt-20 sm:gap-20">
          <RecentDrops />
          <TopPlayers />
          <TopUp />
          <Bonuses ref={bonusesRef} />
          <FaqSupport />
        </div>

        <Footer />
      </div>

      <OpenCaseDialog item={openCase} onClose={() => setOpenCase(null)} />
    </div>
  );
};

const Index = () => (
  <BalanceProvider>
    <IndexContent />
  </BalanceProvider>
);

export default Index;