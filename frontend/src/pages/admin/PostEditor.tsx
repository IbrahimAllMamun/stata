// src/pages/admin/PostEditor.tsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ArrowLeft, Upload } from 'lucide-react';
import { adminApi, api, imageUrl } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

export default function PostEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingPost, setLoadingPost] = useState(!!id);
  const [existingSlug, setExistingSlug] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({ title: '', content: '', published: true });

  useEffect(() => {
    if (id) {
      // We need to find the post by id — fetch all posts and find matching id
      api.getPosts({ limit: 100 })
        .then(res => {
          const post = res.data.find(p => p.id === id);
          if (post) {
            setFormData({ title: post.title, content: post.content, published: post.published });
            setExistingSlug(post.slug);
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
    if (imageFile) fd.append('cover_image', imageFile);

    try {
      if (id) {
        await adminApi.updatePost(id, fd);
      } else {
        await adminApi.createPost(fd);
      }
      navigate('/admin/posts');
    } catch (error: any) {
      alert(error.message || 'Failed to save post.');
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) return null;
  if (loadingPost) return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
      <div className="inline-block w-8 h-8 border-4 border-[#2F5BEA] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F5F7FA] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => navigate('/admin/posts')} className="flex items-center text-gray-600 hover:text-[#2F5BEA] mb-6 transition-colors">
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Posts
        </button>

        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-[#1F2A44] mb-6">{id ? 'Edit Post' : 'Create New Post'}</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Post Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F5BEA] focus:border-transparent outline-none transition-all"
                placeholder="Enter post title..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cover Image (optional)</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-[#2F5BEA] transition-colors">
                <input type="file" accept="image/jpeg,image/jpg,image/png,image/webp" onChange={handleImageChange} className="hidden" id="cover_image" />
                <label htmlFor="cover_image" className="cursor-pointer flex flex-col items-center gap-2">
                  <Upload className="w-8 h-8 text-gray-400" />
                  <span className="text-sm text-gray-500">Click to upload (jpg, png, webp — max 2MB)</span>
                </label>
              </div>
              {imagePreview && (
                <img src={imagePreview} alt="Preview" className="mt-3 w-full max-h-52 object-cover rounded-lg" />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
              <textarea
                value={formData.content}
                onChange={e => setFormData({ ...formData, content: e.target.value })}
                required
                rows={12}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F5BEA] focus:border-transparent outline-none transition-all resize-none"
                placeholder="Write your post content here..."
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="published"
                checked={formData.published}
                onChange={e => setFormData({ ...formData, published: e.target.checked })}
                className="w-4 h-4 accent-[#2F5BEA]"
              />
              <label htmlFor="published" className="text-sm font-medium text-gray-700">Publish immediately</label>
            </div>

            <div className="flex items-center justify-end space-x-4">
              <button type="button" onClick={() => navigate('/admin/posts')} className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={loading} className="bg-[#2F5BEA] hover:bg-[#F39C12] text-white px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center">
                <Save className="w-5 h-5 mr-2" />
                {loading ? 'Saving...' : id ? 'Update Post' : 'Create Post'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
