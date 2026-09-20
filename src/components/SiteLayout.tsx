import { ReactNode } from 'react';
import Header from '@/components/Header';
import LiveTicker from '@/components/LiveTicker';
import Footer from '@/components/Footer';

const SiteLayout = ({ children }: { children: ReactNode }) => (
  <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
    <div className="px-4 pb-5 pt-3.5 sm:px-[18px]">
      <Header />
      <LiveTicker />

      <div className="mt-10 sm:mt-12">{children}</div>

      <Footer />
    </div>
  </div>
);

export default SiteLayout;
