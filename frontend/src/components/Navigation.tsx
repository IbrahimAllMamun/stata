// src/components/Navigation.tsx
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, LogOut, LayoutDashboard, Settings, UserCheck, FileText, Calendar, MessageSquare, PenLine, Trophy } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { adminApi, asplApi } from '../lib/api';
import LogoLoaderFull from './LogoLoaderFull';

function Badge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
      {count > 99 ? '99+' : count}
    </span>
  );
}

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [pendingMembers, setPendingMembers] = useState(0);
  const [pendingPosts, setPendingPosts] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [pendingAspl, setPendingAspl] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [logoKey, setLogoKey] = useState(0);
  const [asplVisible, setAsplVisible] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
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

  const totalBadge = pendingMembers + pendingPosts + unreadMessages + pendingAspl;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setAsplVisible(asplApi.getSettings().visible);
  }, [location.pathname]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => { setIsOpen(false); setDropdownOpen(false); }, [location.pathname]);

  // Fetch all counts, refresh on route change + every 60s
  useEffect(() => {
    if (!isAdmin) return;

    const fetchAll = () => {
      if (!location.pathname.startsWith('/admin/members'))
        adminApi.getPendingCount().then(r => setPendingMembers(r.data.count)).catch(() => { });
      if (!location.pathname.startsWith('/admin/posts'))
        adminApi.getPendingPostCount().then(r => setPendingPosts(r.data.count)).catch(() => { });
      if (!location.pathname.startsWith('/admin/messages'))
        adminApi.getUnreadMessageCount().then(r => setUnreadMessages(r.data.count)).catch(() => { });
      if (!location.pathname.startsWith('/admin/aspl'))
        asplApi.getPendingRegistrationCount().then(r => setPendingAspl(r.data.count)).catch(() => { });
    };

    fetchAll();
    const t = setInterval(fetchAll, 60000);
    return () => clearInterval(t);
  }, [isAdmin, location.pathname]);

  // Clear badge when visiting that section
  useEffect(() => {
    if (location.pathname.startsWith('/admin/members')) setPendingMembers(0);
    if (location.pathname.startsWith('/admin/posts')) setPendingPosts(0);
    if (location.pathname.startsWith('/admin/messages')) setUnreadMessages(0);
    if (location.pathname.startsWith('/admin/aspl')) setPendingAspl(0);
  }, [location.pathname]);

  const isActive = (href: string) =>
    href === '/' ? location.pathname === '/' : location.pathname.startsWith(href);

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-300 ${scrolled
      ? 'bg-[#1F2A44]/95 backdrop-blur shadow-lg shadow-black/20'
      : 'bg-[#1F2A44]'
      }`}>
      <div className="h-0.5 bg-gradient-to-r from-[#2F5BEA] via-[#F39C12] to-[#2ECC71]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`flex justify-between items-center transition-all duration-300 ${scrolled ? 'h-14' : 'h-16'}`}>

          {/* Logo */}
          <Link to="/" className="flex items-center flex-shrink-0"
            onMouseEnter={() => setLogoKey(k => k + 1)}>
            <LogoLoaderFull key={logoKey} size={scrolled ? 30 : 34} scheme="dark" hoverOnly={logoKey > 0} />
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-0.5">
            {navLinks.map(item => (
              <Link key={item.name} to={item.href}
                className={`relative px-3.5 py-2 text-sm font-medium rounded-lg transition-all duration-150 group ${isActive(item.href)
                  ? 'text-white'
                  : 'text-gray-400 hover:text-white'
                  }`}>
                {item.name}
                <span className={`absolute bottom-1 left-1/2 -translate-x-1/2 h-0.5 rounded-full bg-[#F39C12] transition-all duration-200 ${isActive(item.href) ? 'w-4/5' : 'w-0 group-hover:w-1/2 group-hover:bg-white/30'
                  }`} />
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-2">
            {isAdmin ? (
              <div ref={dropdownRef} className="relative">
                <button
                  onClick={() => setDropdownOpen(v => !v)}
                  className={`relative flex items-center gap-2 pl-3 pr-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all ${dropdownOpen
                    ? 'bg-white/15 text-white'
                    : 'text-[#F39C12] hover:bg-white/10'
                    }`}>
                  <LayoutDashboard className="w-4 h-4" />
                  <span>{admin?.username}</span>
                  {isModerator && (
                    <span className="bg-[#2F5BEA]/30 text-blue-300 text-[10px] font-bold px-1.5 py-0.5 rounded">mod</span>
                  )}
                  {totalBadge > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                      {totalBadge > 9 ? '9+' : totalBadge}
                    </span>
                  )}
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in">
                    <div className="bg-gradient-to-r from-[#1F2A44] to-[#2F5BEA] px-4 py-3">
                      <p className="text-white text-xs font-semibold uppercase tracking-widest opacity-70">Admin Panel</p>
                      <p className="text-white font-bold text-sm mt-0.5">{admin?.username}</p>
                    </div>
                    <div className="py-1.5">
                      <Link to="/admin"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-[#F5F7FA] transition-colors">
                        <LayoutDashboard className="w-4 h-4 text-[#2F5BEA]" /> Dashboard
                      </Link>
                      <Link to="/admin/members"
                        className="flex items-center justify-between px-4 py-2.5 text-sm text-gray-700 hover:bg-[#F5F7FA] transition-colors">
                        <span className="flex items-center gap-3">
                          <UserCheck className="w-4 h-4 text-amber-500" /> Manage Members
                        </span>
                        <Badge count={pendingMembers} />
                      </Link>
                      <Link to="/admin/posts"
                        className="flex items-center justify-between px-4 py-2.5 text-sm text-gray-700 hover:bg-[#F5F7FA] transition-colors">
                        <span className="flex items-center gap-3">
                          <FileText className="w-4 h-4 text-[#F39C12]" /> Manage Posts
                        </span>
                        <Badge count={pendingPosts} />
                      </Link>
                      <Link to="/admin/events"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-[#F5F7FA] transition-colors">
                        <Calendar className="w-4 h-4 text-[#2ECC71]" /> Manage Events
                      </Link>
                      <Link to="/admin/aspl"
                        className="flex items-center justify-between px-4 py-2.5 text-sm text-gray-700 hover:bg-[#F5F7FA] transition-colors">
                        <span className="flex items-center gap-3">
                          <Trophy className="w-4 h-4 text-yellow-500" /> ASPL
                        </span>
                        <Badge count={pendingAspl} />
                      </Link>
                      <Link to="/admin/messages"
                        className="flex items-center justify-between px-4 py-2.5 text-sm text-gray-700 hover:bg-[#F5F7FA] transition-colors">
                        <span className="flex items-center gap-3">
                          <MessageSquare className="w-4 h-4 text-[#9B59B6]" /> Messages
                        </span>
                        <Badge count={unreadMessages} />
                      </Link>
                      {isFullAdmin && (
                        <Link to="/admin/settings"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-[#F5F7FA] transition-colors border-t border-gray-100 mt-1">
                          <Settings className="w-4 h-4 text-[#9B59B6]" /> Committee Settings
                        </Link>
                      )}
                    </div>
                    <div className="border-t border-gray-100 px-4 py-2">
                      <button onClick={logout}
                        className="w-full flex items-center gap-2 text-sm text-red-500 hover:text-red-600 py-1.5 transition-colors font-medium">
                        <LogOut className="w-4 h-4" /> Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/posts/submit"
                  className="flex items-center gap-1.5 border border-white/20 hover:border-[#F39C12] text-gray-300 hover:text-[#F39C12] px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
                  <PenLine className="w-3.5 h-3.5" /> Post
                </Link>
                {asplVisible && (
                  <Link to="/aspl"
                    className="flex items-center gap-1.5 border border-yellow-400/30 hover:border-yellow-400 text-yellow-400 hover:text-yellow-300 px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
                    <Trophy className="w-3.5 h-3.5" /> ASPL
                  </Link>
                )}
                <Link to="/register"
                  className="flex items-center gap-2 bg-[#2F5BEA] hover:bg-[#1a3fc7] text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm shadow-[#2F5BEA]/30">
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setIsOpen(v => !v)}
            className="md:hidden relative w-9 h-9 flex items-center justify-center rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-all">
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            {isAdmin && totalBadge > 0 && !isOpen && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {totalBadge > 9 ? '9+' : totalBadge}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden border-t border-white/10 bg-[#1a2338]">
          <div className="px-3 py-3 space-y-0.5">
            {navLinks.map(item => (
              <Link key={item.name} to={item.href}
                className={`flex items-center px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${isActive(item.href)
                  ? 'bg-white/10 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}>
                {isActive(item.href) && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#F39C12] mr-2.5 flex-shrink-0" />
                )}
                {item.name}
              </Link>
            ))}
          </div>

          <div className="border-t border-white/10 px-3 py-3 space-y-0.5">
            {isAdmin ? (
              <>
                <div className="flex items-center gap-2 px-4 py-2 mb-1">
                  <div className="w-7 h-7 rounded-full bg-[#2F5BEA] flex items-center justify-center text-white text-xs font-bold">
                    {admin?.username?.[0]?.toUpperCase()}
                  </div>
                  <span className="text-white text-sm font-semibold">{admin?.username}</span>
                  {isModerator && (
                    <span className="bg-[#2F5BEA]/30 text-blue-300 text-[10px] font-bold px-1.5 py-0.5 rounded ml-auto">mod</span>
                  )}
                </div>
                <Link to="/admin"
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors">
                  <LayoutDashboard className="w-4 h-4 text-[#2F5BEA]" /> Dashboard
                </Link>
                <Link to="/admin/members"
                  className="flex items-center justify-between px-4 py-2.5 rounded-xl text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors">
                  <span className="flex items-center gap-3"><UserCheck className="w-4 h-4 text-amber-400" /> Manage Members</span>
                  <Badge count={pendingMembers} />
                </Link>
                <Link to="/admin/posts"
                  className="flex items-center justify-between px-4 py-2.5 rounded-xl text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors">
                  <span className="flex items-center gap-3"><FileText className="w-4 h-4 text-[#F39C12]" /> Manage Posts</span>
                  <Badge count={pendingPosts} />
                </Link>
                <Link to="/admin/events"
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors">
                  <Calendar className="w-4 h-4 text-[#2ECC71]" /> Manage Events
                </Link>
                <Link to="/admin/aspl"
                  className="flex items-center justify-between px-4 py-2.5 rounded-xl text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors">
                  <span className="flex items-center gap-3"><Trophy className="w-4 h-4 text-yellow-400" /> ASPL</span>
                  <Badge count={pendingAspl} />
                </Link>
                <Link to="/admin/messages"
                  className="flex items-center justify-between px-4 py-2.5 rounded-xl text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors">
                  <span className="flex items-center gap-3"><MessageSquare className="w-4 h-4 text-[#9B59B6]" /> Messages</span>
                  <Badge count={unreadMessages} />
                </Link>
                {isFullAdmin && (
                  <Link to="/admin/settings"
                    className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors">
                    <Settings className="w-4 h-4 text-purple-400" /> Committee Settings
                  </Link>
                )}
                <button onClick={() => { logout(); setIsOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-red-400 hover:text-red-300 hover:bg-white/5 transition-colors mt-1 border-t border-white/10 pt-3">
                  <LogOut className="w-4 h-4" /> Sign out
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-2 mx-1">
                <Link to="/posts/submit"
                  className="flex items-center justify-center gap-2 border border-white/20 hover:border-[#F39C12] text-gray-300 hover:text-[#F39C12] px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors">
                  <PenLine className="w-4 h-4" /> Write a Post
                </Link>
                {asplVisible && (
                  <Link to="/aspl"
                    className="flex items-center justify-center gap-2 border border-yellow-400/30 hover:border-yellow-400 text-yellow-400 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors">
                    <Trophy className="w-4 h-4" /> ASPL
                  </Link>
                )}
                <Link to="/register"
                  className="flex items-center justify-center gap-2 bg-[#2F5BEA] hover:bg-[#1a3fc7] text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors">
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}