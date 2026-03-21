// src/components/FeatureCard.tsx
import { useEffect, useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Quote, MessageSquare } from 'lucide-react';
import { imageUrl, api, Member, Speech } from '../lib/api';


// ─── Feature Card ──────────────────────────────────────────────────────────
export function FeatureCard({ speeches }: { speeches: Speech[] }) {
    const [current, setCurrent] = useState(0);
    const [dragging, setDragging] = useState(false);
    const [dragStartX, setDragStartX] = useState(0);
    const [dragDelta, setDragDelta] = useState(0);
    const [paused, setPaused] = useState(false);
    const trackRef = useRef<HTMLDivElement>(null);
    const autoRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const [memberPhotos, setMemberPhotos] = useState<Record<string, string | null>>({});
    const [loadingPhotos, setLoadingPhotos] = useState(false);

    // Fetch member photos for speeches
    useEffect(() => {
        const fetchMemberPhotos = async () => {
            if (speeches.length === 0) return;
            setLoadingPhotos(true);
            try {
                // Get all members
                const res = await api.getMembers({ limit: 10000 });
                const members = res.data as (Member & { photo_url?: string | null })[];

                // Create map of email -> photo_url
                const photoMap: Record<string, string | null> = {};
                members.forEach(member => {
                    photoMap[member.email.toLowerCase()] = member.photo_url || null;
                });

                setMemberPhotos(photoMap);
            } catch (err) {
                console.error('Failed to fetch member photos:', err);
            } finally {
                setLoadingPhotos(false);
            }
        };

        fetchMemberPhotos();
    }, [speeches]);

    // How many cards visible at once depending on viewport
    const [perView, setPerView] = useState(3);
    useEffect(() => {
        const update = () => {
            if (window.innerWidth < 640) setPerView(1);
            else if (window.innerWidth < 1024) setPerView(2);
            else setPerView(3);
        };
        update();
        window.addEventListener('resize', update);
        return () => window.removeEventListener('resize', update);
    }, []);

    const total = speeches.length;
    const maxIndex = Math.max(0, total - perView);

    const go = useCallback((idx: number) => {
        setCurrent(Math.max(0, Math.min(idx, maxIndex)));
    }, [maxIndex]);

    const prev = useCallback(() => go(current - 1), [current, go]);
    const next = useCallback(() => go(current < maxIndex ? current + 1 : 0), [current, maxIndex, go]);

    // Auto-advance
    useEffect(() => {
        if (paused || total <= perView) return;
        autoRef.current = setInterval(() => {
            setCurrent(c => (c < maxIndex ? c + 1 : 0));
        }, 4000);
        return () => { if (autoRef.current) clearInterval(autoRef.current); };
    }, [paused, total, perView, maxIndex]);

    // Drag/swipe handlers
    const onDragStart = (clientX: number) => {
        setDragging(true);
        setDragStartX(clientX);
        setDragDelta(0);
        setPaused(true);
    };
    const onDragMove = (clientX: number) => {
        if (!dragging) return;
        setDragDelta(clientX - dragStartX);
    };
    const onDragEnd = () => {
        if (!dragging) return;
        setDragging(false);
        if (dragDelta < -60) next();
        else if (dragDelta > 60) prev();
        setDragDelta(0);
        setTimeout(() => setPaused(false), 800);
    };

    // Card width percent
    const cardPct = 100 / perView;
    const translateX = -(current * cardPct) + (dragging ? (dragDelta / (trackRef.current?.offsetWidth || 1)) * 100 : 0);

    return (
        <section
            className="bg-[#1F2A44] py-20 px-4 overflow-hidden relative select-none"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => { setPaused(false); if (dragging) onDragEnd(); }}
        >
            {/* Decorative blobs */}
            <div className="absolute top-0 left-0 w-72 h-72 bg-[#2F5BEA]/10 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#F39C12]/5 rounded-full translate-x-1/3 translate-y-1/3 pointer-events-none" />

            <div className="max-w-7xl mx-auto relative">
                {/* Header */}
                <div className="flex items-end justify-between mb-10 gap-4 flex-wrap">
                    <div>
                        <span className="text-xs font-bold tracking-widest uppercase text-[#F39C12] mb-3 block">From Our Community</span>
                        <h2 className="text-3xl md:text-4xl font-bold text-white">What People Say</h2>
                    </div>
                    {/* Prev / Next arrows */}
                    {total > perView && (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={prev}
                                disabled={current === 0}
                                className="w-10 h-10 rounded-xl border border-white/20 flex items-center justify-center text-white/60 hover:text-white hover:border-white/50 hover:bg-white/10 transition-all disabled:opacity-25 disabled:cursor-not-allowed"
                                aria-label="Previous"
                            >
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6" /></svg>
                            </button>
                            <button
                                onClick={next}
                                disabled={current === maxIndex}
                                className="w-10 h-10 rounded-xl border border-white/20 flex items-center justify-center text-white/60 hover:text-white hover:border-white/50 hover:bg-white/10 transition-all disabled:opacity-25 disabled:cursor-not-allowed"
                                aria-label="Next"
                            >
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6" /></svg>
                            </button>
                        </div>
                    )}
                </div>

                {/* Track */}
                <div
                    ref={trackRef}
                    className="overflow-hidden cursor-grab active:cursor-grabbing"
                    onMouseDown={e => onDragStart(e.clientX)}
                    onMouseMove={e => onDragMove(e.clientX)}
                    onMouseUp={onDragEnd}
                    onTouchStart={e => onDragStart(e.touches[0].clientX)}
                    onTouchMove={e => onDragMove(e.touches[0].clientX)}
                    onTouchEnd={onDragEnd}
                >
                    <div
                        className="flex"
                        style={{
                            transform: `translateX(${translateX}%)`,
                            transition: dragging ? 'none' : 'transform 0.45s cubic-bezier(0.25,0.46,0.45,0.94)',
                        }}
                    >
                        {speeches.map((speech, i) => {
                            const memberPhoto = memberPhotos[speech.email.toLowerCase()];
                            const photoSrc = memberPhoto ? imageUrl(memberPhoto) : null;
                            return (
                                <div
                                    key={speech.id}
                                    className="flex-shrink-0 px-3"
                                    style={{ width: `${cardPct}%` }}
                                >
                                    <div className="relative bg-white/5 border border-white/10 rounded-2xl p-6 h-full flex flex-col hover:bg-white/8 hover:border-white/20 transition-all">
                                        {/* Quote icon */}
                                        <div className="w-10 h-10 rounded-xl bg-[#F39C12]/20 flex items-center justify-center mb-4 flex-shrink-0">
                                            <Quote className="w-5 h-5 text-[#F39C12]" />
                                        </div>
                                        {/* Message */}
                                        <p className="text-gray-300 text-sm leading-relaxed mb-6 italic flex-1">
                                            &ldquo;{speech.message}&rdquo;
                                        </p>
                                        {/* Author */}
                                        <div className="flex items-end gap-4 pt-4 border-t border-white/10 mt-auto">
                                            {photoSrc ? (
                                                <img src={photoSrc} alt={speech.name} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                                            ) : (
                                                <div className="w-14 h-14 rounded-xl bg-[#2F5BEA] flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                                                    {speech.name.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-white font-semibold text-sm leading-none truncate">{speech.name}</p>
                                                {speech.designation && (
                                                    <p className="text-gray-400 text-xs mt-1 truncate">{speech.designation}</p>
                                                )}
                                                {speech.batch && (
                                                    <p className="text-[#F39C12] text-xs font-semibold mt-0.5">Batch {speech.batch}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Dot indicators */}
                {total > perView && (
                    <div className="flex items-center justify-center gap-2 mt-8">
                        {Array.from({ length: maxIndex + 1 }).map((_, i) => (
                            <button
                                key={i}
                                onClick={() => { go(i); setPaused(true); setTimeout(() => setPaused(false), 2000); }}
                                className={`rounded-full transition-all duration-300 ${i === current
                                    ? 'w-6 h-2 bg-[#F39C12]'
                                    : 'w-2 h-2 bg-white/25 hover:bg-white/50'
                                    }`}
                                aria-label={`Go to slide ${i + 1}`}
                            />
                        ))}
                    </div>
                )}
                {/* ── CTA: Give Feedback ── */}
                <div className="mt-12 flex flex-col items-center gap-4 text-center">
                    <p className="text-gray-400 text-sm max-w-md">
                        Have something to share? We'd love to hear your thoughts, suggestions, or feedback.
                    </p>
                    <Link
                        to="/contact"
                        className="inline-flex items-center gap-2.5 bg-[#F39C12] hover:bg-[#E67E22] text-white px-7 py-3 rounded-xl font-semibold text-sm transition-all shadow-lg shadow-[#F39C12]/20 hover:shadow-[#F39C12]/30 hover:-translate-y-0.5 active:translate-y-0"
                    >
                        <MessageSquare className="w-4 h-4" />
                        Share Your Feedback
                    </Link>
                </div>
            </div>
        </section>
    );
}