// src/pages/Events.tsx
import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Calendar, MapPin, Clock, ArrowRight } from 'lucide-react';
import { api, Event, imageUrl } from '../lib/api';
function formatDate(d: string) { return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }); }
function stripMarkdown(md: string) {
  return md
    .replace(/!\[.*?\]\(.*?\)/g, '')   // images
    .replace(/\[([^\]]+)\]\(.*?\)/g, '$1') // links
    .replace(/#{1,6}\s*/g, '')         // headings
    .replace(/(\*\*|__)(.*?)\1/g, '$2') // bold
    .replace(/(\*|_)(.*?)\1/g, '$2')   // italic
    .replace(/`{1,3}[^`]*`{1,3}/g, '') // code
    .replace(/>\s?/g, '')              // blockquotes
    .replace(/[-*+]\s/g, '')           // list items
    .replace(/\n+/g, ' ')             // newlines
    .trim();
}
function EventCard({ event, onClick }: { event: Event; onClick: () => void }) {
  const img = imageUrl(event.banner_image);
  const day = new Date(event.event_date).getDate();
  const month = new Date(event.event_date).toLocaleString('en-US', { month: 'short' });
  return (
    <div onClick={onClick} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group flex flex-col">
      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-[#1F2A44] to-[#2F5BEA] flex-shrink-0">
        {img && <img src={img} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />}
        <div className="absolute top-3 left-3 bg-white rounded-xl px-3 py-1.5 text-center shadow-md min-w-[48px]">
          <div className="text-lg font-bold text-[#1F2A44] leading-none">{day}</div>
          <div className="text-[10px] font-bold text-[#2F5BEA] uppercase tracking-wide">{month}</div>
        </div>
        {event.is_upcoming && <div className="absolute top-3 right-3 bg-[#2ECC71] text-white text-xs font-bold px-2.5 py-1 rounded-full">Upcoming</div>}
      </div>
      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-bold text-[#1F2A44] text-lg mb-2 line-clamp-2 group-hover:text-[#2F5BEA] transition-colors">{event.title}</h3>
        {event.description && <p className="text-gray-500 text-sm line-clamp-2 flex-1 mb-3">{stripMarkdown(event.description)}</p>}
        <div className="flex flex-col gap-1 pt-3 border-t border-gray-50 mt-auto">
          <div className="flex items-center gap-1.5 text-xs text-gray-400"><Clock className="w-3.5 h-3.5 flex-shrink-0" />{formatDate(event.event_date)}</div>
          {event.location && <div className="flex items-center gap-1.5 text-xs text-gray-400"><MapPin className="w-3.5 h-3.5 flex-shrink-0" />{event.location}</div>}
        </div>
      </div>
    </div>
  );
}
function Skeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100">
      <div className="h-48 bg-gray-200 animate-pulse" />
      <div className="p-5 space-y-3"><div className="h-5 bg-gray-200 rounded animate-pulse w-3/4" /><div className="h-4 bg-gray-200 rounded animate-pulse" /><div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" /></div>
    </div>
  );
}
export default function Events() {
  const navigate = useNavigate();
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [pastEvents, setPastEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'all' | 'upcoming' | 'past'>('all');
  useEffect(() => {
    Promise.all([api.getEvents('upcoming'), api.getEvents('past')])
      .then(([u, p]) => { setUpcomingEvents(u.data); setPastEvents(p.data); })
      .catch(console.error).finally(() => setLoading(false));
  }, []);
  const displayed = tab === 'upcoming' ? upcomingEvents : tab === 'past' ? pastEvents : [...upcomingEvents, ...pastEvents];
  return (
    <div className="bg-[#F5F7FA]">
      <section className="relative bg-[#1F2A44] text-white overflow-hidden">
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#2F5BEA] rounded-full translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#F39C12] rounded-full -translate-x-1/2 translate-y-1/2" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 py-20 text-center">
          <div className="inline-block bg-[#2F5BEA]/20 border border-[#2F5BEA]/30 text-[#7BA3F5] text-xs font-bold tracking-widest uppercase px-4 py-1.5 rounded-full mb-5">Activities & Events</div>
          <h1 className="text-5xl md:text-6xl font-extrabold mb-4 tracking-tight">Events</h1>
          <p className="text-gray-300 text-lg max-w-xl mx-auto">Join us in creating memorable experiences and building lasting friendships</p>
        </div>
      </section>
      {/* <section className="bg-[#2F5BEA] text-white">
        <div className="max-w-7xl mx-auto px-4 py-5 grid grid-cols-3 divide-x divide-white/10">
          {[
            { label: 'Total Events', value: loading ? '...' : upcomingEvents.length + pastEvents.length },
            { label: 'Upcoming', value: loading ? '...' : upcomingEvents.length },
            { label: 'Past', value: loading ? '...' : pastEvents.length },
          ].map(({ label, value }) => (
            <div key={label} className="text-center px-4"><div className="text-2xl font-extrabold">{value}</div><div className="text-xs opacity-70 mt-1">{label}</div></div>
          ))}
        </div>
      </section> */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex gap-2 mb-8">
          {(['all', 'upcoming', 'past'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} className={`px-5 py-2 rounded-xl font-semibold text-sm transition-colors ${tab === t ? 'bg-[#2F5BEA] text-white shadow-sm' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'}`}>
              {t === 'all' ? 'All Events' : t === 'upcoming' ? `Upcoming (${upcomingEvents.length})` : `Past (${pastEvents.length})`}
            </button>
          ))}
        </div>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} />)}</div>
        ) : displayed.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{displayed.map(event => <EventCard key={event.id} event={event} onClick={() => navigate(`/events/${event.slug}`)} />)}</div>
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100"><Calendar className="w-12 h-12 text-gray-200 mx-auto mb-3" /><p className="text-gray-400 font-medium">No events found</p></div>
        )}
      </section>
      <section className="bg-[#1F2A44] py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <span className="text-xs font-bold tracking-widest uppercase text-[#F39C12] mb-4 block">Get Involved</span>
          <h2 className="text-3xl font-bold text-white mb-4">Have an Idea?</h2>
          <p className="text-gray-400 mb-8">Have ideas for events or want to get involved? We would love to hear from you!</p>
          <Link to="/contact" className="inline-flex items-center gap-2 bg-[#F39C12] hover:bg-[#E67E22] text-white px-8 py-3.5 rounded-xl font-semibold transition-colors">Contact Us <ArrowRight className="w-4 h-4" /></Link>
        </div>
      </section>
    </div>
  );
}