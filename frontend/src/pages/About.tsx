// src/pages/About.tsx
import { useEffect, useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Users, Target, Award, Utensils, Trophy, GraduationCap, Handshake, Quote, MessageSquare } from 'lucide-react';
import { speechApi, Speech } from '../lib/api';


// ─── Speech Carousel ──────────────────────────────────────────────────────────
function SpeechCarousel({ speeches }: { speeches: Speech[] }) {
  const [current, setCurrent] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragDelta, setDragDelta] = useState(0);
  const [paused, setPaused] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
            <h2 className="text-3xl md:text-4xl font-bold text-white">What Others Say</h2>
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
            {speeches.map((speech, i) => (
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
                  <div className="flex items-center gap-3 pt-4 border-t border-white/10 mt-auto">
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
              </div>
            ))}
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

export default function About() {
  const [speeches, setSpeeches] = useState<Speech[]>([]);
  useEffect(() => {
    speechApi.getAll().then(res => setSpeeches(res.data)).catch(() => { });
  }, []);
  return (
    <div className="bg-[#F5F7FA]">
      <section className="relative bg-[#1F2A44] text-white overflow-hidden">
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div className="absolute top-0 left-0 w-96 h-96 bg-[#2F5BEA] rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-[#F39C12] rounded-full translate-x-1/2 translate-y-1/2" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 py-20 text-center">
          <div className="inline-block bg-[#2F5BEA]/20 border border-[#2F5BEA]/30 text-[#7BA3F5] text-xs font-bold tracking-widest uppercase px-4 py-1.5 rounded-full mb-5">ISRT · University of Dhaka</div>
          <h1 className="text-5xl md:text-6xl font-extrabold mb-4 tracking-tight">About STATA</h1>
          <p className="text-gray-300 text-lg max-w-xl mx-auto">Student Welfare Organization of ISRT, University of Dhaka</p>
        </div>
      </section>
      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-xs font-bold tracking-widest uppercase text-[#2F5BEA] mb-3 block">Who We Are</span>
            <h2 className="text-3xl md:text-4xl font-bold text-[#1F2A44] mb-5 leading-tight">More Than Just a Student Organization</h2>
            <p className="text-gray-500 mb-4 leading-relaxed">At the Institute of Statistical Research and Training (ISRT), we know that numbers tell a story, but they aren't the whole story. While we strive for academic excellence at the University of Dhaka, STATA (the ISRT Student Welfare Organization) ensures that the heart of our community beats just as strong as our data. We are more than a student body. We are a dedicated support system built by students, for students.</p>
            <h3 className="text-2xl md:text-2xl font-bold text-[#1F2A44] mb-2 leading-tight">Join the Pulse of ISRT</h3>
            <p className="text-gray-500 leading-relaxed">Whether you are looking for a mentor, a friend, or a platform to give back, STATA is your home on campus. Together, we are building a legacy of support, resilience, and connection.</p>
          </div>
          <div className="bg-gradient-to-br from-[#2F5BEA] to-[#1F2A44] rounded-2xl p-8 text-white shadow-xl">
            <div className="text-5xl mb-4 opacity-20 font-serif leading-none">"</div>
            <blockquote className="text-xl font-medium leading-relaxed mb-5">Connecting Minds, Building Bonds, Nourishing Well-being.</blockquote>
            <p className="text-blue-200 text-sm">At STATA, we don't just calculate averages. We ensure everyone feels above average.</p>
          </div>
        </div>
      </section>
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-xs font-bold tracking-widest uppercase text-[#2F5BEA] mb-3 block">What Drives Us</span>
            <h2 className="text-3xl md:text-4xl font-bold text-[#1F2A44]">Our Core Values</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { icon: Target, color: 'bg-[#2F5BEA]', title: 'Our Vision', desc: 'To create a supportive ecosystem where every ISRT student thrives academically, socially, and emotionally.' },
              { icon: Heart, color: 'bg-[#2ECC71]', title: 'Mental Health', desc: 'Prioritizing student well-being through activities that reduce stress and promote positive mental health.' },
              { icon: Users, color: 'bg-[#F39C12]', title: 'Community', desc: 'Building lasting friendships and professional networks that extend beyond university years.' },
              { icon: Award, color: 'bg-[#E74C3C]', title: 'Excellence', desc: 'Striving for excellence in all activities while maintaining an inclusive and welcoming environment.' },
            ].map(({ icon: Icon, color, title, desc }) => (
              <div key={title} className="bg-[#F5F7FA] p-6 rounded-2xl border border-gray-100 hover:shadow-md transition-shadow">
                <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center mb-4`}><Icon className="w-6 h-6 text-white" /></div>
                <h3 className="text-lg font-bold text-[#1F2A44] mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <span className="text-xs font-bold tracking-widest uppercase text-[#2F5BEA] mb-3 block">Activities</span>
          <h2 className="text-3xl md:text-4xl font-bold text-[#1F2A44]">What We Do</h2>
          <p className="text-gray-500 mt-3 max-w-xl mx-auto">From social gatherings to sporting events, we bring students together in meaningful ways</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { icon: Utensils, color: 'bg-[#F39C12]', title: 'Social Events', items: ['BBQ parties bringing students together in a relaxed atmosphere', 'Iftar Mahfil during Ramadan for community bonding', 'Khashi party on graduation to share the joy', 'Educational tours to explore and learn together'] },
            { icon: Trophy, color: 'bg-[#E74C3C]', title: 'Sports & Recreation', items: ['Annual cricket tournaments for sports enthusiasts', 'Football tournaments promoting teamwork and fitness', 'Regular recreational activities and games', 'Collaborative events with other university organizations'] },
          ].map(({ icon: Icon, color, title, items }) => (
            <div key={title} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className={`${color} px-6 py-4 flex items-center gap-3`}><Icon className="w-5 h-5 text-white" /><h3 className="font-bold text-white text-lg">{title}</h3></div>
              <ul className="p-6 space-y-3">{items.map((item, i) => (<li key={i} className="flex items-start gap-3 text-gray-500 text-sm"><span className="w-5 h-5 rounded-full bg-[#F5F7FA] flex items-center justify-center flex-shrink-0 mt-0.5"><span className="w-1.5 h-1.5 rounded-full bg-[#F39C12]" /></span>{item}</li>))}</ul>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[#1F2A44] py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs font-bold tracking-widest uppercase text-[#F39C12] mb-3 block">Alumni Network</span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Alumni Bridge</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">STATA serves as a bridge between current students and alumni, facilitating networking, mentorship, and knowledge-sharing.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: GraduationCap, title: 'Mentorship', desc: 'Connect with experienced alumni who provide guidance on academics, career paths, and life after university.' },
              { icon: Handshake, title: 'Networking', desc: 'Build professional relationships that open doors to internships, jobs, and collaborative opportunities.' },
              { icon: Users, title: 'Knowledge Sharing', desc: 'Learn from alumni through talks, workshops, and informal discussions about various fields.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors">
                <Icon className="w-8 h-8 text-[#F39C12] mb-4" />
                <h3 className="font-bold text-white text-lg mb-2">{title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* ── Speeches Carousel ── */}
      <SpeechCarousel speeches={speeches} />
    </div>
  );
}