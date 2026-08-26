// src/components/Navigation.tsx
import { Link, useLocation } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { Menu, X, LogOut, LayoutDashboard, Settings, UserCheck, FileText, Calendar, MessageSquare, PenLine, Trophy, Shield, User } from 'lucide-react';
import { useState, useEffect, useRef, ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { adminApi, asplApi, imageUrl, ASPL_SETTINGS_EVENT } from '../lib/api';
import LogoLoaderFull from './LogoLoaderFull';

const DRAWER_ANIM_MS = 300;

function Badge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
      {count > 99 ? '99+' : count}
    </span>
  );
}

/* ── Drawer building blocks ──────────────────────────────────────────────── */

function DrawerSection({ label, className = '', children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <div className={`px-3 py-3 border-b border-white/5 last:border-b-0 ${className}`}>
      <p className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-white/30">{label}</p>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function DrawerLink({ to, icon, label, badge, active = false }: {
  to: string;
  icon?: ReactNode;
  label: string;
  badge?: number;
  active?: boolean;
}) {
  return (
    <Link to={to}
      aria-current={active ? 'page' : undefined}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F39C12] ${active
        ? 'bg-white/10 text-white'
        : 'text-gray-300 hover:bg-white/5 hover:text-white'
        }`}>
      {icon
        ? <span className="flex-shrink-0">{icon}</span>
        : <span className={`w-1.5 h-1.5 flex-shrink-0 rounded-full ${active ? 'bg-[#F39C12]' : 'bg-white/20'}`} />
      }
      <span className="flex-1 truncate">{label}</span>
      {badge !== undefined && <Badge count={badge} />}
    </Link>
  );
}

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [pendingMembers, setPendingMembers] = useState(0);
  const [pendingPosts, setPendingPosts] = useState(0);
  const [unreadCommunications, setUnreadCommunications] = useState(0);
  const [unreadInbox, setUnreadInbox] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [logoKey, setLogoKey] = useState(0);
  const [asplVisible, setAsplVisible] = useState(() => asplApi.getCachedSettings().visible);

  // The drawer stays mounted for one animation cycle after closing so it can
  // slide back out, and is unmounted afterwards to keep it out of the tab order.
  const [drawerMounted, setDrawerMounted] = useState(false);
  const [drawerShown, setDrawerShown] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const hamburgerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);

  const location = useLocation();
  const { isAdmin, isFullAdmin, isModerator, loading: authLoading, member, isMember, memberLogout } = useAuth();

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'People', href: '/people' },
    { name: 'Events', href: '/events' },
    { name: 'Posts', href: '/posts' },
    { name: 'Gallery', href: '/gallery' },
    { name: 'About', href: '/about' },
    { name: 'Contact', href: '/contact' },
  ];

  const totalBadge = pendingMembers + pendingPosts + unreadCommunications + unreadInbox;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // ASPL visibility is a server setting, so this is a request rather than a
  // localStorage read — fetch it once on mount instead of on every navigation,
  // and listen for the admin toggle so it still updates without a reload.
  useEffect(() => {
    let cancelled = false;

    const refresh = () => {
      asplApi.getSettings().then(s => { if (!cancelled) setAsplVisible(s.visible); });
    };

    refresh();
    window.addEventListener(ASPL_SETTINGS_EVENT, refresh);
    return () => { cancelled = true; window.removeEventListener(ASPL_SETTINGS_EVENT, refresh); };
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => { setIsOpen(false); setDropdownOpen(false); }, [location.pathname]);

  /* ── Drawer: mount/paint cycle ──────────────────────────────────────────── */
  useEffect(() => {
    if (isOpen) {
      setDrawerMounted(true);
      // Paint the panel off-screen first so the transform has something to
      // animate from; flipping both in the same frame skips the slide.
      const frame = requestAnimationFrame(() => setDrawerShown(true));
      return () => cancelAnimationFrame(frame);
    }
    setDrawerShown(false);
    const timer = setTimeout(() => setDrawerMounted(false), DRAWER_ANIM_MS);
    return () => clearTimeout(timer);
  }, [isOpen]);

  /* ── Drawer: lock the page behind it ────────────────────────────────────── */
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [isOpen]);

  /* ── Drawer: Escape to close, Tab kept inside the panel ─────────────────── */
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setIsOpen(false); return; }
      if (e.key !== 'Tab' || !panelRef.current) return;

      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

  /* ── Drawer: move focus in on open, back to the trigger on close ────────── */
  useEffect(() => {
    if (drawerShown) closeRef.current?.focus();
  }, [drawerShown]);

  useEffect(() => {
    if (wasOpen.current && !isOpen) hamburgerRef.current?.focus();
    wasOpen.current = isOpen;
  }, [isOpen]);

  // Fetch all counts, refresh on route change + every 60s
  // Auto-logout if any request returns 401 (expired token)
  useEffect(() => {
    if (authLoading || !isAdmin) return;

    const handle401 = (err: unknown) => {
      const msg = err instanceof Error ? err.message.toLowerCase() : '';
      if (msg.includes('401') || msg.includes('unauthorized') || msg.includes('no token') || msg.includes('invalid') || msg.includes('expired')) {
        memberLogout();
      }
    };

    const fetchAll = () => {
      if (!location.pathname.startsWith('/admin/members'))
        adminApi.getPendingCount().then(r => setPendingMembers(r.data.count)).catch(handle401);
      if (!location.pathname.startsWith('/admin/posts'))
        adminApi.getPendingPostCount().then(r => setPendingPosts(r.data.count)).catch(handle401);
      if (!location.pathname.startsWith('/admin/communications')) {
        adminApi.getUnreadMessageCount().then(r => setUnreadCommunications(r.data.count)).catch(handle401);
        adminApi.getInboxUnreadCount().then(r => setUnreadInbox(r.data.count)).catch(handle401);
      }
    };

    fetchAll();
    const t = setInterval(fetchAll, 60000);
    return () => clearInterval(t);
  }, [authLoading, isAdmin, location.pathname, memberLogout]);

  // Clear badge when visiting that section
  useEffect(() => {
    if (location.pathname.startsWith('/admin/members')) setPendingMembers(0);
    if (location.pathname.startsWith('/admin/posts')) setPendingPosts(0);
    if (location.pathname.startsWith('/admin/communications')) { setUnreadCommunications(0); setUnreadInbox(0); }
  }, [location.pathname]);

  const isActive = (href: string) =>
    href === '/' ? location.pathname === '/' : location.pathname.startsWith(href);

  const avatar = (size: string, textSize: string) => member?.photo_url
    ? <img src={imageUrl(member.photo_url) || ''} alt="" className={`${size} rounded-full object-cover border border-white/25 flex-shrink-0`} />
    : <div className={`${size} rounded-full bg-[#2F5BEA] flex items-center justify-center text-white ${textSize} font-bold flex-shrink-0`}>
      {(member?.full_name || '?').charAt(0).toUpperCase()}
    </div>;

  /* ── Sidebar drawer ─────────────────────────────────────────────────────── */
  // Portalled to <body>: when the header is scrolled it carries `backdrop-blur`,
  // and a backdrop-filter makes the header the containing block for any fixed
  // descendant — which would pin the drawer inside the 56px-tall header.
  const drawer = drawerMounted && createPortal(
    <div className="lg:hidden">
      <div
        onClick={() => setIsOpen(false)}
        className={`fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm transition-opacity duration-300 motion-reduce:transition-none ${drawerShown ? 'opacity-100' : 'opacity-0'}`}
      />

      <aside
        ref={panelRef}
        id="site-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Site menu"
        className={`fixed top-0 right-0 z-[70] flex h-[100dvh] w-[86vw] max-w-sm flex-col bg-[#1a2338] shadow-2xl shadow-black/50 transition-transform duration-300 ease-out motion-reduce:transition-none ${drawerShown ? 'translate-x-0' : 'translate-x-full'}`}>

        <div className="h-0.5 flex-shrink-0 bg-gradient-to-r from-[#2F5BEA] via-[#F39C12] to-[#2ECC71]" />

        {/* Header — pinned, never scrolls */}
        <div className="flex flex-shrink-0 items-start gap-3 border-b border-white/10 px-4 py-4">
          {isMember ? (
            <>
              {avatar('w-11 h-11', 'text-base')}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">{member?.full_name}</p>
                <p className="truncate text-xs text-gray-400">{member?.email}</p>
                {isAdmin && (
                  <span className={`mt-1 inline-block rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${isFullAdmin ? 'bg-[#F39C12]/20 text-[#F39C12]' : 'bg-[#2F5BEA]/30 text-blue-300'}`}>
                    {isFullAdmin ? 'Admin' : 'Moderator'}
                  </span>
                )}
              </div>
            </>
          ) : (
            <div className="min-w-0 flex-1 pt-0.5">
              <LogoLoaderFull size={30} scheme="dark" />
              <p className="mt-2 text-xs text-gray-400">Student Welfare Organization, ISRT</p>
            </div>
          )}

          <button
            ref={closeRef}
            onClick={() => setIsOpen(false)}
            aria-label="Close menu"
            className="-mr-1 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F39C12]">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body — the only scrolling region */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <DrawerSection label="Browse" className="md:hidden">
            {navLinks.map(item => (
              <DrawerLink key={item.name} to={item.href} label={item.name} active={isActive(item.href)} />
            ))}
          </DrawerSection>

          <DrawerSection label="Quick actions">
            <DrawerLink to="/posts/submit" label="Write a Post" icon={<PenLine className="h-4 w-4 text-[#F39C12]" />} />
            {asplVisible && (
              <Link to="/aspl"
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-yellow-400 transition-colors hover:bg-white/5 hover:text-yellow-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F39C12]">
                <Trophy className="h-4 w-4 flex-shrink-0" />
                <span className="flex-1 truncate">ASPL</span>
              </Link>
            )}
          </DrawerSection>

          {isAdmin && (
            <DrawerSection label="Admin panel">
              <DrawerLink to="/admin" label="Dashboard" icon={<LayoutDashboard className="h-4 w-4 text-[#2F5BEA]" />} />
              <DrawerLink to="/admin/members" label="Manage Members" icon={<UserCheck className="h-4 w-4 text-amber-400" />} badge={pendingMembers} />
              <DrawerLink to="/admin/posts" label="Manage Posts" icon={<FileText className="h-4 w-4 text-[#F39C12]" />} badge={pendingPosts} />
              <DrawerLink to="/admin/events" label="Manage Events" icon={<Calendar className="h-4 w-4 text-[#2ECC71]" />} />
              <DrawerLink to="/admin/communications" label="Communications" icon={<MessageSquare className="h-4 w-4 text-[#9B59B6]" />} badge={unreadCommunications + unreadInbox} />
              {isFullAdmin && (
                <>
                  <DrawerLink to="/admin/settings" label="Committee Settings" icon={<Settings className="h-4 w-4 text-purple-400" />} />
                  <DrawerLink to="/admin/accounts" label="Account Management" icon={<Shield className="h-4 w-4 text-amber-400" />} />
                </>
              )}
            </DrawerSection>
          )}

          {isMember && (
            <DrawerSection label="Account">
              <DrawerLink to="/account" label={isAdmin ? 'My Profile' : 'My Account'} icon={<User className="h-4 w-4 text-[#2F5BEA]" />} />
              <DrawerLink to="/update-profile" label="Update Profile" icon={<UserCheck className="h-4 w-4 text-[#2ECC71]" />} />
              {!isAdmin && (
                <DrawerLink to="/change-password" label="Change Password" icon={<Settings className="h-4 w-4 text-gray-400" />} />
              )}
            </DrawerSection>
          )}
        </div>

        {/* Footer — pinned, never scrolls */}
        <div className="flex-shrink-0 border-t border-white/10 bg-[#161d30] px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          {isMember ? (
            <button onClick={() => { memberLogout(); setIsOpen(false); }}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/25 py-2.5 text-sm font-semibold text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400">
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          ) : (
            <div className="flex flex-col gap-2">
              <Link to="/login"
                className="rounded-xl border border-white/20 py-2.5 text-center text-sm font-semibold text-gray-300 transition-colors hover:border-white/40 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F39C12]">
                Sign In
              </Link>
              <Link to="/signup"
                className="rounded-xl bg-[#2F5BEA] py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-[#1a3fc7] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F39C12]">
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </aside>
    </div>,
    document.body
  );

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
                aria-current={isActive(item.href) ? 'page' : undefined}
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
          <div className="hidden lg:flex items-center gap-2">
            {/* Post + ASPL — always visible */}
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
            {isAdmin ? (
              <div ref={dropdownRef} className="relative">
                <button
                  onClick={() => setDropdownOpen(v => !v)}
                  aria-expanded={dropdownOpen}
                  aria-haspopup="menu"
                  className={`relative flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl text-sm font-semibold transition-all ${dropdownOpen
                    ? 'bg-white/15 text-white'
                    : 'text-[#F39C12] hover:bg-white/10'
                    }`}>
                  {avatar('w-7 h-7', 'text-xs')}
                  <span>{member?.full_name?.split(' ')[0]}</span>
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
                      <p className="text-white font-bold text-sm mt-0.5 truncate">{member?.full_name}</p>
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
                      <Link to="/admin/communications"
                        className="flex items-center justify-between px-4 py-2.5 text-sm text-gray-700 hover:bg-[#F5F7FA] transition-colors">
                        <span className="flex items-center gap-3">
                          <MessageSquare className="w-4 h-4 text-[#9B59B6]" /> Communications
                        </span>
                        <Badge count={unreadCommunications + unreadInbox} />
                      </Link>
                      {isFullAdmin && (
                        <>
                          <Link to="/admin/settings"
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-[#F5F7FA] transition-colors border-t border-gray-100 mt-1">
                            <Settings className="w-4 h-4 text-[#9B59B6]" /> Committee Settings
                          </Link>
                          <Link to="/admin/accounts"
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-[#F5F7FA] transition-colors">
                            <Shield className="w-4 h-4 text-amber-500" /> Account Management
                          </Link>
                        </>
                      )}
                    </div>
                    <div className="border-t border-gray-100 py-1.5">
                      <Link to="/account"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-[#F5F7FA] transition-colors">
                        <User className="w-4 h-4 text-[#2F5BEA]" /> My Profile
                      </Link>
                      <Link to="/update-profile"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-[#F5F7FA] transition-colors">
                        <UserCheck className="w-4 h-4 text-[#2ECC71]" /> Update Profile
                      </Link>
                    </div>
                    <div className="border-t border-gray-100 px-4 py-2">
                      <button onClick={memberLogout}
                        className="w-full flex items-center gap-2 text-sm text-red-500 hover:text-red-600 py-1.5 transition-colors font-medium">
                        <LogOut className="w-4 h-4" /> Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : isMember ? (
              // Member logged in
              <div ref={dropdownRef} className="relative">
                <button
                  onClick={() => setDropdownOpen(v => !v)}
                  aria-expanded={dropdownOpen}
                  aria-haspopup="menu"
                  className={`flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl text-sm font-semibold transition-all ${dropdownOpen ? 'bg-white/15 text-white' : 'text-white/80 hover:bg-white/10'}`}>
                  {avatar('w-7 h-7', 'text-xs')}
                  <span className="max-w-[100px] truncate">{member?.full_name.split(' ')[0]}</span>
                </button>
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
                    <div className="bg-gradient-to-r from-[#1F2A44] to-[#2F5BEA] px-4 py-3">
                      <p className="text-white text-xs font-semibold uppercase tracking-widest opacity-70">Member</p>
                      <p className="text-white font-bold text-sm mt-0.5 truncate">{member?.full_name}</p>
                    </div>
                    <div className="py-1.5">
                      <Link to="/account" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-[#F5F7FA] transition-colors">
                        <User className="w-4 h-4 text-[#2F5BEA]" /> My Account
                      </Link>
                      <Link to="/update-profile" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-[#F5F7FA] transition-colors">
                        <UserCheck className="w-4 h-4 text-[#2ECC71]" /> Update Profile
                      </Link>
                    </div>
                    <div className="border-t border-gray-100 px-4 py-2">
                      <button onClick={memberLogout} className="w-full flex items-center gap-2 text-sm text-red-500 hover:text-red-600 py-1.5 transition-colors font-medium">
                        <LogOut className="w-4 h-4" /> Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login"
                  className="flex items-center gap-2 border border-white/20 hover:border-white/40 text-gray-300 hover:text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
                  Sign In
                </Link>
                <Link to="/signup"
                  className="flex items-center gap-2 bg-[#2F5BEA] hover:bg-[#1a3fc7] text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm shadow-[#2F5BEA]/30">
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger — opens the sidebar drawer */}
          <button
            ref={hamburgerRef}
            onClick={() => setIsOpen(v => !v)}
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isOpen}
            aria-controls="site-menu"
            className="lg:hidden relative w-9 h-9 flex items-center justify-center rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F39C12]">
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            {isAdmin && totalBadge > 0 && !isOpen && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {totalBadge > 9 ? '9+' : totalBadge}
              </span>
            )}
          </button>
        </div>
      </div>

      {drawer}
    </nav>
  );
}
