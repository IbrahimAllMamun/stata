// src/pages/admin/ManagePosts.tsx
import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus, Edit2, Trash2, Eye, ToggleLeft, ToggleRight,
  CheckCircle, XCircle, Clock, FileText, Hash, RefreshCw,
} from 'lucide-react';
import { adminApi, Post, imageUrl } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

type TabStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    PENDING:  'bg-amber-100 text-amber-700 border-amber-200',
    APPROVED: 'bg-green-100 text-green-700 border-green-200',
    REJECTED: 'bg-red-100 text-red-600 border-red-200',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${map[status] ?? 'bg-gray-100 text-gray-500'}`}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

export default function ManagePosts() {
  const { isAdmin } = useAuth();
  const [tab, setTab] = useState<TabStatus>('PENDING');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState<Record<TabStatus, number>>({ PENDING: 0, APPROVED: 0, REJECTED: 0 });
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const loadCounts = useCallback(async () => {
    try {
      const [p, a, r] = await Promise.all([
        adminApi.getPosts({ status: 'PENDING', limit: 1 }),
        adminApi.getPosts({ status: 'APPROVED', limit: 1 }),
        adminApi.getPosts({ status: 'REJECTED', limit: 1 }),
      ]);
      setCounts({ PENDING: p.pagination.total, APPROVED: a.pagination.total, REJECTED: r.pagination.total });
    } catch {}
  }, []);

  const load = useCallback(async (status: TabStatus) => {
    setLoading(true);
    try {
      const res = await adminApi.getPosts({ status, limit: 100 });
      setPosts(res.data);
    } catch { showToast('Failed to load posts', false); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(tab); }, [tab]);
  useEffect(() => { loadCounts(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this post permanently?')) return;
    try {
      await adminApi.deletePost(id);
      setPosts(prev => prev.filter(p => p.id !== id));
      loadCounts();
      showToast('Post deleted');
    } catch { showToast('Failed to delete', false); }
  };

  const handleToggle = async (id: string) => {
    try {
      const res = await adminApi.togglePost(id);
      setPosts(prev => prev.map(p => p.id === id ? { ...p, published: res.data.published } : p));
      showToast(`Post ${res.data.published ? 'published' : 'unpublished'}`);
    } catch { showToast('Failed to toggle', false); }
  };

  const handleApprove = async (id: string) => {
    try {
      await adminApi.approvePost(id);
      setPosts(prev => prev.filter(p => p.id !== id));
      loadCounts();
      showToast('Post approved and published ✓');
    } catch { showToast('Failed to approve', false); }
  };

  const handleReject = async (id: string) => {
    try {
      await adminApi.rejectPost(id);
      setPosts(prev => prev.filter(p => p.id !== id));
      loadCounts();
      showToast('Post rejected');
    } catch { showToast('Failed to reject', false); }
  };

  const tabs: { key: TabStatus; label: string; color: string; icon: typeof Clock }[] = [
    { key: 'PENDING',  label: 'Pending',  color: 'border-amber-500 text-amber-600',  icon: Clock },
    { key: 'APPROVED', label: 'Approved', color: 'border-[#2ECC71] text-[#2ECC71]',  icon: CheckCircle },
    { key: 'REJECTED', label: 'Rejected', color: 'border-red-400 text-red-500',      icon: XCircle },
  ];

  if (!isAdmin) return null;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F5F7FA] py-8 px-4">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold text-[#1F2A44] mb-1">Manage Posts</h1>
            <p className="text-gray-500 text-sm">Review submissions and manage published posts</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => { load(tab); loadCounts(); }}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#2F5BEA] border border-gray-200 rounded-xl px-3 py-2 bg-white hover:border-[#2F5BEA] transition-colors">
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
            <Link to="/admin/posts/new"
              className="flex items-center gap-2 bg-[#2F5BEA] hover:bg-[#1a3fc7] text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors shadow-sm">
              <Plus className="w-4 h-4" /> New Post
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-gray-100">
            {tabs.map(({ key, label, color, icon: Icon }) => (
              <button key={key} onClick={() => { setTab(key); }}
                className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-semibold border-b-2 transition-colors ${
                  tab === key ? color : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}>
                <Icon className="w-4 h-4" />
                {label}
                {counts[key] > 0 && (
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                    key === 'PENDING' ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-500'
                  }`}>{counts[key]}</span>
                )}
              </button>
            ))}
          </div>

          {/* Table */}
          {loading ? (
            <div className="text-center py-16">
              <div className="inline-block w-8 h-8 border-4 border-[#2F5BEA] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No {tab.toLowerCase()} posts</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#F5F7FA] border-b border-gray-100">
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Post</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Author</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {posts.map(post => (
                    <tr key={post.id} className="hover:bg-[#F5F7FA] transition-colors">
                      {/* Post title + thumbnail */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3 max-w-xs">
                          {imageUrl(post.cover_image) ? (
                            <img src={imageUrl(post.cover_image)!} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-[#2F5BEA]/10 flex items-center justify-center flex-shrink-0">
                              <FileText className="w-5 h-5 text-[#2F5BEA]/40" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-semibold text-[#1F2A44] truncate">{post.title}</p>
                            <p className="text-xs text-gray-400 truncate">/posts/{post.slug}</p>
                          </div>
                        </div>
                      </td>

                      {/* Author */}
                      <td className="px-5 py-4">
                        <p className="font-medium text-[#1F2A44] text-sm">{post.author_name}</p>
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold bg-[#2F5BEA]/10 text-[#2F5BEA] px-2 py-0.5 rounded-full mt-0.5">
                          <Hash className="w-2.5 h-2.5" /> Batch {post.author_batch}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-1">
                          <StatusBadge status={post.status} />
                          {post.status === 'APPROVED' && (
                            <span className={`text-[10px] font-semibold ${post.published ? 'text-green-600' : 'text-gray-400'}`}>
                              {post.published ? '● Published' : '○ Draft'}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Date */}
                      <td className="px-5 py-4 text-sm text-gray-500">
                        {new Date(post.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Pending-specific: approve / reject */}
                          {post.status === 'PENDING' && (
                            <>
                              <button onClick={() => handleApprove(post.id)} title="Approve"
                                className="flex items-center gap-1 bg-green-50 hover:bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors">
                                <CheckCircle className="w-3.5 h-3.5" /> Approve
                              </button>
                              <button onClick={() => handleReject(post.id)} title="Reject"
                                className="flex items-center gap-1 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors">
                                <XCircle className="w-3.5 h-3.5" /> Reject
                              </button>
                            </>
                          )}

                          {/* Approved: toggle publish */}
                          {post.status === 'APPROVED' && (
                            <button onClick={() => handleToggle(post.id)} title="Toggle publish"
                              className="text-[#9B59B6] hover:text-[#F39C12] transition-colors p-1.5">
                              {post.published ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                            </button>
                          )}

                          {/* Rejected: re-approve */}
                          {post.status === 'REJECTED' && (
                            <button onClick={() => handleApprove(post.id)} title="Approve"
                              className="flex items-center gap-1 bg-green-50 hover:bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors">
                              <CheckCircle className="w-3.5 h-3.5" /> Approve
                            </button>
                          )}

                          {/* View */}
                          {post.status === 'APPROVED' && post.published && (
                            <Link to={`/posts/${post.slug}`} title="View"
                              className="text-[#2F5BEA] hover:text-[#F39C12] transition-colors p-1.5">
                              <Eye className="w-4 h-4" />
                            </Link>
                          )}

                          {/* Edit */}
                          <Link to={`/admin/posts/edit/${post.id}`} title="Edit"
                            className="text-[#2ECC71] hover:text-[#F39C12] transition-colors p-1.5">
                            <Edit2 className="w-4 h-4" />
                          </Link>

                          {/* Delete */}
                          <button onClick={() => handleDelete(post.id)} title="Delete"
                            className="text-[#E74C3C] hover:text-[#F39C12] transition-colors p-1.5">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white ${toast.ok ? 'bg-[#2ECC71]' : 'bg-[#E74C3C]'}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
