// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import About from './pages/About';
import Events from './pages/Events';
import EventView from './pages/EventView';
import Gallery from './pages/Gallery';
import Contact from './pages/Contact';
import Posts from './pages/Posts';
import PostView from './pages/PostView';
import SubmitPost from './pages/SubmitPost';
import Login from './pages/Login';
import Register from './pages/Signup';
import People from './pages/People';
import AdminDashboard from './pages/admin/Dashboard';
import ManagePosts from './pages/admin/ManagePosts';
import PostEditor from './pages/admin/PostEditor';
import ManageEvents from './pages/admin/ManageEvents';
import AdminSettings from './pages/admin/Settings';
import ManageMembers from './pages/admin/ManageMembers';
import Messages from './pages/admin/Messages';
import ManageGallery from './pages/admin/ManageGallery';
import AsplPage from './pages/aspl/AsplPage';
import AsplAdmin from './pages/admin/aspl/AsplAdmin';
import AsplSlideshow from './pages/admin/aspl/AsplSlideshow';

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAdmin, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="inline-block w-8 h-8 border-4 border-[#2F5BEA] border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!isAdmin) return <Navigate to="/login" />;
  return <>{children}</>;
}

function FullAdminRoute({ children }: { children: React.ReactNode }) {
  const { isAdmin, isFullAdmin, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="inline-block w-8 h-8 border-4 border-[#2F5BEA] border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!isAdmin) return <Navigate to="/login" />;
  if (!isFullAdmin) return <Navigate to="/admin" />;
  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Full-screen admin slideshow — outside Layout so it has no nav/footer */}
          <Route path="/admin/aspl/slideshow" element={<AdminRoute><AsplSlideshow /></AdminRoute>} />

          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="about" element={<About />} />
            <Route path="events" element={<Events />} />
            <Route path="events/:slug" element={<EventView />} />
            <Route path="gallery" element={<Gallery />} />
            <Route path="contact" element={<Contact />} />
            <Route path="posts" element={<Posts />} />
            <Route path="posts/submit" element={<SubmitPost />} />
            <Route path="posts/:slug" element={<PostView />} />
            <Route path="people" element={<People />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="signup" element={<Navigate to="/register" replace />} />
            {/* Public ASPL page */}
            <Route path="aspl" element={<AsplPage />} />
            {/* Admin + Moderator */}
            <Route path="admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="admin/posts" element={<AdminRoute><ManagePosts /></AdminRoute>} />
            <Route path="admin/posts/new" element={<AdminRoute><PostEditor /></AdminRoute>} />
            <Route path="admin/posts/edit/:id" element={<AdminRoute><PostEditor /></AdminRoute>} />
            <Route path="admin/events" element={<AdminRoute><ManageEvents /></AdminRoute>} />
            <Route path="admin/members" element={<AdminRoute><ManageMembers /></AdminRoute>} />
            <Route path="admin/messages" element={<AdminRoute><Messages /></AdminRoute>} />
            <Route path="admin/gallery" element={<AdminRoute><ManageGallery /></AdminRoute>} />
            <Route path="admin/aspl" element={<AdminRoute><AsplAdmin /></AdminRoute>} />
            {/* Admin only */}
            <Route path="admin/settings" element={<FullAdminRoute><AdminSettings /></FullAdminRoute>} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;