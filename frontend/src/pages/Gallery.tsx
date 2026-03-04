// src/pages/Gallery.tsx
import { useEffect, useState } from 'react';
import { Image as ImageIcon, X, Calendar } from 'lucide-react';
import { api, Event, imageUrl } from '../lib/api';
interface GItem { url: string; title: string; date: string; }
export default function Gallery() {
  const [items, setItems] = useState<GItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<GItem | null>(null);
  useEffect(() => {
    Promise.all([api.getEvents('upcoming'), api.getEvents('past')])
      .then(([u, p]) => {
        const all: GItem[] = [...u.data, ...p.data].filter((e: Event) => !!e.banner_image).map((e: Event) => ({ url: imageUrl(e.banner_image)!, title: e.title, date: e.event_date }));
        setItems(all);
      }).catch(console.error).finally(() => setLoading(false));
  }, []);
  return (
    <div className="bg-[#F5F7FA]">
      <section className="relative bg-[#1F2A44] text-white overflow-hidden">
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div className="absolute top-0 left-0 w-96 h-96 bg-[#2ECC71] rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-[#F39C12] rounded-full translate-x-1/2 translate-y-1/2" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 py-20 text-center">
          <div className="inline-block bg-[#2F5BEA]/20 border border-[#2F5BEA]/30 text-[#7BA3F5] text-xs font-bold tracking-widest uppercase px-4 py-1.5 rounded-full mb-5">Memories</div>
          <h1 className="text-5xl md:text-6xl font-extrabold mb-4 tracking-tight">Gallery</h1>
          <p className="text-gray-300 text-lg max-w-xl mx-auto">Relive the memories of our amazing events and activities</p>
        </div>
      </section>
      {/* <section className="bg-[#2F5BEA] text-white">
        <div className="max-w-7xl mx-auto px-4 py-4 text-center">
          <span className="text-2xl font-extrabold">{loading ? '...' : items.length}</span>
          <span className="text-sm opacity-70 ml-2">photos</span>
        </div>
      </section> */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">{[...Array(8)].map((_, i) => <div key={i} className="aspect-square bg-gray-200 rounded-2xl animate-pulse" />)}</div>
        ) : items.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {items.map((item, i) => (
              <div key={i} onClick={() => setSelected(item)} className="aspect-square bg-gray-200 rounded-2xl overflow-hidden cursor-pointer group relative shadow-sm hover:shadow-xl transition-all hover:-translate-y-0.5">
                <img src={item.url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                  <p className="text-white text-xs font-semibold line-clamp-2">{item.title}</p>
                  <p className="text-white/70 text-xs mt-0.5">{new Date(item.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100"><ImageIcon className="w-12 h-12 text-gray-200 mx-auto mb-3" /><p className="text-gray-400 font-medium">No images in the gallery yet</p><p className="text-gray-400 text-sm mt-1">Check back soon for photos from our upcoming events!</p></div>
        )}
      </section>
      {selected && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <button className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors" onClick={() => setSelected(null)}><X className="w-5 h-5 text-white" /></button>
          <div className="max-w-4xl w-full" onClick={e => e.stopPropagation()}>
            <img src={selected.url} alt={selected.title} className="w-full max-h-[75vh] object-contain rounded-xl" />
            <div className="mt-4 text-center">
              <p className="text-white font-semibold">{selected.title}</p>
              <p className="text-white/50 text-sm flex items-center justify-center gap-1 mt-1"><Calendar className="w-3.5 h-3.5" />{new Date(selected.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
