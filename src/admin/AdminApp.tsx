import { Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";
import AdminLayout from "./AdminLayout";
import Dashboard from "./Dashboard";
import ContentManager from "./ContentManager";
import EpisodesManager from "./EpisodesManager";
import CarouselManager from "./CarouselManager";
import UsersManager from "./UsersManager";
import SubscriptionsManager from "./SubscriptionsManager";
import WalletManager from "./WalletManager";
import TransactionsManager from "./TransactionsManager";
import ActivitiesManager from "./ActivitiesManager";
import Settings from "./Settings";
import { useAuth } from "../contexts/AuthContext";

const ADMIN_EMAILS = ["mainplatform.nexus@gmail.com"];

function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();

  const isAdmin = !!user && ADMIN_EMAILS.includes(user.email || "");

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate("/");
    }
  }, [isAdmin, loading, navigate]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#0d0d16", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}>Checking permissions...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div style={{ minHeight: "100vh", background: "#0d0d16", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12 }}>
        <div style={{ color: "#f87171", fontSize: 16, fontWeight: 600 }}>Access Denied</div>
        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>You must be an admin to access this area.</div>
      </div>
    );
  }

  return <>{children}</>;
}

export default function AdminApp() {
  return (
    <AdminGuard>
      <AdminLayout>
        <Switch>
          <Route path="/admin" component={Dashboard} />
          <Route path="/admin/content" component={ContentManager} />
          <Route path="/admin/content/:id/episodes" component={EpisodesManager} />
          <Route path="/admin/carousel" component={CarouselManager} />
          <Route path="/admin/users" component={UsersManager} />
          <Route path="/admin/subscriptions" component={SubscriptionsManager} />
          <Route path="/admin/wallet" component={WalletManager} />
          <Route path="/admin/transactions" component={TransactionsManager} />
          <Route path="/admin/activities" component={ActivitiesManager} />
          <Route path="/admin/settings" component={Settings} />
        </Switch>
      </AdminLayout>
    </AdminGuard>
  );
}
