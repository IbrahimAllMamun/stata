// src/pages/PostView.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, AlertCircle } from 'lucide-react';
import { api, Post, imageUrl } from '../lib/api';
import MarkdownRenderer from '../components/MarkdownRenderer';

export default function PostView() {
  const { id: slug } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Guard: always resolve loading even if slug is missing
    if (!slug) {
      setLoading(false);
      setError('Post not found.');
      return;
    }

    setLoading(true);
    setError(null);

    // Abort controller so navigating away cancels the in-flight request
    const controller = new AbortController();

    api.getPostBySlug(slug)
      .then(res => {
        if (!controller.signal.aborted) setPost(res.data);
      })
      .catch(err => {
        if (controller.signal.aborted) return;
        // Show the real error instead of silently redirecting
        setError(err?.message || 'Could not load this post.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [slug]);

  if (loading) return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-[#F5F7FA]">
      <div className="w-8 h-8 border-4 border-[#2F5BEA] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  // Show a friendly error with a back button instead of silently redirecting
  if (error || !post) return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-[#F5F7FA] px-4">
      <div className="text-center max-w-sm">
        <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-7 h-7 text-red-400" />
        </div>
        <h2 className="text-xl font-bold text-[#1F2A44] mb-2">Post not found</h2>
        <p className="text-gray-500 text-sm mb-6">
          {error || 'This post may have been removed or is not yet published.'}
        </p>
        <Link to="/posts"
          className="inline-flex items-center gap-2 bg-[#2F5BEA] hover:bg-[#1a3fc7] text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Posts
        </Link>
      </div>
    </div>
  );

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