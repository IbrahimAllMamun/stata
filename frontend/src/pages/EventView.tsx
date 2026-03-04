// src/pages/EventView.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin } from 'lucide-react';
import { api, Event, imageUrl } from '../lib/api';
export default function EventView() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!slug) return;
    api.getEventBySlug(slug).then(res => setEvent(res.data)).catch(() => navigate('/events')).finally(() => setLoading(false));
  }, [slug]);
  if (loading) return (<div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-[#F5F7FA]"><div className="w-8 h-8 border-4 border-[#2F5BEA] border-t-transparent rounded-full animate-spin" /></div>);
  if (!event) return null;
  const img = imageUrl(event.banner_image);
  const date = new Date(event.event_date);
  return (
    <div className="bg-[#F5F7FA] min-h-[calc(100vh-4rem)] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-[#2F5BEA] mb-6 text-sm font-medium transition-colors group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" /> Back to Events
        </button>
        <article className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {img ? (
            <div className="relative">
              <img src={img} alt={event.title} className="w-full h-80 object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-5 left-6">
                <span className={`text-xs px-3 py-1.5 rounded-full font-bold ${event.is_upcoming ? 'bg-[#2ECC71] text-white' : 'bg-white/20 backdrop-blur text-white border border-white/30'}`}>{event.is_upcoming ? '● Upcoming' : 'Past Event'}</span>
              </div>
            </div>
          ) : (
            <div className="h-40 bg-gradient-to-r from-[#1F2A44] to-[#2F5BEA] flex items-end p-6">
              <span className={`text-xs px-3 py-1.5 rounded-full font-bold ${event.is_upcoming ? 'bg-[#2ECC71] text-white' : 'bg-white/20 text-white'}`}>{event.is_upcoming ? '● Upcoming' : 'Past Event'}</span>
            </div>
          )}
          <div className="p-8">
            <h1 className="text-3xl md:text-4xl font-extrabold text-[#1F2A44] mb-6 leading-tight">{event.title}</h1>
            <div className="flex flex-wrap gap-4 mb-8 pb-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#F5F7FA] flex items-center justify-center"><Calendar className="w-5 h-5 text-[#2F5BEA]" /></div>
                <div><p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Date</p><p className="text-sm font-semibold text-[#1F2A44]">{date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p></div>
              </div>
              {event.location && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#F5F7FA] flex items-center justify-center"><MapPin className="w-5 h-5 text-[#E74C3C]" /></div>
                  <div><p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Location</p><p className="text-sm font-semibold text-[#1F2A44]">{event.location}</p></div>
                </div>
              )}
            </div>
            {event.description && (<div><h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">About This Event</h2><div className="text-gray-600 leading-relaxed whitespace-pre-wrap text-base">{event.description}</div></div>)}
          </div>
        </article>
        <div className="mt-6 text-center"><Link to="/events" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#2F5BEA] font-medium transition-colors"><ArrowLeft className="w-4 h-4" /> View all events</Link></div>
      </div>
    </div>
  );
}
