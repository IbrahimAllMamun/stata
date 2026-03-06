// src/pages/Home.tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Users, Heart, Trophy, ArrowRight, MapPin, Clock, FileText, ChevronRight, Quote } from 'lucide-react';
import { api, Post, Event, imageUrl, speechApi, Speech } from '../lib/api';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function stripHtml(html: string | null | undefined) {
  if (!html) return '';
  const stripped = html.replace(/<[^>]*>/g, '');
  return stripped.slice(0, 120) + (stripped.length > 120 ? '…' : '');
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 rounded ${className}`} />;
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({ label, title, subtitle, href, linkLabel }: {
  label: string; title: string; subtitle: string; href: string; linkLabel: string;
}) {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
      <div>
        <span className="text-xs font-bold tracking-widest uppercase text-[#2F5BEA] mb-2 block">{label}</span>
        <h2 className="text-3xl md:text-4xl font-bold text-[#1F2A44] leading-tight">{title}</h2>
        <p className="text-gray-500 mt-2 text-base">{subtitle}</p>
      </div>
      <Link to={href}
        className="inline-flex items-center gap-2 text-sm font-semibold text-[#2F5BEA] hover:text-[#F39C12] transition-colors flex-shrink-0 group">
        {linkLabel}
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </Link>
    </div>
  );
}

// ─── Event Card ───────────────────────────────────────────────────────────────
function EventCard({ event }: { event: Event }) {
  const img = imageUrl(event.banner_image);
  const date = new Date(event.event_date);
  const day = date.getDate();
  const month = date.toLocaleString('en-US', { month: 'short' });

  return (
    <Link to={`/events/${event.slug}`}
      className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col">
      {/* Banner */}
      <div className="relative h-44 bg-gradient-to-br from-[#1F2A44] to-[#2F5BEA] overflow-hidden flex-shrink-0">
        {img
          ? <img src={img} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          : <div className="w-full h-full flex items-center justify-center opacity-20"><Calendar className="w-16 h-16 text-white" /></div>
        }
        {/* Date badge */}
        <div className="absolute top-3 left-3 bg-white rounded-xl px-3 py-1.5 text-center shadow-md min-w-[48px]">
          <div className="text-lg font-bold text-[#1F2A44] leading-none">{day}</div>
          <div className="text-[10px] font-bold text-[#2F5BEA] uppercase tracking-wide">{month}</div>
        </div>
        {/* Upcoming badge */}
        {event.is_upcoming && (
          <div className="absolute top-3 right-3 bg-[#2ECC71] text-white text-xs font-bold px-2 py-1 rounded-full">
            Upcoming
          </div>
        )}
      </div>
      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-bold text-[#1F2A44] text-lg mb-2 line-clamp-2 group-hover:text-[#2F5BEA] transition-colors">{event.title}</h3>
        {event.description && (
          <p className="text-gray-500 text-sm line-clamp-2 mb-3 flex-1">{stripHtml(event.description)}</p>
        )}
        <div className="flex flex-col gap-1 mt-auto pt-3 border-t border-gray-50">
          {event.location && (
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" /> {event.location}
            </div>
          )}
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Clock className="w-3.5 h-3.5 flex-shrink-0" /> {formatDate(event.event_date)}
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── Post Card ────────────────────────────────────────────────────────────────
function PostCard({ post }: { post: Post }) {
  const img = imageUrl(post.cover_image);
  return (
    <Link to={`/posts/${post.slug}`}
      className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col">
      {img && (
        <div className="h-44 overflow-hidden flex-shrink-0">
          <img src={img} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        </div>
      )}
      {!img && (
        <div className="h-44 bg-gradient-to-br from-[#F39C12]/10 to-[#2F5BEA]/10 flex items-center justify-center flex-shrink-0">
          <FileText className="w-12 h-12 text-[#2F5BEA]/30" />
        </div>
      )}
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-gray-400">{formatDate(post.created_at)}</span>
          {post.admin && (
            <span className="text-xs text-gray-300">·</span>
          )}
          {post.admin && (
            <span className="text-xs text-gray-400">{post.admin.username}</span>
          )}
        </div>
        <h3 className="font-bold text-[#1F2A44] text-lg mb-2 line-clamp-2 group-hover:text-[#2F5BEA] transition-colors">{post.title}</h3>
        <p className="text-gray-500 text-sm line-clamp-3 flex-1">{stripHtml(post.content)}</p>
        <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-[#2F5BEA] group-hover:text-[#F39C12] transition-colors">
          Read more <ChevronRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </Link>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Home() {
  const [latestPosts, setLatestPosts] = useState<Post[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [speeches, setSpeeches] = useState<Speech[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);

  useEffect(() => {
    speechApi.getAll().then(res => setSpeeches(res.data)).catch(() => { });
    api.getEvents('upcoming')
      .then(res => setUpcomingEvents(res.data.slice(0, 3)))
      .catch(console.error)
      .finally(() => setLoadingEvents(false));

    api.getPosts({ limit: 3 })
      .then(res => setLatestPosts(res.data))
      .catch(console.error)
      .finally(() => setLoadingPosts(false));
  }, []);

  return (
    <div className="bg-[#F5F7FA]">

      {/* ── Hero ── */}
      <section className="relative bg-[#1F2A44] text-white overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-0 w-96 h-96 bg-[#2F5BEA] rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#F39C12] rounded-full translate-x-1/2 translate-y-1/2" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 py-24 md:py-32 text-center">
          <div className="inline-block bg-[#2F5BEA]/20 border border-[#2F5BEA]/30 text-[#7BA3F5] text-xs font-bold tracking-widest uppercase px-4 py-1.5 rounded-full mb-6">
            Student Welfare Organization · ISRT
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight tracking-tight">
            Welcome to <span className="text-[#F39C12]">STATA</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 max-w-2xl mx-auto mb-10 leading-relaxed">
            Connecting Minds, Building Bonds, Nourishing Well-being
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/events"
              className="bg-[#F39C12] hover:bg-[#E67E22] text-white px-8 py-3.5 rounded-xl font-semibold transition-colors inline-flex items-center justify-center gap-2 shadow-lg shadow-[#F39C12]/20">
              Explore Events <ArrowRight className="w-5 h-5" />
            </Link>
            <Link to="/register"
              className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-8 py-3.5 rounded-xl font-semibold transition-colors">
              Join STATA
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <section className="bg-[#2F5BEA] text-white">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-y-4 gap-x-0">
            {[
              { icon: Users, label: 'Members', value: '200+' },
              { icon: Calendar, label: 'Events Held', value: '50+' },
              { icon: Trophy, label: 'Batches', value: '15+' },
              { icon: Heart, label: 'Years Active', value: '10+' },
            ].map(({ icon: Icon, label, value }, i) => (
              <div key={label} className={`flex items-center gap-3 px-6 py-1 ${i !== 3 ? 'border-r border-white/10' : ''
                } ${i === 1 ? 'md:border-r-0' : ''
                }`}>
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 opacity-90" />
                </div>
                <div>
                  <div className="text-2xl font-extrabold leading-none">{value}</div>
                  <div className="text-xs opacity-60 mt-1 font-medium">{label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Mission ── */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <span className="text-xs font-bold tracking-widest uppercase text-[#2F5BEA] mb-2 block">What We Do</span>
          <h2 className="text-3xl md:text-4xl font-bold text-[#1F2A44]">Our Mission</h2>
          <p className="text-gray-500 mt-3 max-w-2xl mx-auto">
            STATA is dedicated to improving students' mental health and social bonding through meaningful activities and events.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { icon: Heart, color: 'bg-[#2F5BEA]', title: 'Mental Health', desc: 'Supporting student well-being through activities and peer connections.' },
            { icon: Users, color: 'bg-[#2ECC71]', title: 'Social Bonding', desc: 'Building strong relationships through shared experiences.' },
            { icon: Calendar, color: 'bg-[#F39C12]', title: 'Events', desc: 'Organizing BBQ parties, tours, sports tournaments, and cultural events.' },
            { icon: Trophy, color: 'bg-[#E74C3C]', title: 'Alumni Network', desc: 'Connecting students with alumni for mentorship and guidance.' },
          ].map(({ icon: Icon, color, title, desc }) => (
            <div key={title} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center mb-4`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-[#1F2A44] mb-2">{title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Events ── */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <SectionHeader
            label="What's On"
            title="Upcoming Events"
            subtitle="Don't miss out on our latest events and activities"
            href="/events"
            linkLabel="All Events"
          />
          {loadingEvents ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100">
                  <Skeleton className="h-44 rounded-none" />
                  <div className="p-5 space-y-3">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : upcomingEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {upcomingEvents.map(event => <EventCard key={event.id} event={event} />)}
            </div>
          ) : (
            <div className="text-center py-16 bg-[#F5F7FA] rounded-2xl">
              <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400 font-medium">No upcoming events right now</p>
              <Link to="/events" className="text-[#2F5BEA] text-sm font-semibold mt-2 inline-block hover:underline">
                View past events →
              </Link>
            </div>
          )}
          {upcomingEvents.length > 0 && (
            <div className="text-center mt-8">
              <Link to="/events"
                className="inline-flex items-center gap-2 bg-[#1F2A44] hover:bg-[#2F5BEA] text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors">
                View All Events <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ── Posts ── */}
      <section className="bg-[#F5F7FA] py-20">
        <div className="max-w-7xl mx-auto px-4">
          <SectionHeader
            label="Latest News"
            title="Announcements & Posts"
            subtitle="Stay informed about our recent activities and updates"
            href="/posts"
            linkLabel="All Posts"
          />
          {loadingPosts ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100">
                  <Skeleton className="h-44 rounded-none" />
                  <div className="p-5 space-y-3">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : latestPosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {latestPosts.map(post => <PostCard key={post.id} post={post} />)}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
              <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400 font-medium">No posts yet — check back soon!</p>
            </div>
          )}
          {latestPosts.length > 0 && (
            <div className="text-center mt-8">
              <Link to="/posts"
                className="inline-flex items-center gap-2 bg-[#1F2A44] hover:bg-[#2F5BEA] text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors">
                View All Posts <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ── Speeches ── */}
      {speeches.length > 0 && (
        <section className="bg-[#1F2A44] py-20 px-4 overflow-hidden relative">
          {/* Decorative blobs */}
          <div className="absolute top-0 left-0 w-72 h-72 bg-[#2F5BEA]/10 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#F39C12]/5 rounded-full translate-x-1/3 translate-y-1/3 pointer-events-none" />

          <div className="max-w-7xl mx-auto relative">
            <div className="text-center mb-12">
              <span className="text-xs font-bold tracking-widest uppercase text-[#F39C12] mb-3 block">From Our Community</span>
              <h2 className="text-3xl md:text-4xl font-bold text-white">What Our Members Say</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {speeches.map(speech => (
                <div key={speech.id}
                  className="relative bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/8 hover:border-white/20 transition-all group">
                  {/* Quote icon */}
                  <div className="w-10 h-10 rounded-xl bg-[#F39C12]/20 flex items-center justify-center mb-4">
                    <Quote className="w-5 h-5 text-[#F39C12]" />
                  </div>

                  {/* Message */}
                  <p className="text-gray-300 text-sm leading-relaxed mb-6 italic">
                    "{speech.message}"
                  </p>

                  {/* Author */}
                  <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                    <div className="w-9 h-9 rounded-xl bg-[#2F5BEA] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {speech.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm leading-none">{speech.name}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {speech.designation && (
                          <span className="text-gray-400 text-xs">{speech.designation}</span>
                        )}
                        {speech.designation && speech.batch && (
                          <span className="text-white/20 text-xs">·</span>
                        )}
                        {speech.batch && (
                          <span className="text-[#F39C12] text-xs font-semibold">Batch {speech.batch}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA ── */}
      <section className="bg-[#1F2A44] py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <span className="text-xs font-bold tracking-widest uppercase text-[#F39C12] mb-4 block">Be Part of Something</span>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Join the STATA Family</h2>
          <p className="text-gray-400 text-lg mb-10 max-w-xl mx-auto">
            Be part of a supportive community that cares about your well-being and growth.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register"
              className="bg-[#F39C12] hover:bg-[#E67E22] text-white px-8 py-3.5 rounded-xl font-semibold transition-colors inline-flex items-center justify-center gap-2">
              Register as Member <ArrowRight className="w-5 h-5" />
            </Link>
            <Link to="/people"
              className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-8 py-3.5 rounded-xl font-semibold transition-colors">
              Meet Our Members
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}