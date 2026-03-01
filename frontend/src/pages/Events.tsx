// src/pages/Events.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Users, ArrowRight } from 'lucide-react';
import { api, Event, imageUrl } from '../lib/api';

function EventCard({ event, onClick }: { event: Event; onClick: () => void }) {
  const eventDate = new Date(event.event_date);
  const imgSrc = imageUrl(event.banner_image);

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer group"
    >
      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-[#1F2A44] to-[#2F5BEA]">
        {imgSrc && (
          <img src={imgSrc} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        )}
        <div className="absolute top-3 left-3">
          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold shadow-sm ${event.is_upcoming ? 'bg-[#2ECC71] text-white' : 'bg-gray-800/70 text-white'
            }`}>
            {event.is_upcoming ? '● Upcoming' : 'Past'}
          </span>
        </div>
      </div>

      <div className="p-5">
        <h3 className="text-lg font-bold text-[#1F2A44] mb-3 line-clamp-2 group-hover:text-[#2F5BEA] transition-colors">
          {event.title}
        </h3>
        {event.description && (
          <p className="text-gray-500 text-sm mb-4 line-clamp-2">{event.description}</p>
        )}
        <div className="space-y-1.5 text-sm text-gray-500 mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#2F5BEA] flex-shrink-0" />
            <span>{eventDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
          </div>
          {event.location && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#E74C3C] flex-shrink-0" />
              <span className="truncate">{event.location}</span>
            </div>
          )}
        </div>
        <div className="pt-3 border-t border-gray-100 flex items-center justify-end">
          <span className="text-[#2F5BEA] group-hover:text-[#F39C12] font-medium text-sm flex items-center gap-1 transition-colors">
            See Details <ArrowRight className="w-4 h-4" />
          </span>
        </div>
      </div>
    </div>
  );
}

export default function Events() {
  const navigate = useNavigate();
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [pastEvents, setPastEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'upcoming' | 'past' | 'all'>('all');

  useEffect(() => {
    Promise.all([api.getEvents('upcoming'), api.getEvents('past')])
      .then(([upcoming, past]) => {
        setUpcomingEvents(upcoming.data);
        setPastEvents(past.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const displayed =
    tab === 'upcoming' ? upcomingEvents :
      tab === 'past' ? pastEvents :
        [...upcomingEvents, ...pastEvents];

  return (
    <div>
      <section className="bg-gradient-to-r from-[#1F2A44] to-[#2F5BEA] text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Events & Activities</h1>
          <p className="text-lg md:text-xl text-gray-200">Join us in creating memorable experiences and building lasting friendships</p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="flex gap-3 mb-8">
          {(['all', 'upcoming', 'past'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${tab === t ? 'bg-[#2F5BEA] text-white shadow-sm' : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}>
              {t === 'all' ? 'All Events' : t === 'upcoming' ? `Upcoming (${upcomingEvents.length})` : `Past (${pastEvents.length})`}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-[#2F5BEA] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : displayed.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayed.map(event => (
              <EventCard key={event.id} event={event} onClick={() => navigate(`/events/${event.slug}`)} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No events found.</p>
          </div>
        )}
      </section>

      <section className="bg-gradient-to-r from-[#2ECC71] to-[#2F5BEA] py-16 px-4">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Want to Organize an Event?</h2>
          <p className="text-lg mb-8">If you have ideas for events or want to get involved, we'd love to hear from you!</p>
          <a href="/contact" className="bg-white text-[#2F5BEA] px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-block">Contact Us</a>
        </div>
      </section>
    </div>
  );
}