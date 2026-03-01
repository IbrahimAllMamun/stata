// src/pages/PostView.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, User } from 'lucide-react';
import { api, Post, imageUrl } from '../lib/api';

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
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
      <div className="inline-block w-8 h-8 border-4 border-[#2F5BEA] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (!post) return null;

  return (
    <div className="min-h-[calc(100vh-4rem)] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center text-gray-600 hover:text-[#2F5BEA] mb-6 transition-colors">
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </button>

        <article className="bg-white rounded-lg shadow-md overflow-hidden">
          {imageUrl(post.cover_image) && (
            <img src={imageUrl(post.cover_image)!} alt={post.title} className="w-full h-96 object-cover" />
          )}
          <div className="p-8">
            <h1 className="text-4xl font-bold text-[#1F2A44] mb-4">{post.title}</h1>
            <div className="flex items-center gap-4 text-gray-500 text-sm mb-8 pb-6 border-b border-gray-200">
              {post.admin && (
                <span className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  {post.admin.username}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {new Date(post.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>
            <div className="prose max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">
              {post.content}
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
