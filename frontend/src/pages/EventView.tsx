// src/pages/EventView.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin } from 'lucide-react';
import { api, Event, imageUrl } from '../lib/api';

export default function EventView() {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const [event, setEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!slug) return;
        api.getEventBySlug(slug)
            .then(res => setEvent(res.data))
            .catch(() => navigate('/events'))
            .finally(() => setLoading(false));
    }, [slug]);

    if (loading) return (
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
            <div className="inline-block w-8 h-8 border-4 border-[#2F5BEA] border-t-transparent rounded-full animate-spin" />
        </div>
    );

    if (!event) return null;

    const eventDate = new Date(event.event_date);
    const imgSrc = imageUrl(event.banner_image);

    return (
        <div className="min-h-[calc(100vh-4rem)] py-8 px-4 bg-[#F5F7FA]">
            <div className="max-w-4xl mx-auto">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center text-gray-600 hover:text-[#2F5BEA] mb-6 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Back to Events
                </button>

                <article className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
                    {imgSrc ? (
                        <div className="relative">
                            <img src={imgSrc} alt={event.title} className="w-full h-80 object-cover" />
                            <div className="absolute top-4 left-4">
                                <span className={`text-xs px-3 py-1.5 rounded-full font-semibold shadow ${event.is_upcoming ? 'bg-[#2ECC71] text-white' : 'bg-gray-800/80 text-white'
                                    }`}>
                                    {event.is_upcoming ? '● Upcoming' : 'Past Event'}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className="w-full h-40 bg-gradient-to-r from-[#1F2A44] to-[#2F5BEA] flex items-end p-5">
                            <span className={`text-xs px-3 py-1.5 rounded-full font-semibold ${event.is_upcoming ? 'bg-[#2ECC71] text-white' : 'bg-white/20 text-white'
                                }`}>
                                {event.is_upcoming ? '● Upcoming' : 'Past Event'}
                            </span>
                        </div>
                    )}

                    <div className="p-8">
                        <h1 className="text-3xl font-bold text-[#1F2A44] mb-6 leading-tight">{event.title}</h1>

                        <div className="flex flex-wrap gap-5 mb-8 pb-6 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[#F5F7FA] flex items-center justify-center flex-shrink-0">
                                    <Calendar className="w-5 h-5 text-[#2F5BEA]" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Date</p>
                                    <p className="text-sm font-semibold text-[#1F2A44]">
                                        {eventDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                    </p>
                                </div>
                            </div>

                            {event.location && (
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-[#F5F7FA] flex items-center justify-center flex-shrink-0">
                                        <MapPin className="w-5 h-5 text-[#E74C3C]" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Location</p>
                                        <p className="text-sm font-semibold text-[#1F2A44]">{event.location}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {event.description && (
                            <div>
                                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">About this Event</h2>
                                <div className="text-gray-700 leading-relaxed whitespace-pre-wrap text-base">
                                    {event.description}
                                </div>
                            </div>
                        )}
                    </div>
                </article>
            </div>
        </div>
    );
}