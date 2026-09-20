import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import LiveTicker from '@/components/LiveTicker';
import CategorySidebar from '@/components/CategorySidebar';
import CaseGrid from '@/components/CaseGrid';
import OpenCaseDialog from '@/components/OpenCaseDialog';
import Footer from '@/components/Footer';
import { CaseItem, CategoryId } from '@/data/nicedrop';

const Index = () => {
  const [category, setCategory] = useState<CategoryId>('all');
  const [openCase, setOpenCase] = useState<CaseItem | null>(null);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <div className="px-4 pb-5 pt-3.5 sm:px-[18px]">
        <section id="cases" className="hero-shell scroll-mt-4">
          <div className="hero-nav">
            <Header />
            <LiveTicker />
          </div>

          <div className="hero-side min-h-0">
            <CategorySidebar
              active={category}
              onChange={setCategory}
              onPromo={() => navigate('/bonuses')}
            />
          </div>

          <div className="hero-grid min-h-0">
            <CaseGrid category={category} onOpen={setOpenCase} />
          </div>
        </section>

        <Footer />
      </div>

      <OpenCaseDialog item={openCase} onClose={() => setOpenCase(null)} />
    </div>
  );
};

export default Index;
