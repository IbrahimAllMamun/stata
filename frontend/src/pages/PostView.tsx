// src/pages/PostView.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, User } from 'lucide-react';
import { api, Post, imageUrl } from '../lib/api';
export default function PostView() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!slug) return;
    api.getPostBySlug(slug).then(res => setPost(res.data)).catch(() => navigate('/posts')).finally(() => setLoading(false));
  }, [slug]);
  if (loading) return (<div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-[#F5F7FA]"><div className="w-8 h-8 border-4 border-[#2F5BEA] border-t-transparent rounded-full animate-spin" /></div>);
  if (!post) return null;
  const img = imageUrl(post.cover_image);
  return (
    <div className="bg-[#F5F7FA] min-h-[calc(100vh-4rem)] py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-[#2F5BEA] mb-6 text-sm font-medium transition-colors group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" /> Back to Posts
        </button>
        <article className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {img && <img src={img} alt={post.title} className="w-full h-72 object-cover" />}
          <div className="p-8 md:p-10">
            <h1 className="text-3xl md:text-4xl font-extrabold text-[#1F2A44] mb-5 leading-tight">{post.title}</h1>
            <div className="flex flex-wrap items-center gap-4 mb-8 pb-6 border-b border-gray-100">
              {post.admin && (<div className="flex items-center gap-2"><div className="w-7 h-7 rounded-full bg-[#2F5BEA] flex items-center justify-center"><User className="w-3.5 h-3.5 text-white" /></div><span className="text-sm font-medium text-[#1F2A44]">{post.admin.username}</span></div>)}
              <div className="flex items-center gap-1.5 text-sm text-gray-400"><Calendar className="w-4 h-4" />{new Date(post.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
            </div>
            <div className="text-gray-600 leading-relaxed whitespace-pre-wrap text-base">{post.content}</div>
          </div>
        </article>
        <div className="mt-6 text-center"><Link to="/posts" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#2F5BEA] font-medium transition-colors"><ArrowLeft className="w-4 h-4" /> View all posts</Link></div>
      </div>
    </div>
  );
}
