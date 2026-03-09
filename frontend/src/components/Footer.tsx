// src/components/Footer.tsx
import { useState, useEffect } from 'react';
// import { Facebook, Twitter, Instagram, Mail, MapPin, Phone, Heart } from 'lucide-react';
import { Facebook, Mail, MapPin, Phone, Heart, Eye, Users } from 'lucide-react';
import { visitorApi } from '../lib/api';
import { Link } from 'react-router-dom';
import LogoLoaderFull from './LogoLoaderFull';

const quickLinks = [
  { label: 'About Us', href: '/about' },
  { label: 'People', href: '/people' },
  { label: 'Events', href: '/events' },
  { label: 'Posts', href: '/posts' },
  { label: 'Gallery', href: '/gallery' },
  { label: 'Contact', href: '/contact' },
];

const contact = [
  { icon: MapPin, text: 'ISRT, University of Dhaka' },
  { icon: Mail, text: 'info@stataisrt.org' },
  { icon: Phone, text: '+880 123 456 789' },
];

const socials = [
  { icon: Facebook, href: 'https://www.facebook.com/stataisrt', label: 'Facebook' },
  // { icon: Twitter, href: '#', label: 'Twitter' },
  // { icon: Instagram, href: '#', label: 'Instagram' },
];

export default function Footer() {
  const [logoKey, setLogoKey] = useState(0);
  const [stats, setStats] = useState<{ today: number; lifetime: number } | null>(null);

  useEffect(() => {
    visitorApi.track();
    visitorApi.getStats()
      .then(setStats)
      .catch(() => {});
  }, []);

  return (
    <footer className="relative bg-[#1F2A44] text-white overflow-hidden mt-auto">
      {/* Top gradient accent */}
      <div className="h-0.5 bg-gradient-to-r from-[#2F5BEA] via-[#F39C12] to-[#2ECC71]" />

      {/* Decorative blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-[#2F5BEA] rounded-full opacity-5" />
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#F39C12] rounded-full opacity-5" />
      </div>

      {/* Visitor counter bar */}
      <div className="relative border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-center gap-6">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Eye className="w-3.5 h-3.5 text-[#2F5BEA]/70" />
            <span>Today</span>
            <span className="font-bold text-gray-300 tabular-nums">
              {stats ? stats.today.toLocaleString() : '—'}
            </span>
          </div>
          <div className="w-px h-3.5 bg-white/10" />
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Users className="w-3.5 h-3.5 text-[#F39C12]/70" />
            <span>All-time</span>
            <span className="font-bold text-gray-300 tabular-nums">
              {stats ? stats.lifetime.toLocaleString() : '—'}
            </span>
          </div>
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-8">
        {/* Main grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 mb-12">

          {/* Brand column */}
          <div className="md:col-span-4">
            <Link to="/" className="inline-block mb-0"
              onMouseEnter={() => setLogoKey(k => k + 1)}>
              <LogoLoaderFull key={logoKey} size={34} scheme="dark" hoverOnly={logoKey > 0} />
            </Link>
            <p className="mt-1 mb-2 text-xs font-semibold tracking-widest uppercase text-[#F39C12]/80">
              Together Beyond the Classroom
            </p>
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
              The student welfare organization of <br />
              Institute of Statistical Research and Training <br />
              University of Dhaka
            </p>

            {/* Social icons */}
            <div className="flex items-center gap-2.5 mt-6">
              {socials.map(({ icon: Icon, href, label }) => (
                <a key={label} href={href} aria-label={label} target='_blank'
                  className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:bg-[#2F5BEA] hover:text-white hover:border-[#2F5BEA] transition-all">
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <div className="md:col-span-3">
            <h4 className="text-xs font-bold tracking-widest uppercase text-gray-500 mb-5">Quick Links</h4>
            <ul className="space-y-2.5">
              {quickLinks.map(({ label, href }) => (
                <li key={href}>
                  <Link to={href}
                    className="group flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
                    <span className="w-1 h-1 rounded-full bg-[#F39C12] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="md:col-span-5">
            <h4 className="text-xs font-bold tracking-widest uppercase text-gray-500 mb-5">Contact Info</h4>
            <ul className="space-y-4">
              {contact.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon className="w-3.5 h-3.5 text-[#F39C12]" />
                  </div>
                  <span className="text-sm text-gray-400 leading-relaxed">{text}</span>
                </li>
              ))}
            </ul>

            {/* Register CTA */}
            <div className="mt-7 bg-white/5 border border-white/10 rounded-2xl p-4">
              <p className="text-sm text-gray-300 font-medium mb-1">Are you an ISRTian?</p>
              <p className="text-xs text-gray-500 mb-3">Join the STATA network and stay connected.</p>
              <Link to="/register"
                className="inline-flex items-center gap-2 bg-[#2F5BEA] hover:bg-[#1a3fc7] text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm">
                Register Now
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-500">
            &copy; {new Date().getFullYear()} STATA · ISRT, University of Dhaka. All rights reserved.
          </p>
          <p className="text-xs text-gray-600 flex items-center gap-1">
            Made with <Heart className="w-3 h-3 text-red-400 fill-red-400" /> for ISRTians
          </p>
        </div>
      </div>
    </footer>
  );
}