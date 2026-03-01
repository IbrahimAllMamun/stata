// src/pages/Gallery.tsx
import { useEffect, useState } from 'react';
import { Image as ImageIcon, X } from 'lucide-react';
import { api, Event, imageUrl } from '../lib/api';

export default function Gallery() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    // Load all events and use banner images as gallery
    Promise.all([api.getEvents('upcoming'), api.getEvents('past')])
      .then(([upcoming, past]) => {
        const all = [...upcoming.data, ...past.data];
        setEvents(all.filter(e => !!e.banner_image));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const allImages = events.map(event => ({
    url: imageUrl(event.banner_image)!,
    eventTitle: event.title,
    eventDate: event.event_date,
  }));

  return (
    <div>
      <section className="bg-gradient-to-r from-[#1F2A44] to-[#2F5BEA] text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Gallery</h1>
          <p className="text-lg md:text-xl text-gray-200">
            Relive the memories of our amazing events and activities
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-16">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-[#2F5BEA] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : allImages.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {allImages.map((image, index) => (
              <div
                key={index}
                className="aspect-square bg-gray-200 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity group relative"
                onClick={() => setSelectedImage(image.url)}
              >
                <img src={image.url} alt={image.eventTitle} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-end">
                  <p className="text-white text-xs p-2 opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                    {image.eventTitle}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <ImageIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No images in the gallery yet.</p>
            <p className="text-gray-500 mt-2">Check back soon for photos from our upcoming events!</p>
          </div>
        )}
      </section>

      {/* Lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
            onClick={() => setSelectedImage(null)}
          >
            <X className="w-8 h-8" />
          </button>
          <img
            src={selectedImage}
            alt="Gallery"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
