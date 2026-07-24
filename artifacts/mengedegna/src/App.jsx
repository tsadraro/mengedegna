import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { LanguageProvider } from '@/lib/LanguageContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import RouteWatcher from '@/components/RouteWatcher';
import Home from '@/pages/Home';
import RoutesPage from '@/pages/RoutesPage';
import Booking from '@/pages/Booking';
import Ticket from '@/pages/Ticket';
import OperatorDashboard from '@/pages/OperatorDashboard';
import FAQ from '@/pages/FAQ';
import OperatorsPage from '@/pages/OperatorsPage';
import OperatorProfile from '@/pages/OperatorProfile';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/routes" element={<RoutesPage />} />
      <Route path="/booking" element={<Booking />} />
      <Route path="/ticket" element={<Ticket />} />
      <Route path="/operator" element={<OperatorDashboard />} />
      <Route path="/faq" element={<FAQ />} />
      <Route path="/operators" element={<OperatorsPage />} />
      <Route path="/operators/:slug" element={<OperatorProfile />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function RouteWatcherWrapper() {
  const { user } = useAuth();
  return <RouteWatcher user={user} />;
}

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <ScrollToTop />
            <AuthenticatedApp />
            <RouteWatcherWrapper />
          </Router>
          <Toaster />
        </QueryClientProvider>
      </AuthProvider>
    </LanguageProvider>
  )
}

export default App
