import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { BalanceProvider } from '@/hooks/use-balance';
import ScrollToTop from '@/components/ScrollToTop';
import Index from './pages/Index';
import TopPage from './pages/TopPage';
import TopUpPage from './pages/TopUpPage';
import BonusesPage from './pages/BonusesPage';
import SupportPage from './pages/SupportPage';
import NotFound from './pages/NotFound';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BalanceProvider>
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/top" element={<TopPage />} />
            <Route path="/topup" element={<TopUpPage />} />
            <Route path="/bonuses" element={<BonusesPage />} />
            <Route path="/support" element={<SupportPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </BalanceProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
