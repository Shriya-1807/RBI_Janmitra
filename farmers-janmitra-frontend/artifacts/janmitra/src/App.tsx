import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { UserPreferencesProvider } from "@/lib/store";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Chatbot from "@/pages/Chatbot";
import Settings from "@/pages/Settings";
import AppLayout from "@/components/layout/AppLayout";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/">
        <AppLayout><Home /></AppLayout>
      </Route>
      <Route path="/chatbot">
        <AppLayout><Chatbot /></AppLayout>
      </Route>
      <Route path="/settings">
        <AppLayout><Settings /></AppLayout>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <UserPreferencesProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </UserPreferencesProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
