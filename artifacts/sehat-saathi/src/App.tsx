import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { MobileLayout } from "@/components/layout/mobile-layout";

// Pages
import LanguageSelect from "@/pages/language-select";
import Login from "@/pages/login";
import Home from "@/pages/home";
import Scan from "@/pages/scan";
import Reminders from "@/pages/reminders";
import Profile from "@/pages/profile";
import Sos from "@/pages/sos";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/">
        <LanguageSelect />
      </Route>
      <Route path="/login">
        <Login />
      </Route>
      <Route path="/home">
        <MobileLayout>
          <Home />
        </MobileLayout>
      </Route>
      <Route path="/scan">
        <MobileLayout>
          <Scan />
        </MobileLayout>
      </Route>
      <Route path="/reminders">
        <MobileLayout>
          <Reminders />
        </MobileLayout>
      </Route>
      <Route path="/profile">
        <MobileLayout>
          <Profile />
        </MobileLayout>
      </Route>
      <Route path="/sos">
        <Sos />
      </Route>
      <Route>
        <MobileLayout showBottomNav={false}>
          <NotFound />
        </MobileLayout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
