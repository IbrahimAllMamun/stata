import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';

// Public pages
import Home from './pages/Home';
import People from './pages/People';
import Events from './pages/Events';
import EventView from './pages/EventView';
import Posts from './pages/Posts';
import PostView from './pages/PostView';
import Gallery from './pages/Gallery';
import About from './pages/About';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Signup from './pages/Signup';
import UpdateProfile from './pages/UpdateProfile';
import SubmitPost from './pages/SubmitPost';

// ASPL pages
import AsplPage from './pages/aspl/AsplPage';
import PlayersPage from './pages/aspl/PlayersPage';

// Admin pages
import Dashboard from './pages/admin/Dashboard';
import ManageMembers from './pages/admin/ManageMembers';
import ManagePosts from './pages/admin/ManagePosts';
import ManageEvents from './pages/admin/ManageEvents';
import ManageGallery from './pages/admin/ManageGallery';
import Communications from './pages/admin/Communications';
import PostEditor from './pages/admin/PostEditor';
import Settings from './pages/admin/Settings';
import ManageAdmins from './pages/admin/ManageAdmins';
import AsplAdmin from './pages/admin/aspl/AsplAdmin';
import AsplSlideshow from './pages/admin/aspl/AsplSlideshow';
import SeasonDetail from './pages/admin/aspl/SeasonDetail';
import BidManager from './pages/admin/aspl/BidManager';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAdmin, loading } = useAuth();
  if (loading) return null;
  return isAdmin ? <>{children}</> : <Navigate to="/login" replace />;
}

function AppRoutes() {
  return (
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

        <Route path="aspl/seasons/:id" element={<SeasonDetail />} />
        <Route path="aspl/seasons/:seasonId/bid/:teamId" element={<BidManager />} />
      </Route>

      {/* ASPL Slideshow — no navbar/footer */}
      <Route path="/admin/aspl/slideshow" element={<ProtectedRoute><AsplSlideshow /></ProtectedRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}