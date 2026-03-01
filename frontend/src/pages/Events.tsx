// src/pages/Events.tsx
import { useEffect, useState } from 'react';
import { Calendar, MapPin, Users } from 'lucide-react';
import { api, Event, imageUrl } from '../lib/api';

export default function Events() {
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

  const displayed = tab === 'upcoming' ? upcomingEvents : tab === 'past' ? pastEvents : [...upcomingEvents, ...pastEvents];

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
              className={`px-4 py-2 rounded-lg font-medium capitalize transition-colors ${tab === t ? 'bg-[#2F5BEA] text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}>
              {t === 'all' ? 'All Events' : t === 'upcoming' ? `Upcoming (${upcomingEvents.length})` : `Past (${pastEvents.length})`}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-[#2F5BEA] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : displayed.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayed.map(event => <EventCard key={event.id} event={event} />)}
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

function EventCard({ event }: { event: Event }) {
  const eventDate = new Date(event.event_date);
  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow">
      {imageUrl(event.banner_image) && (
        <img src={imageUrl(event.banner_image)!} alt={event.title} className="w-full h-48 object-cover" />
      )}
      <div className="p-6">
        <div className="flex items-center justify-between mb-3">
          <span className={`text-xs px-3 py-1 rounded-full font-medium ${event.is_upcoming ? 'bg-[#2ECC71] text-white' : 'bg-gray-200 text-gray-600'}`}>
            {event.is_upcoming ? 'Upcoming' : 'Past'}
          </span>
        </div>
        <h3 className="text-xl font-semibold text-[#1F2A44] mb-2">{event.title}</h3>
        {event.description && <p className="text-gray-600 mb-4 line-clamp-3">{event.description}</p>}
        <div className="space-y-1 text-sm text-gray-500">
          <div className="flex items-center">
            <Calendar className="w-4 h-4 mr-2" />
            {eventDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
          {event.location && (
            <div className="flex items-center">
              <MapPin className="w-4 h-4 mr-2" />
              {event.location}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
