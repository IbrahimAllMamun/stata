// src/pages/PostView.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Calendar } from 'lucide-react';
import { api, Post, imageUrl } from '../lib/api';
import MarkdownRenderer from '../components/MarkdownRenderer';

export default function PostView() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    api.getPostBySlug(slug)
      .then(res => setPost(res.data))
      .catch(() => navigate('/posts'))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-[#F5F7FA]">
      <div className="w-8 h-8 border-4 border-[#2F5BEA] border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!post) return null;

  const img = imageUrl(post.cover_image);
  return (
    <div className="bg-[#F5F7FA] min-h-[calc(100vh-4rem)] py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-500 hover:text-[#2F5BEA] mb-6 text-sm font-medium transition-colors group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" /> Back to Posts
        </button>

        <article className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {img && <img src={img} alt={post.title} className="w-full h-72 object-cover" />}
          <div className="p-8 md:p-10">
            <h1 className="text-3xl md:text-4xl font-extrabold text-[#1F2A44] mb-5 leading-tight">{post.title}</h1>

            {/* Author meta */}
            <div className="flex flex-wrap items-center gap-3 mb-8 pb-6 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#2F5BEA] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {post.author_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#1F2A44] leading-none">{post.author_name}</p>

                </div>
              </div>
              <span className="inline-flex items-center bg-[#2F5BEA]/10 text-[#2F5BEA] text-xs font-bold px-2.5 py-1 rounded-full">
                Batch {post.author_batch}
              </span>
              <div className="flex items-center gap-1.5 text-sm text-gray-400 ml-auto">
                <Calendar className="w-4 h-4" />
                {new Date(post.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            </div>

            <MarkdownRenderer content={post.content} />
          </div>
        </article>

        <div className="mt-6 text-center">
          <Link to="/posts" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#2F5BEA] font-medium transition-colors">
            <ArrowLeft className="w-4 h-4" /> View all posts
          </Link>
        </div>
      </div>
    </div>
  );
}