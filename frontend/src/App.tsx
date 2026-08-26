import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import ScrollToTop from './components/ScrollToTop';

// Home is the entry point for nearly every visit, so it stays in the main
// bundle. Everything else is split per route — the single 663 kB bundle made
// first paint wait on the admin panel and ASPL code no visitor ever opens.
import Home from './pages/Home';

// Public pages
const People = lazy(() => import('./pages/People'));
const Events = lazy(() => import('./pages/Events'));
const EventView = lazy(() => import('./pages/EventView'));
const Posts = lazy(() => import('./pages/Posts'));
const PostView = lazy(() => import('./pages/PostView'));
const Gallery = lazy(() => import('./pages/Gallery'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const SetPassword = lazy(() => import('./pages/SetPassword'));
const MemberAccount = lazy(() => import('./pages/MemberAccount'));
const ChangePassword = lazy(() => import('./pages/ChangePassword'));
const UpdateProfile = lazy(() => import('./pages/UpdateProfile'));
const SubmitPost = lazy(() => import('./pages/SubmitPost'));
const NotFound = lazy(() => import('./pages/NotFound'));

// ASPL pages
const AsplPage = lazy(() => import('./pages/aspl/AsplPage'));
const PlayersPage = lazy(() => import('./pages/aspl/PlayersPage'));

// Admin pages
const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
const ManageMembers = lazy(() => import('./pages/admin/ManageMembers'));
const ManagePosts = lazy(() => import('./pages/admin/ManagePosts'));
const ManageEvents = lazy(() => import('./pages/admin/ManageEvents'));
const ManageGallery = lazy(() => import('./pages/admin/ManageGallery'));
const Communications = lazy(() => import('./pages/admin/Communications'));
const PostEditor = lazy(() => import('./pages/admin/PostEditor'));
const Settings = lazy(() => import('./pages/admin/Settings'));
const ManageAdmins = lazy(() => import('./pages/admin/ManageAdmins'));
const AsplAdmin = lazy(() => import('./pages/admin/aspl/AsplAdmin'));
const AsplSlideshow = lazy(() => import('./pages/admin/aspl/AsplSlideshow'));
const SeasonDetail = lazy(() => import('./pages/admin/aspl/SeasonDetail'));
const BidManager = lazy(() => import('./pages/admin/aspl/BidManager'));

function RouteSpinner() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-[#F5F7FA]">
      <div className="w-8 h-8 border-4 border-[#2F5BEA] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAdmin, loading } = useAuth();
  const location = useLocation();

  // Never redirect while auth is still resolving — the URL the user asked for
  // would be replaced by /login before we know whether they are an admin.
  if (loading) return <RouteSpinner />;

  // Carry the attempted URL so Login can send them back after signing in.
  return isAdmin
    ? <>{children}</>
    : <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
}

function AppRoutes() {
  return (
    <Suspense fallback={<RouteSpinner />}>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="people" element={<People />} />
          <Route path="events" element={<Events />} />
          <Route path="events/:id" element={<EventView />} />
          <Route path="posts" element={<Posts />} />
          <Route path="posts/:id" element={<PostView />} />
          <Route path="gallery" element={<Gallery />} />
          <Route path="about" element={<About />} />
          <Route path="contact" element={<Contact />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Signup />} />
          <Route path="signup" element={<Signup />} />
          <Route path="set-password" element={<SetPassword />} />
          <Route path="account" element={<MemberAccount />} />
          <Route path="change-password" element={<ChangePassword />} />
          <Route path="update-profile" element={<UpdateProfile />} />
          <Route path="posts/submit" element={<SubmitPost />} />
          <Route path="aspl" element={<AsplPage />} />
          <Route path="aspl/players" element={<PlayersPage />} />
        </Route>

        {/* Admin */}
        <Route path="/admin" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="members" element={<ManageMembers />} />
          <Route path="posts" element={<ManagePosts />} />
          <Route path="posts/new" element={<PostEditor />} />
          <Route path="posts/:id/edit" element={<PostEditor />} />
          <Route path="events" element={<ManageEvents />} />
          <Route path="gallery" element={<ManageGallery />} />

          <Route path="communications" element={<Communications />} />
          <Route path="settings" element={<Settings />} />
          <Route path="accounts" element={<ManageAdmins />} />
          <Route path="aspl" element={<AsplAdmin />} />

          <Route path="aspl/bids" element={<BidManager />} />
          <Route path="aspl/seasons/:id" element={<SeasonDetail />} />
          <Route path="aspl/seasons/:seasonId/bid/:teamId" element={<BidManager />} />
        </Route>

        {/* ASPL Slideshow — no navbar/footer */}
        <Route path="/admin/aspl/slideshow" element={<ProtectedRoute><AsplSlideshow /></ProtectedRoute>} />

        {/* Fallback — show a 404 inside the shell rather than silently
            bouncing to "/", which hid broken links and mistyped URLs. */}
        <Route path="*" element={<Layout />}>
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ScrollToTop />
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
