// src/pages/Gallery.tsx
import { useEffect, useState, useCallback, useRef } from 'react';
import { Camera, X, ChevronLeft, ChevronRight, CalendarDays, Filter, Images } from 'lucide-react';
import { api, GalleryGroup, imageUrl } from '../lib/api';

interface Photo {
  id: string;
  image_url: string;
  caption?: string | null;
  moment_date: string;
}

interface LightboxState {
  group: GalleryGroup;
  index: number;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function formatDateShort(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatMonthYear(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
}

export default function Gallery() {
  const [groups, setGroups] = useState<GalleryGroup[]>([]);
  const [allDates, setAllDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState<LightboxState | null>(null);
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  const fetchGallery = useCallback((from?: string, to?: string) => {
    setLoading(true);
    api.getGallery({ from, to })
      .then(res => setGroups(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchGallery();
    api.getGalleryDates().then(res => setAllDates(res.data)).catch(() => {});
  }, []);

  // Close filter dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!lightbox) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(null);
      if (e.key === 'ArrowRight') navigate(1);
      if (e.key === 'ArrowLeft') navigate(-1);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightbox]);

  const navigate = useCallback((dir: number) => {
    if (!lightbox) return;
    const newIdx = lightbox.index + dir;
    if (newIdx >= 0 && newIdx < lightbox.group.photos.length) {
      setLightbox({ ...lightbox, index: newIdx });
    }
  }, [lightbox]);

  const applyFilter = () => {
    setActiveFilter(!!(filterFrom || filterTo));
    fetchGallery(filterFrom || undefined, filterTo || undefined);
    setFilterOpen(false);
  };

  const clearFilter = () => {
    setFilterFrom('');
    setFilterTo('');
    setActiveFilter(false);
    fetchGallery();
    setFilterOpen(false);
  };

  const totalPhotos = groups.reduce((s, g) => s + g.photos.length, 0);
  const currentPhoto = lightbox ? lightbox.group.photos[lightbox.index] as Photo : null;

  // Group dates by month for the sidebar timeline
  const datesByMonth: Record<string, string[]> = {};
  for (const d of allDates) {
    const m = d.slice(0, 7);
    if (!datesByMonth[m]) datesByMonth[m] = [];
    datesByMonth[m].push(d);
  }

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
              {totalPhotos} photos across {groups.length} moment{groups.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </section>

      {/* ── Main layout ─────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 py-10 flex gap-8">

        {/* ── Sidebar timeline ──────────────────────────────────────── */}
        {allDates.length > 0 && (
          <aside className="hidden lg:block w-52 flex-shrink-0">
            <div className="sticky top-24 bg-white rounded-2xl border border-gray-100 shadow-sm p-4 max-h-[calc(100vh-8rem)] overflow-y-auto">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 px-1">Timeline</p>
              <div className="space-y-4">
                {Object.entries(datesByMonth).map(([month, dates]) => (
                  <div key={month}>
                    <p className="text-xs font-semibold text-[#2F5BEA] mb-1.5 px-1">
                      {new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </p>
                    <div className="space-y-0.5">
                      {dates.map(date => (
                        <a
                          key={date}
                          href={`#date-${date}`}
                          className="block text-xs text-gray-500 hover:text-[#1F2A44] hover:bg-gray-50 rounded-lg px-2 py-1.5 transition-colors"
                        >
                          {new Date(date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </a>
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
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                  activeFilter
                    ? 'bg-[#2F5BEA] text-white border-[#2F5BEA]'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-[#2F5BEA]'
                }`}
              >
                <Filter className="w-3.5 h-3.5" />
                {activeFilter ? 'Filtered' : 'Filter by date'}
              </button>
              {filterOpen && (
                <div className="absolute right-0 top-11 z-30 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 w-72">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Date range</p>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">From</label>
                      <input type="date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#2F5BEA] focus:border-transparent outline-none" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">To</label>
                      <input type="date" value={filterTo} onChange={e => setFilterTo(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#2F5BEA] focus:border-transparent outline-none" />
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
                {activeFilter ? 'No photos found in this date range.' : 'Check back soon for memories from our events!'}
              </p>
              {activeFilter && (
                <button onClick={clearFilter} className="mt-4 text-[#2F5BEA] text-sm font-semibold hover:underline">
                  Clear filter
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-12">
              {groups.map((group) => (
                <section key={group.date} id={`date-${group.date}`} className="scroll-mt-24">
                  {/* Date header */}
                  <div className="flex items-center gap-4 mb-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#1F2A44] rounded-xl flex items-center justify-center flex-shrink-0">
                        <CalendarDays className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-[#1F2A44] leading-tight">{formatDate(group.date)}</p>
                        <p className="text-xs text-gray-400">{group.photos.length} photo{group.photos.length !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>

                  {/* Photo grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {(group.photos as Photo[]).map((photo, idx) => (
                      <button
                        key={photo.id}
                        onClick={() => setLightbox({ group, index: idx })}
                        className="aspect-square bg-gray-100 rounded-2xl overflow-hidden cursor-pointer group relative shadow-sm hover:shadow-lg transition-all hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[#2F5BEA] focus:ring-offset-2"
                      >
                        <img
                          src={imageUrl(photo.image_url)!}
                          alt={photo.caption || formatDateShort(group.date)}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        {photo.caption && (
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                            <p className="text-white text-xs font-medium line-clamp-2 text-left">{photo.caption}</p>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Lightbox ─────────────────────────────────────────────────── */}
      {lightbox && currentPhoto && (
        <div
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center"
          onClick={() => setLightbox(null)}
        >
          {/* Close */}
          <button
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors z-10"
            onClick={() => setLightbox(null)}
          >
            <X className="w-5 h-5 text-white" />
          </button>

          {/* Counter */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/10 text-white/70 text-xs font-medium px-3 py-1.5 rounded-full">
            {lightbox.index + 1} / {lightbox.group.photos.length}
          </div>

          {/* Prev */}
          {lightbox.index > 0 && (
            <button
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
              onClick={e => { e.stopPropagation(); navigate(-1); }}
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>
          )}

          {/* Next */}
          {lightbox.index < lightbox.group.photos.length - 1 && (
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
              onClick={e => { e.stopPropagation(); navigate(1); }}
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </button>
          )}

          {/* Image */}
          <div className="max-w-5xl w-full px-20" onClick={e => e.stopPropagation()}>
            <img
              src={imageUrl(currentPhoto.image_url)!}
              alt={currentPhoto.caption || ''}
              className="w-full max-h-[78vh] object-contain rounded-xl"
            />
            <div className="mt-4 text-center space-y-1">
              {currentPhoto.caption && (
                <p className="text-white font-medium text-sm">{currentPhoto.caption}</p>
              )}
              <p className="text-white/50 text-xs flex items-center justify-center gap-1.5">
                <CalendarDays className="w-3.5 h-3.5" />
                {formatDate(lightbox.group.date)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
