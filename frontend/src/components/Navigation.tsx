// src/components/Navigation.tsx
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, LogOut, LayoutDashboard, Settings, UserCheck } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { adminApi } from '../lib/api';
import Logo from './Logo';

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const location = useLocation();
  const { isAdmin, isFullAdmin, isModerator, logout, admin } = useAuth();

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'People', href: '/people' },
    { name: 'Events', href: '/events' },
    { name: 'Posts', href: '/posts' },
    { name: 'Gallery', href: '/gallery' },
    { name: 'About', href: '/about' },
    { name: 'Contact', href: '/contact' },
  ];

  // Poll pending count every 60s when logged in
  useEffect(() => {
    if (!isAdmin) return;
    const fetch = () => {
      adminApi.getPendingCount()
        .then(res => setPendingCount(res.data.count))
        .catch(() => { });
    };
    fetch();
    const interval = setInterval(fetch, 60000);
    return () => clearInterval(interval);
  }, [isAdmin]);

  // Refresh when navigating away from /admin/members
  useEffect(() => {
    if (isAdmin && !location.pathname.startsWith('/admin/members')) {
      adminApi.getPendingCount()
        .then(res => setPendingCount(res.data.count))
        .catch(() => { });
    }
  }, [location.pathname, isAdmin]);

  const isActive = (href: string) =>
    href === '/' ? location.pathname === '/' : location.pathname.startsWith(href);

  return (
    <nav className="bg-[#1F2A44] text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center flex-shrink-0">
            <Logo size={36} scheme="light" />
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(item => (
              <Link key={item.name} to={item.href}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${isActive(item.href)
                    ? 'text-[#F39C12] bg-white/10'
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                  }`}>
                {item.name}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            {isAdmin ? (
              <>
                <div className="relative group">
                  {/* Admin button with badge */}
                  <button className="relative flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-[#F39C12] rounded-md hover:bg-white/10 transition-colors">
                    <LayoutDashboard className="w-4 h-4" />
                    Admin
                    {pendingCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {pendingCount > 9 ? '9+' : pendingCount}
                      </span>
                    )}
                  </button>

                  {/* Dropdown */}
                  <div className="absolute right-0 mt-1 w-56 bg-white text-gray-800 rounded-xl shadow-xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none group-hover:pointer-events-auto z-50 border border-gray-100">
                    <Link to="/admin" className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50 rounded-t-xl">
                      <LayoutDashboard className="w-4 h-4 text-[#2F5BEA]" /> Dashboard
                    </Link>
                    <Link to="/admin/members" className="flex items-center justify-between px-4 py-2.5 text-sm hover:bg-gray-50">
                      <span className="flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-amber-500" /> Member Approvals
                      </span>
                      {pendingCount > 0 && (
                        <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                          {pendingCount > 99 ? '99+' : pendingCount}
                        </span>
                      )}
                    </Link>
                    <Link to="/admin/posts" className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50">
                      <span className="w-4 h-4 text-[#F39C12]">✏️</span> Manage Posts
                    </Link>
                    <Link to="/admin/events" className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50">
                      <span className="w-4 h-4">📅</span> Manage Events
                    </Link>
                    {isFullAdmin && (
                      <Link to="/admin/settings" className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50 rounded-b-xl border-t border-gray-100">
                        <Settings className="w-4 h-4 text-[#9B59B6]" /> Committee Settings
                      </Link>
                    )}
                  </div>
                </div>

                <span className="text-xs text-gray-400 border-l border-gray-600 pl-3 flex items-center gap-1.5">
                  {admin?.username}
                  {isModerator && (
                    <span className="bg-blue-500/20 text-blue-300 text-xs px-1.5 py-0.5 rounded">mod</span>
                  )}
                </span>
                <button onClick={logout} className="flex items-center gap-1 text-sm text-gray-300 hover:text-red-400 transition-colors">
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <Link to="/register" className="bg-[#2F5BEA] hover:bg-[#F39C12] text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile toggle — with badge */}
          <button onClick={() => setIsOpen(!isOpen)} className="md:hidden relative text-white hover:text-[#F39C12] transition-colors">
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            {isAdmin && pendingCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {pendingCount > 9 ? '9+' : pendingCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-[#1F2A44] border-t border-gray-700">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navLinks.map(item => (
              <Link key={item.name} to={item.href} onClick={() => setIsOpen(false)}
                className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive(item.href) ? 'text-[#F39C12] bg-gray-800' : 'text-gray-300 hover:text-white hover:bg-gray-800'
                  }`}>
                {item.name}
              </Link>
            ))}
            <div className="border-t border-gray-700 pt-2 mt-2">
              {isAdmin ? (
                <>
                  <Link to="/admin" onClick={() => setIsOpen(false)}
                    className="block px-3 py-2 rounded-md text-sm font-medium text-[#F39C12] hover:bg-gray-800">
                    Dashboard
                  </Link>
                  <Link to="/admin/members" onClick={() => setIsOpen(false)}
                    className="flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium text-amber-400 hover:bg-gray-800">
                    Member Approvals
                    {pendingCount > 0 && (
                      <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                        {pendingCount}
                      </span>
                    )}
                  </Link>
                  {isFullAdmin && (
                    <Link to="/admin/settings" onClick={() => setIsOpen(false)}
                      className="block px-3 py-2 rounded-md text-sm font-medium text-purple-300 hover:bg-gray-800">
                      Committee Settings
                    </Link>
                  )}
                  <button onClick={() => { logout(); setIsOpen(false); }}
                    className="w-full text-left px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:text-red-400 hover:bg-gray-800">
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/register" onClick={() => setIsOpen(false)}
                    className="block px-3 py-2 rounded-md text-sm text-white bg-[#2F5BEA] hover:bg-[#F39C12] mt-1 text-center font-semibold">
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}