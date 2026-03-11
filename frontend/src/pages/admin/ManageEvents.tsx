// src/pages/admin/ManageEvents.tsx
import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Calendar, MapPin, X, Save, Upload } from 'lucide-react';
import { adminApi, api, Event, imageUrl } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import MarkdownEditor from '../../components/MarkdownEditor';

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

  useEffect(() => { if (isAdmin) loadEvents(); }, [isAdmin]);

  const loadEvents = async () => {
    try { const res = await api.getEvents(); setEvents(res.data); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setImageFile(file); setImagePreview(URL.createObjectURL(file));
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
      if (editing) { await adminApi.updateEvent(editing, fd); } else { await adminApi.createEvent(fd); }
      handleCancel(); loadEvents();
    } catch (error: any) { alert(error.message || 'Failed to save event.'); }
  };

  const handleEdit = (event: Event) => {
    setFormData({ title: event.title, description: event.description || '', event_date: event.event_date.split('T')[0], location: event.location || '' });
    setImagePreview(imageUrl(event.banner_image));
    setEditing(event.id); setShowForm(true);
    setTimeout(() => document.getElementById('event-form')?.scrollIntoView({ behavior: 'smooth' }), 50);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this event?')) return;
    try { await adminApi.deleteEvent(id); setEvents(events.filter(e => e.id !== id)); }
    catch { alert('Failed to delete event.'); }
  };

  const handleCancel = () => {
    setFormData(emptyForm); setEditing(null); setShowForm(false); setImageFile(null); setImagePreview(null);
  };

  // Strip markdown for preview in the card
  const stripMd = (s: string) => s.replace(/[#*`>_\[\]()-]/g, '').replace(/\s+/g, ' ').trim().slice(0, 100);

  if (!isAdmin) return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
      <h2 className="text-2xl font-bold text-[#1F2A44]">Access Denied</h2>
    </div>
  );

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F5F7FA] py-8 px-4">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#1F2A44] mb-1">Manage Events</h1>
            <p className="text-gray-500 text-sm">Create and manage STATA events</p>
          </div>
          {!showForm && (
            <button onClick={() => setShowForm(true)}
              className="bg-[#2F5BEA] hover:bg-[#1a3fc7] text-white px-5 py-2.5 rounded-xl font-semibold transition-colors flex items-center gap-2 shadow-sm text-sm">
              <Plus className="w-4 h-4" /> New Event
            </button>
          )}
        </div>

        {/* Form */}
        {showForm && (
          <div id="event-form" className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
            <div className="bg-[#1F2A44] px-8 py-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">{editing ? 'Edit Event' : 'Create New Event'}</h2>
                <p className="text-gray-400 text-xs mt-0.5">Markdown supported in description - write and preview side-by-side</p>
              </div>
              <button onClick={handleCancel}
                className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-colors">
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Event Title <span className="text-red-400">*</span></label>
                <input type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#2F5BEA] focus:border-transparent outline-none transition-all" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Event Date <span className="text-red-400">*</span></label>
                  <input type="date" value={formData.event_date} onChange={e => setFormData({ ...formData, event_date: e.target.value })} required
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#2F5BEA] focus:border-transparent outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Location <span className="text-gray-400 font-normal">(optional)</span></label>
                  <input type="text" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#2F5BEA] focus:border-transparent outline-none transition-all"
                    placeholder="e.g. ISRT Building, Dhaka" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description <span className="text-gray-400 font-normal">(optional)</span></label>
                <MarkdownEditor
                  value={formData.description}
                  onChange={description => setFormData({ ...formData, description })}
                  placeholder={"Describe this event...\n\n- Use **bold** for key details\n- Use ## headings to add sections\n- Use > for highlighted notes"}
                  minRows={10}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Banner Image <span className="text-gray-400 font-normal">(optional)</span></label>
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-5 text-center hover:border-[#2F5BEA] transition-colors">
                  <input type="file" accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleImageChange} className="hidden" id="banner_image" />
                  <label htmlFor="banner_image" className="cursor-pointer flex flex-col items-center gap-2">
                    <Upload className="w-7 h-7 text-gray-300" />
                    <span className="text-sm text-gray-400">Click to upload · max 2 MB</span>
                  </label>
                </div>
                {imagePreview && <img src={imagePreview} className="mt-3 w-full max-h-40 object-cover rounded-xl" />}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={handleCancel}
                  className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 font-medium transition-colors">Cancel</button>
                <button type="submit"
                  className="bg-[#2F5BEA] hover:bg-[#1a3fc7] text-white px-6 py-2.5 rounded-xl font-semibold transition-colors flex items-center gap-2 text-sm shadow-sm">
                  <Save className="w-4 h-4" />{editing ? 'Update Event' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Events list */}
        {loading ? (
          <div className="text-center py-16"><div className="w-8 h-8 border-4 border-[#2F5BEA] border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : events.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map(event => (
              <div key={event.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                {imageUrl(event.banner_image) && (
                  <img src={imageUrl(event.banner_image)!} alt={event.title} className="w-full h-44 object-cover" />
                )}
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${event.is_upcoming ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {event.is_upcoming ? 'Upcoming' : 'Past'}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(event.event_date).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="font-bold text-[#1F2A44] mb-1">{event.title}</h3>
                  {event.location && (
                    <p className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />{event.location}
                    </p>
                  )}
                  {event.description && (
                    <p className="text-sm text-gray-500 mb-4 line-clamp-2">{stripMd(event.description)}</p>
                  )}
                  <div className="flex gap-2 mt-auto">
                    <button onClick={() => handleEdit(event)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-[#2ECC71] hover:bg-[#27AE60] text-white rounded-xl font-semibold text-sm transition-colors">
                      <Edit2 className="w-3.5 h-3.5" />Edit
                    </button>
                    <button onClick={() => handleDelete(event.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-[#E74C3C] hover:bg-[#C0392B] text-white rounded-xl font-semibold text-sm transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
            <Calendar className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">No events yet - create your first one!</p>
          </div>
        )}
      </div>
    </div>
  );
}
