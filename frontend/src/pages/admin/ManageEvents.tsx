// src/pages/admin/ManageEvents.tsx
import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Calendar, X, Save, Upload } from 'lucide-react';
import { adminApi, api, Event, imageUrl } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

const emptyForm = { title: '', description: '', event_date: '', location: '' };

export default function ManageEvents() {
  const { isAdmin } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (isAdmin) loadEvents();
  }, [isAdmin]);

  const loadEvents = async () => {
    try {
      const res = await api.getEvents();
      setEvents(res.data);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('title', formData.title);
    fd.append('description', formData.description);
    fd.append('event_date', formData.event_date);
    fd.append('location', formData.location);
    if (imageFile) fd.append('banner_image', imageFile);

    try {
      if (editing) {
        await adminApi.updateEvent(editing, fd);
      } else {
        await adminApi.createEvent(fd);
      }
      handleCancel();
      loadEvents();
    } catch (error: any) {
      alert(error.message || 'Failed to save event.');
    }
  };

  const handleEdit = (event: Event) => {
    setFormData({
      title: event.title,
      description: event.description || '',
      event_date: event.event_date.split('T')[0],
      location: event.location || '',
    });
    setImagePreview(imageUrl(event.banner_image));
    setEditing(event.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    try {
      await adminApi.deleteEvent(id);
      setEvents(events.filter(e => e.id !== id));
    } catch {
      alert('Failed to delete event.');
    }
  };

  const handleCancel = () => {
    setFormData(emptyForm);
    setEditing(null);
    setShowForm(false);
    setImageFile(null);
    setImagePreview(null);
  };

  if (!isAdmin) return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-[#1F2A44] mb-2">Access Denied</h2>
      </div>
    </div>
  );

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F5F7FA] py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#1F2A44] mb-2">Manage Events</h1>
            <p className="text-gray-600">Create and manage STATA events</p>
          </div>
          {!showForm && (
            <button onClick={() => setShowForm(true)} className="bg-[#2F5BEA] hover:bg-[#F39C12] text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center">
              <Plus className="w-5 h-5 mr-2" />
              New Event
            </button>
          )}
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-8 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-[#1F2A44]">{editing ? 'Edit Event' : 'Create New Event'}</h2>
              <button onClick={handleCancel} className="text-gray-500 hover:text-gray-700"><X className="w-6 h-6" /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Event Title</label>
                <input type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F5BEA] focus:border-transparent outline-none transition-all" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Event Date</label>
                  <input type="date" value={formData.event_date} onChange={e => setFormData({ ...formData, event_date: e.target.value })} required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F5BEA] focus:border-transparent outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location (optional)</label>
                  <input type="text" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F5BEA] focus:border-transparent outline-none transition-all" placeholder="e.g. ISRT Building, Dhaka" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={4} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F5BEA] focus:border-transparent outline-none transition-all resize-none" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Banner Image (optional)</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-[#2F5BEA] transition-colors">
                  <input type="file" accept="image/jpeg,image/jpg,image/png,image/webp" onChange={handleImageChange} className="hidden" id="banner_image" />
                  <label htmlFor="banner_image" className="cursor-pointer flex flex-col items-center gap-2">
                    <Upload className="w-8 h-8 text-gray-400" />
                    <span className="text-sm text-gray-500">Click to upload (max 2MB)</span>
                  </label>
                </div>
                {imagePreview && <img src={imagePreview} className="mt-3 w-full max-h-40 object-cover rounded-lg" />}
              </div>

              <div className="flex justify-end space-x-4">
                <button type="button" onClick={handleCancel} className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors">Cancel</button>
                <button type="submit" className="bg-[#2F5BEA] hover:bg-[#F39C12] text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center">
                  <Save className="w-5 h-5 mr-2" />
                  {editing ? 'Update Event' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12"><div className="inline-block w-8 h-8 border-4 border-[#2F5BEA] border-t-transparent rounded-full animate-spin"></div></div>
        ) : events.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map(event => (
              <div key={event.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                {imageUrl(event.banner_image) && (
                  <img src={imageUrl(event.banner_image)!} alt={event.title} className="w-full h-48 object-cover" />
                )}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${event.is_upcoming ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {event.is_upcoming ? 'Upcoming' : 'Past'}
                    </span>
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(event.event_date).toLocaleDateString()}
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-[#1F2A44] mb-2">{event.title}</h3>
                  {event.location && <p className="text-sm text-gray-500 mb-2">📍 {event.location}</p>}
                  <p className="text-gray-600 mb-4 line-clamp-3">{event.description}</p>
                  <div className="flex space-x-2">
                    <button onClick={() => handleEdit(event)} className="flex-1 flex items-center justify-center px-4 py-2 bg-[#2ECC71] hover:bg-[#27AE60] text-white rounded-lg font-medium transition-colors">
                      <Edit2 className="w-4 h-4 mr-2" />Edit
                    </button>
                    <button onClick={() => handleDelete(event.id)} className="flex-1 flex items-center justify-center px-4 py-2 bg-[#E74C3C] hover:bg-[#C0392B] text-white rounded-lg font-medium transition-colors">
                      <Trash2 className="w-4 h-4 mr-2" />Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-600">No events yet. Create your first event!</p>
          </div>
        )}
      </div>
    </div>
  );
}
