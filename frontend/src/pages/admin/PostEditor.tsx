// src/pages/admin/PostEditor.tsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ArrowLeft, Upload } from 'lucide-react';
import { adminApi, imageUrl } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import MarkdownEditor from '../../components/MarkdownEditor';

export default function PostEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin, admin, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingPost, setLoadingPost] = useState(!!id);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '', content: '', published: true,
    author_name: '', author_batch: '',
  });

  useEffect(() => {
    if (id) {
      adminApi.getPosts({ limit: 200 })
        .then(res => {
          const post = res.data.find(p => p.id === id);
          if (post) {
            setFormData({
              title: post.title,
              content: post.content ?? '',
              published: post.published,
              author_name: post.author_name ?? '',
              author_batch: post.author_batch ? String(post.author_batch) : '',
            });
            if (post.cover_image) setImagePreview(imageUrl(post.cover_image));
          } else {
            alert('Post not found');
            navigate('/admin/posts');
          }
        })
        .catch(() => navigate('/admin/posts'))
        .finally(() => setLoadingPost(false));
    }
  }, [id]);

  // Pre-fill author name with admin username for new posts
  useEffect(() => {
    if (!id && admin?.username && !formData.author_name) {
      setFormData(f => ({ ...f, author_name: admin.username }));
    }
  }, [admin, id]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData();
    fd.append('title', formData.title);
    fd.append('content', formData.content);
    fd.append('published', String(formData.published));
    fd.append('author_name', formData.author_name);
    fd.append('author_batch', formData.author_batch);
    if (imageFile) fd.append('cover_image', imageFile);
    try {
      if (id) { await adminApi.updatePost(id, fd); }
      else { await adminApi.createPost(fd); }
      navigate('/admin/posts');
    } catch (err: any) {
      alert(err.message || 'Failed to save post.');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loadingPost) return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-[#F5F7FA]">
      <div className="w-8 h-8 border-4 border-[#2F5BEA] border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!isAdmin) return null;

  const inputCls = 'w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#2F5BEA] focus:border-transparent outline-none transition-all bg-white';

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F5F7FA] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => navigate('/admin/posts')}
          className="flex items-center gap-2 text-gray-500 hover:text-[#2F5BEA] mb-6 text-sm font-medium transition-colors group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" /> Back to Posts
        </button>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-[#1F2A44] px-7 py-5">
            <h1 className="text-xl font-bold text-white">{id ? 'Edit Post' : 'Create New Post'}</h1>
            <p className="text-gray-400 text-xs mt-0.5">This post will be published immediately as approved</p>
          </div>

          <form onSubmit={handleSubmit} className="p-7 space-y-6">
            {/* Author */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Author Name <span className="text-red-400">*</span></label>
                <input type="text" value={formData.author_name} required
                  onChange={e => setFormData({ ...formData, author_name: e.target.value })}
                  placeholder="Author name" className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Batch <span className="text-red-400">*</span>
                </label>
                <input type="number" value={formData.author_batch} min={1} max={3000} required
                  onChange={e => setFormData({ ...formData, author_batch: e.target.value })}
                  placeholder="e.g. 26" className={inputCls} />
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Post Title <span className="text-red-400">*</span></label>
              <input type="text" value={formData.title} required
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter post title..." className={inputCls} />
            </div>

            {/* Cover image */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Cover Image <span className="text-gray-400 font-normal">(optional)</span></label>
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-5 text-center hover:border-[#2F5BEA] transition-colors">
                <input type="file" accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleImageChange} className="hidden" id="cover_image" />
                <label htmlFor="cover_image" className="cursor-pointer flex flex-col items-center gap-2">
                  <Upload className="w-7 h-7 text-gray-300" />
                  <span className="text-sm text-gray-400">Click to upload · jpg, png, webp</span>
                </label>
              </div>
              {imagePreview && <img src={imagePreview} alt="Preview" className="mt-3 w-full max-h-52 object-cover rounded-xl" />}
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Content <span className="text-red-400">*</span></label>
              <MarkdownEditor
                value={formData.content}
                onChange={content => setFormData({ ...formData, content })}
                placeholder="Write post content here..."
                minRows={14}
              />
            </div>

            {/* Publish toggle */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={formData.published}
                onChange={e => setFormData({ ...formData, published: e.target.checked })}
                className="w-4 h-4 accent-[#2F5BEA]" />
              <span className="text-sm font-medium text-gray-700">Publish immediately</span>
            </label>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
              <button type="button" onClick={() => navigate('/admin/posts')}
                className="px-5 py-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 font-medium text-sm transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={loading}
                className="flex items-center gap-2 bg-[#2F5BEA] hover:bg-[#1a3fc7] text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors disabled:opacity-50">
                <Save className="w-4 h-4" />
                {loading ? 'Saving...' : id ? 'Update Post' : 'Create Post'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}