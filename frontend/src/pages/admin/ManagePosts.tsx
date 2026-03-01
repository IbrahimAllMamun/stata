// src/pages/admin/ManagePosts.tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit2, Trash2, Eye, ToggleLeft, ToggleRight } from 'lucide-react';
import { adminApi, api, Post, imageUrl } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

export default function ManagePosts() {
  const { isAdmin } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAdmin) loadPosts();
  }, [isAdmin]);

  const loadPosts = async () => {
    try {
      // Admin can see all posts (including unpublished) — fetch up to 100
      const res = await api.getPosts({ limit: 100 });
      setPosts(res.data);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    try {
      await adminApi.deletePost(id);
      setPosts(posts.filter(p => p.id !== id));
    } catch (error) {
      alert('Failed to delete post. Please try again.');
    }
  };

  const handleToggle = async (id: string) => {
    try {
      const res = await adminApi.togglePost(id);
      setPosts(posts.map(p => p.id === id ? { ...p, published: res.data.published } : p));
    } catch (error) {
      alert('Failed to toggle publish status.');
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[#1F2A44] mb-2">Access Denied</h2>
          <p className="text-gray-600">You do not have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F5F7FA] py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#1F2A44] mb-2">Manage Posts</h1>
            <p className="text-gray-600">Create and manage blog posts and announcements</p>
          </div>
          <Link
            to="/admin/posts/new"
            className="bg-[#2F5BEA] hover:bg-[#F39C12] text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            New Post
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-[#2F5BEA] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : posts.length > 0 ? (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#F5F7FA] border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {posts.map((post) => (
                    <tr key={post.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {imageUrl(post.cover_image) && (
                            <img src={imageUrl(post.cover_image)!} className="w-10 h-10 rounded object-cover" />
                          )}
                          <div>
                            <div className="text-sm font-medium text-[#1F2A44]">{post.title}</div>
                            <div className="text-xs text-gray-400">/posts/{post.slug}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${post.published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {post.published ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(post.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right text-sm space-x-3">
                        <Link to={`/posts/${post.slug}`} className="inline-flex items-center text-[#2F5BEA] hover:text-[#F39C12] transition-colors" title="View">
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button onClick={() => handleToggle(post.id)} className="inline-flex items-center text-[#9B59B6] hover:text-[#F39C12] transition-colors" title="Toggle publish">
                          {post.published ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                        </button>
                        <Link to={`/admin/posts/edit/${post.id}`} className="inline-flex items-center text-[#2ECC71] hover:text-[#F39C12] transition-colors" title="Edit">
                          <Edit2 className="w-4 h-4" />
                        </Link>
                        <button onClick={() => handleDelete(post.id)} className="inline-flex items-center text-[#E74C3C] hover:text-[#F39C12] transition-colors" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-600 mb-4">No posts yet. Create your first post!</p>
            <Link to="/admin/posts/new" className="inline-flex items-center text-[#2F5BEA] hover:text-[#F39C12] font-semibold transition-colors">
              <Plus className="w-5 h-5 mr-2" />
              Create Post
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
