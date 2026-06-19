import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@/lib/api-setup";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { useApplyBranding } from "@/hooks/use-branding";
import { AppLayout } from "@/components/layout/AppLayout";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Employees from "@/pages/employees";
import Attendance from "@/pages/attendance";
import Leaves from "@/pages/leaves";
import Payroll from "@/pages/payroll";
import Timesheets from "@/pages/timesheets";
import Performance from "@/pages/performance";
import Documents from "@/pages/documents";
import Holidays from "@/pages/holidays";
import Announcements from "@/pages/announcements";
import Policies from "@/pages/policies";
import BrandingSettings from "@/pages/settings/branding";
import BiometricsSettings from "@/pages/settings/biometrics";

const queryClient = new QueryClient();

function BrandingWrapper({ children }: { children: React.ReactNode }) {
  useApplyBranding();
  return <>{children}</>;
}

const ProtectedRoute = ({ component: Component }: { component: any }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  if (!isAuthenticated) return <Redirect to="/login" />;

  return (
    <AppLayout>
      <Component />
    </AppLayout>
  );
};

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />

      <Route path="/" component={() => <Redirect to="/dashboard" />} />
      <Route
        path="/dashboard"
        component={() => <ProtectedRoute component={Dashboard} />}
      />
      <Route
        path="/employees"
        component={() => <ProtectedRoute component={Employees} />}
      />
      <Route
        path="/attendance"
        component={() => <ProtectedRoute component={Attendance} />}
      />
      <Route
        path="/leaves"
        component={() => <ProtectedRoute component={Leaves} />}
      />
      <Route
        path="/payroll"
        component={() => <ProtectedRoute component={Payroll} />}
      />
      <Route
        path="/timesheets"
        component={() => <ProtectedRoute component={Timesheets} />}
      />
      <Route
        path="/performance"
        component={() => <ProtectedRoute component={Performance} />}
      />
      <Route
        path="/documents"
        component={() => <ProtectedRoute component={Documents} />}
      />
      <Route
        path="/holidays"
        component={() => <ProtectedRoute component={Holidays} />}
      />
      <Route
        path="/announcements"
        component={() => <ProtectedRoute component={Announcements} />}
      />
      <Route
        path="/policies"
        component={() => <ProtectedRoute component={Policies} />}
      />
      <Route
        path="/settings/branding"
        component={() => <ProtectedRoute component={BrandingSettings} />}
      />
      <Route
        path="/settings/biometrics"
        component={() => <ProtectedRoute component={BiometricsSettings} />}
      />

      <Route path="*">
        {() => (
          <div className="min-h-screen flex flex-col items-center justify-center text-center p-4">
            <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
            <p className="text-xl text-muted-foreground mb-8">Page not found</p>
            <a
              href="/"
              className="px-6 py-3 bg-primary text-primary-foreground rounded-xl"
            >
              Go Home
            </a>
          </div>
        )}
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrandingWrapper>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
        </BrandingWrapper>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
