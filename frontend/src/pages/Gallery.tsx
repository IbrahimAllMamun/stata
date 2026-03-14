// src/pages/Gallery.tsx
import { useEffect, useState, useCallback, useRef } from 'react';
import { Camera, X, ChevronLeft, ChevronRight, CalendarDays, Filter, Images, Tag, ChevronDown } from 'lucide-react';
import { api, GalleryGroup, GalleryDateEntry, GalleryPhoto, imageUrl } from '../lib/api';

interface LightboxState {
  photos: GalleryPhoto[];
  index: number;
  subject: string;
  date: string;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

export default function Gallery() {
  const [groups, setGroups] = useState<GalleryGroup[]>([]);
  const [allDates, setAllDates] = useState<GalleryDateEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState<LightboxState | null>(null);

  // Filter state
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  // Sidebar: expanded dates
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());

  const fetchGallery = useCallback((from?: string, to?: string, subject?: string) => {
    setLoading(true);
    api.getGallery({ from, to, subject })
      .then(res => setGroups(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchGallery();
    api.getGalleryDates().then(res => setAllDates(res.data)).catch(() => { });
  }, []);

  // Close filter dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!lightbox) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(null);
      if (e.key === 'ArrowRight') navigateLightbox(1);
      if (e.key === 'ArrowLeft') navigateLightbox(-1);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightbox]);

  const navigateLightbox = useCallback((dir: number) => {
    setLightbox(prev => {
      if (!prev) return prev;
      const newIdx = prev.index + dir;
      if (newIdx < 0 || newIdx >= prev.photos.length) return prev;
      return { ...prev, index: newIdx };
    });
  }, []);

  // Touch swipe for lightbox
  const touchStartX = useRef<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) navigateLightbox(diff > 0 ? 1 : -1);
    touchStartX.current = null;
  };

  const applyFilter = () => {
    setActiveFilter(!!(filterFrom || filterTo || filterSubject));
    fetchGallery(filterFrom || undefined, filterTo || undefined, filterSubject || undefined);
    setFilterOpen(false);
  };

  const clearFilter = () => {
    setFilterFrom(''); setFilterTo(''); setFilterSubject('');
    setActiveFilter(false);
    fetchGallery();
    setFilterOpen(false);
  };

  const toggleDate = (date: string) => {
    setExpandedDates(prev => {
      const s = new Set(prev);
      s.has(date) ? s.delete(date) : s.add(date);
      return s;
    });
  };

  const totalPhotos = groups.reduce((s, g) => s + g.subjects.reduce((ss, sub) => ss + sub.photos.length, 0), 0);

  // Group dates by month for sidebar
  const datesByMonth: Record<string, GalleryDateEntry[]> = {};
  for (const entry of allDates) {
    const m = entry.date.slice(0, 7);
    if (!datesByMonth[m]) datesByMonth[m] = [];
    datesByMonth[m].push(entry);
  }

  const currentPhoto = lightbox ? lightbox.photos[lightbox.index] : null;

  return (
    <div className="min-h-screen bg-[#F5F7FA]">

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative bg-[#1F2A44] text-white overflow-hidden">
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div className="absolute top-0 left-0 w-96 h-96 bg-[#2F5BEA] rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-[#F39C12] rounded-full translate-x-1/2 translate-y-1/2" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 py-20 text-center">
          <div className="inline-flex items-center gap-2 bg-[#2F5BEA]/20 border border-[#2F5BEA]/30 text-[#7BA3F5] text-xs font-bold tracking-widest uppercase px-4 py-1.5 rounded-full mb-5">
            <Camera className="w-3.5 h-3.5" /> Memories
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold mb-4 tracking-tight">Gallery</h1>
          <p className="text-gray-300 text-lg max-w-xl mx-auto">A timeline of our shared moments and memories</p>
          {!loading && (
            <div className="mt-6 inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-2 text-sm text-white/70">
              <Images className="w-4 h-4" />
              {totalPhotos} photos across {groups.length} day{groups.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </section>

      {/* ── Main layout ─────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 py-10 flex gap-8">

        {/* ── Sidebar timeline ──────────────────────────────────────── */}
        {allDates.length > 0 && (
          <aside className="hidden lg:block w-56 flex-shrink-0">
            <div className="sticky top-24 bg-white rounded-2xl border border-gray-100 shadow-sm p-4 max-h-[calc(100vh-8rem)] overflow-y-auto">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 px-1">Timeline</p>
              <div className="space-y-4">
                {Object.entries(datesByMonth).map(([month, entries]) => (
                  <div key={month}>
                    <p className="text-xs font-semibold text-[#2F5BEA] mb-1.5 px-1">
                      {new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </p>
                    <div className="space-y-0.5">
                      {entries.map(entry => (
                        <div key={entry.date}>
                          {/* Date row — clickable to expand/collapse subjects */}
                          <button
                            onClick={() => toggleDate(entry.date)}
                            className="w-full flex items-center justify-between text-xs text-gray-500 hover:text-[#1F2A44] hover:bg-gray-50 rounded-lg px-2 py-1.5 transition-colors group"
                          >
                            <a
                              href={`#date-${entry.date}`}
                              onClick={e => e.stopPropagation()}
                              className="hover:text-[#2F5BEA]"
                            >
                              {new Date(entry.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </a>
                            {entry.subjects.length > 0 && (
                              <ChevronDown className={`w-3 h-3 transition-transform ${expandedDates.has(entry.date) ? 'rotate-180' : ''}`} />
                            )}
                          </button>
                          {/* Subjects for this date */}
                          {expandedDates.has(entry.date) && entry.subjects.length > 0 && (
                            <div className="ml-3 mt-0.5 space-y-0.5 border-l-2 border-gray-100 pl-2">
                              {entry.subjects.map(sub => (
                                <a
                                  key={sub}
                                  href={`#subject-${entry.date}-${sub.replace(/\s+/g, '-')}`}
                                  className="block text-xs text-gray-400 hover:text-[#2F5BEA] py-1 truncate transition-colors"
                                  title={sub}
                                >
                                  {sub}
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        )}

        {/* ── Content ───────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0">

          {/* Filter bar */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest">
              {activeFilter ? 'Filtered results' : 'All moments'}
            </h2>
            <div className="relative" ref={filterRef}>
              <button
                onClick={() => setFilterOpen(o => !o)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${activeFilter
                  ? 'bg-[#2F5BEA] text-white border-[#2F5BEA]'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-[#2F5BEA]'
                  }`}
              >
                <Filter className="w-3.5 h-3.5" />
                {activeFilter ? 'Filtered' : 'Filter'}
              </button>
              {filterOpen && (
                <div className="absolute right-0 top-11 z-30 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 w-72">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Filter photos</p>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">From date</label>
                      <input type="date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#2F5BEA] focus:border-transparent outline-none" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">To date</label>
                      <input type="date" value={filterTo} onChange={e => setFilterTo(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#2F5BEA] focus:border-transparent outline-none" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">Subject</label>
                      <input
                        type="text"
                        placeholder="e.g. Annual Picnic"
                        value={filterSubject}
                        onChange={e => setFilterSubject(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#2F5BEA] focus:border-transparent outline-none"
                      />
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button onClick={applyFilter}
                        className="flex-1 bg-[#2F5BEA] text-white py-2 rounded-xl text-sm font-semibold hover:bg-[#1a3fc7] transition-colors">
                        Apply
                      </button>
                      {activeFilter && (
                        <button onClick={clearFilter}
                          className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Gallery content */}
          {loading ? (
            <div className="space-y-10">
              {[...Array(2)].map((_, gi) => (
                <div key={gi}>
                  <div className="h-5 bg-gray-200 rounded-lg w-48 mb-4 animate-pulse" />
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="aspect-square bg-gray-200 rounded-2xl animate-pulse" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : groups.length === 0 ? (
            <div className="text-center py-24 bg-white rounded-2xl border border-gray-100">
              <Camera className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 font-semibold">No photos yet</p>
              <p className="text-gray-400 text-sm mt-1">
                {activeFilter ? 'No photos found with these filters.' : 'Check back soon for memories from our events!'}
              </p>
              {activeFilter && (
                <button onClick={clearFilter} className="mt-4 text-[#2F5BEA] text-sm font-semibold hover:underline">
                  Clear filter
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-14">
              {groups.map((group) => (
                <section key={group.date} id={`date-${group.date}`} className="scroll-mt-24">
                  {/* Date header */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#1F2A44] rounded-xl flex items-center justify-center flex-shrink-0">
                        <CalendarDays className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-[#1F2A44] leading-tight">{formatDate(group.date)}</p>
                        <p className="text-xs text-gray-400">
                          {group.subjects.reduce((s, sub) => s + sub.photos.length, 0)} photos
                        </p>
                      </div>
                    </div>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>

                  {/* Subject groups */}
                  <div className="space-y-8">
                    {group.subjects.map((subGroup) => (
                      <div key={subGroup.subject} id={`subject-${group.date}-${subGroup.subject.replace(/\s+/g, '-')}`} className="scroll-mt-24">
                        {/* Subject label */}
                        <div className="flex items-center gap-2 mb-3">
                          <div className="flex items-center gap-1.5 bg-[#2F5BEA]/10 text-[#2F5BEA] text-xs font-semibold px-3 py-1.5 rounded-full">
                            <Tag className="w-3 h-3" />
                            {subGroup.subject}
                          </div>
                          <span className="text-xs text-gray-400">{subGroup.photos.length} photo{subGroup.photos.length !== 1 ? 's' : ''}</span>
                        </div>

                        {/* Photo grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                          {subGroup.photos.map((photo, idx) => (
                            <button
                              key={photo.id}
                              onClick={() => setLightbox({ photos: subGroup.photos, index: idx, subject: subGroup.subject, date: group.date })}
                              className="aspect-square bg-gray-100 rounded-2xl overflow-hidden cursor-pointer group relative shadow-sm hover:shadow-lg transition-all hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[#2F5BEA] focus:ring-offset-2"
                            >
                              <img
                                src={imageUrl(photo.image_url)!}
                                alt={subGroup.subject}
                                loading="lazy"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Lightbox / Carousel ──────────────────────────────────────── */}
      {lightbox && currentPhoto && (
        <div
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center"
          onClick={() => setLightbox(null)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Close */}
          <button
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors z-10"
            onClick={() => setLightbox(null)}
          >
            <X className="w-5 h-5 text-white" />
          </button>

          {/* Counter + subject */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 z-10">
            <div className="bg-white/10 text-white/70 text-xs font-medium px-3 py-1.5 rounded-full">
              {lightbox.index + 1} / {lightbox.photos.length}
            </div>
            <div className="flex items-center gap-1.5 bg-[#2F5BEA]/60 text-white text-xs font-semibold px-3 py-1 rounded-full">
              <Tag className="w-3 h-3" />
              {lightbox.subject}
            </div>
          </div>

          {/* Prev */}
          {lightbox.index > 0 && (
            <button
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors z-10"
              onClick={e => { e.stopPropagation(); navigateLightbox(-1); }}
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>
          )}

          {/* Next */}
          {lightbox.index < lightbox.photos.length - 1 && (
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors z-10"
              onClick={e => { e.stopPropagation(); navigateLightbox(1); }}
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </button>
          )}

          {/* Main image */}
          <div className="max-w-5xl w-full px-20" onClick={e => e.stopPropagation()}>
            <img
              key={currentPhoto.id}
              src={imageUrl(currentPhoto.image_url)!}
              alt={lightbox.subject}
              className="w-full max-h-[75vh] object-contain rounded-xl"
            />
            <p className="mt-4 text-center text-white/50 text-xs flex items-center justify-center gap-1.5">
              <CalendarDays className="w-3.5 h-3.5" />
              {formatDate(lightbox.date)}
            </p>
          </div>

          {/* Thumbnail strip */}
          {lightbox.photos.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 px-4 overflow-x-auto max-w-full scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {lightbox.photos.map((p, i) => (
                <button
                  key={p.id}
                  onClick={e => { e.stopPropagation(); setLightbox(prev => prev ? { ...prev, index: i } : prev); }}
                  className={`flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${i === lightbox.index ? 'border-white scale-110' : 'border-transparent opacity-50 hover:opacity-80'}`}
                >
                  <img src={imageUrl(p.image_url)!} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}