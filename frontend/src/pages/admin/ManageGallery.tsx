// src/pages/admin/ManageGallery.tsx
import { useState, useEffect, useRef } from 'react';
import { Camera, Upload, Trash2, CalendarDays, Images, X, AlertCircle, CheckCircle2, Plus } from 'lucide-react';
import { adminApi, GalleryGroup, imageUrl } from '../../lib/api';
// import { useAuth } from '../../contexts/AuthContext';

interface Photo {
  id: string;
  image_url: string;
  caption?: string | null;
  moment_date: string;
  admin?: { id: string; username: string };
}

interface PreviewFile {
  file: File;
  preview: string;
  caption: string;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' });
}

export default function ManageGallery() {
  // const { isAdmin } = useAuth();
  const [groups, setGroups] = useState<GalleryGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Upload form
  const [momentDate, setMomentDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [previews, setPreviews] = useState<PreviewFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchGallery = () => {
    setLoading(true);
    adminApi.getGallery()
      .then(res => setGroups(res.data))
      .catch(() => showToast('error', 'Failed to load gallery'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchGallery(); }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = 10 - previews.length;
    const toAdd = files.slice(0, remaining);
    const newPreviews: PreviewFile[] = toAdd.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      caption: '',
    }));
    setPreviews(prev => [...prev, ...newPreviews]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removePreview = (idx: number) => {
    setPreviews(prev => {
      URL.revokeObjectURL(prev[idx].preview);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const updateCaption = (idx: number, caption: string) => {
    setPreviews(prev => prev.map((p, i) => i === idx ? { ...p, caption } : p));
  };

  const handleUpload = async () => {
    if (!momentDate) return showToast('error', 'Please select a date');
    if (previews.length === 0) return showToast('error', 'Please select at least one image');

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('moment_date', momentDate);
      previews.forEach((p) => {
        fd.append('images', p.file);
        if (p.caption.trim()) fd.append('captions', p.caption.trim());
        else fd.append('captions', '');
      });
      await adminApi.uploadGalleryPhotos(fd);
      showToast('success', `${previews.length} photo${previews.length > 1 ? 's' : ''} uploaded!`);
      previews.forEach(p => URL.revokeObjectURL(p.preview));
      setPreviews([]);
      setMomentDate(new Date().toISOString().slice(0, 10));
      fetchGallery();
    } catch (err: any) {
      showToast('error', err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await adminApi.deleteGalleryPhoto(id);
      showToast('success', 'Photo deleted');
      setDeleteConfirm(null);
      fetchGallery();
    } catch (err: any) {
      showToast('error', err.message || 'Delete failed');
    }
  };

  const totalPhotos = groups.reduce((s, g) => s + g.photos.length, 0);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F5F7FA] py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Toast */}
        {toast && (
          <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-lg text-sm font-medium text-white transition-all ${toast.type === 'success' ? 'bg-[#2ECC71]' : 'bg-red-500'
            }`}>
            {toast.type === 'success'
              ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
            {toast.msg}
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1F2A44]">Gallery</h1>
            <p className="text-gray-400 text-sm mt-0.5">{totalPhotos} photo{totalPhotos !== 1 ? 's' : ''} in {groups.length} moment{groups.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="w-12 h-12 bg-[#1F2A44] rounded-xl flex items-center justify-center">
            <Camera className="w-6 h-6 text-white" />
          </div>
        </div>

        {/* Upload card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-[#1F2A44] px-6 py-4 flex items-center gap-3">
            <Upload className="w-5 h-5 text-white" />
            <h2 className="text-white font-semibold">Upload Photos</h2>
            <span className="ml-auto text-gray-400 text-xs">Up to 10 at once</span>
          </div>

          <div className="p-6 space-y-5">
            {/* Date picker */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Moment Date <span className="text-red-400">*</span>
                <span className="font-normal text-gray-400 ml-1">— when was this photo taken?</span>
              </label>
              <input
                type="date"
                value={momentDate}
                onChange={e => setMomentDate(e.target.value)}
                max={new Date().toISOString().slice(0, 10)}
                className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#2F5BEA] focus:border-transparent outline-none transition-all"
              />
            </div>

            {/* Drop zone */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Images <span className="text-red-400">*</span>
                <span className="font-normal text-gray-400 ml-1">({previews.length}/10 selected)</span>
              </label>
              {previews.length < 10 && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-[#2F5BEA] hover:bg-[#2F5BEA]/5 transition-all cursor-pointer group"
                >
                  <Plus className="w-8 h-8 text-gray-300 group-hover:text-[#2F5BEA] mx-auto mb-2 transition-colors" />
                  <p className="text-sm text-gray-400 group-hover:text-[#2F5BEA] transition-colors font-medium">
                    Click to select images
                  </p>
                  <p className="text-xs text-gray-300 mt-0.5">JPG, PNG, WebP, HEIC — max 15MB each</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif"
                    multiple
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
              )}
            </div>

            {/* Preview grid */}
            {previews.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {previews.map((p, idx) => (
                  <div key={idx} className="group relative">
                    <div className="aspect-square rounded-xl overflow-hidden bg-gray-100">
                      <img src={p.preview} alt="" className="w-full h-full object-cover" />
                    </div>
                    <button
                      onClick={() => removePreview(idx)}
                      className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="text"
                      placeholder="Caption (optional)"
                      value={p.caption}
                      onChange={e => updateCaption(idx, e.target.value)}
                      className="mt-1.5 w-full text-xs px-2 py-1.5 border border-gray-200 rounded-lg focus:ring-1 focus:ring-[#2F5BEA] focus:border-transparent outline-none"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Upload button */}
            {previews.length > 0 && (
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <button
                  onClick={() => { previews.forEach(p => URL.revokeObjectURL(p.preview)); setPreviews([]); }}
                  className="text-sm text-gray-400 hover:text-red-500 transition-colors font-medium"
                >
                  Clear all
                </button>
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="flex items-center gap-2 bg-[#2F5BEA] hover:bg-[#1a3fc7] text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-colors disabled:opacity-50"
                >
                  <Upload className="w-4 h-4" />
                  {uploading ? 'Uploading...' : `Upload ${previews.length} photo${previews.length > 1 ? 's' : ''}`}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Gallery management */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-[#1F2A44] px-6 py-4 flex items-center gap-3">
            <Images className="w-5 h-5 text-white" />
            <h2 className="text-white font-semibold">Manage Photos</h2>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="space-y-6">
                {[...Array(2)].map((_, i) => (
                  <div key={i}>
                    <div className="h-4 bg-gray-200 rounded w-36 mb-3 animate-pulse" />
                    <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-2">
                      {[...Array(6)].map((_, j) => (
                        <div key={j} className="aspect-square bg-gray-200 rounded-xl animate-pulse" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : groups.length === 0 ? (
              <div className="text-center py-16">
                <Camera className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 font-medium">No photos yet</p>
                <p className="text-gray-300 text-sm mt-1">Upload some photos above to get started</p>
              </div>
            ) : (
              <div className="space-y-8">
                {groups.map(group => (
                  <div key={group.date}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 bg-[#1F2A44]/10 rounded-lg flex items-center justify-center">
                        <CalendarDays className="w-4 h-4 text-[#1F2A44]" />
                      </div>
                      <div>
                        <p className="font-semibold text-[#1F2A44] text-sm">{formatDate(group.date)}</p>
                        <p className="text-xs text-gray-400">{group.photos.length} photo{group.photos.length !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-2">
                      {(group.photos as Photo[]).map(photo => (
                        <div key={photo.id} className="group relative">
                          <div className="aspect-square rounded-xl overflow-hidden bg-gray-100">
                            <img
                              src={imageUrl(photo.image_url)!}
                              alt={photo.caption || ''}
                              loading="lazy"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          {deleteConfirm === photo.id ? (
                            <div className="absolute inset-0 bg-black/80 rounded-xl flex flex-col items-center justify-center gap-1.5 p-1">
                              <p className="text-white text-xs text-center font-medium">Delete?</p>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => handleDelete(photo.id)}
                                  className="bg-red-500 text-white text-xs px-2 py-1 rounded-lg font-semibold hover:bg-red-600 transition-colors"
                                >Yes</button>
                                <button
                                  onClick={() => setDeleteConfirm(null)}
                                  className="bg-white/20 text-white text-xs px-2 py-1 rounded-lg font-medium hover:bg-white/30 transition-colors"
                                >No</button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirm(photo.id)}
                              className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {photo.caption && (
                            <p className="mt-1 text-xs text-gray-400 truncate px-0.5">{photo.caption}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
