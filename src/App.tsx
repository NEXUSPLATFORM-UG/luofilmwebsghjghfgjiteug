import { Switch, Route, useLocation } from "wouter";
import { AuthProvider } from "./contexts/AuthContext";
import Header from "./components/Header";
import Footer from "./components/Footer";
import MobileBottomNav from "./components/MobileBottomNav";
import HomePage from "./pages/HomePage";
import PlayPage from "./pages/PlayPage";
import CategoryPage from "./pages/CategoryPage";
import SearchPage from "./pages/SearchPage";
import ProfilePage from "./pages/ProfilePage";
import HistoryPage from "./pages/HistoryPage";
import WatchlistPage from "./pages/WatchlistPage";
import DownloadsPage from "./pages/DownloadsPage";
import TermsPage from "./pages/TermsPage";
import PrivacyPage from "./pages/PrivacyPage";
import CookiesPage from "./pages/CookiesPage";
import DmcaPage from "./pages/DmcaPage";
import GuidelinesPage from "./pages/GuidelinesPage";
import ContactPage from "./pages/ContactPage";
import AdminApp from "./admin/AdminApp";
import OpenInAppBanner from "./components/OpenInAppBanner";

function MainSite() {
  const [location] = useLocation();
  const hideFooter = location.startsWith("/play/");

  return (
    <div className="min-h-screen bg-[#0a0a0a] mobile-pb">
      <Header />
      <OpenInAppBanner />
      <MobileBottomNav />
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/search" component={SearchPage} />
        <Route path="/profile" component={ProfilePage} />
        <Route path="/history" component={HistoryPage} />
        <Route path="/watchlist" component={WatchlistPage} />
        <Route path="/downloads" component={DownloadsPage} />
        <Route path="/play/:id" component={PlayPage} />
        <Route path="/terms" component={TermsPage} />
        <Route path="/privacy" component={PrivacyPage} />
        <Route path="/cookies" component={CookiesPage} />
        <Route path="/dmca" component={DmcaPage} />
        <Route path="/guidelines" component={GuidelinesPage} />
        <Route path="/contact" component={ContactPage} />
        <Route path="/drama">
          <CategoryPage
            genre="drama"
            title="DRAMA"
            description="Love stories, modern tales, and emotional journeys — the best drama series curated for you."
          />
        </Route>
        <Route path="/movie">
          <CategoryPage
            genre="movie"
            title="MOVIE"
            description="Action-packed adventures, thrilling mysteries, and epic historical tales on the big screen."
          />
        </Route>
        <Route path="/variety">
          <CategoryPage
            genre="variety"
            title="VARIETY"
            description="Laugh, be entertained, and discover your next favourite variety show."
          />
        </Route>
        <Route path="/sports">
          <CategoryPage
            genre="sports"
            title="SPORTS"
            description="High-intensity action and martial arts — for those who love the thrill of competition."
          />
        </Route>
        <Route path="/documentary">
          <CategoryPage
            genre="documentary"
            title="DOCUMENTARY"
            description="Explore real stories, history, and the mysteries of our world in stunning detail."
          />
        </Route>
        <Route path="/anime">
          <CategoryPage
            genre="anime"
            title="ANIME"
            description="Fantasy worlds, epic journeys, and unforgettable characters in animated form."
          />
        </Route>
        <Route>
          <div className="flex items-center justify-center min-h-screen text-gray-500">
            <div className="text-center">
              <p className="text-6xl mb-4">404</p>
              <p className="text-lg">Page not found</p>
            </div>
          </div>
        </Route>
      </Switch>
      {!hideFooter && <Footer />}
    </div>
  );
}

function App() {
  const [location] = useLocation();
  const isAdmin = location.startsWith("/admin");

  return (
    <AuthProvider>
      {isAdmin ? <AdminApp /> : <MainSite />}
    </AuthProvider>
  );
}

export default App;
