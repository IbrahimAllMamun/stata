// src/pages/Posts.tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, ChevronRight, PenLine } from 'lucide-react';
import { api, Post, imageUrl } from '../lib/api';

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}
function stripMarkdown(text: string | null | undefined) {
  if (!text) return '';
  const s = text.replace(/[#*`_>\-\[\]!]/g, '').replace(/\s+/g, ' ').trim();
  return s.length > 130 ? s.slice(0, 130) + '...' : s;
}
function Skeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100">
      <div className="h-48 bg-gray-200 animate-pulse" />
      <div className="p-5 space-y-3">
        <div className="h-3 bg-gray-200 rounded animate-pulse w-1/3" />
        <div className="h-5 bg-gray-200 rounded animate-pulse w-3/4" />
        <div className="h-4 bg-gray-200 rounded animate-pulse" />
      </div>
    </div>
  );
}

export default function Posts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getPosts({ limit: 50 }).then(res => setPosts(res.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-[#F5F7FA]">
      <section className="relative bg-[#1F2A44] text-white overflow-hidden">
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div className="absolute top-0 left-0 w-96 h-96 bg-[#F39C12] rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-[#2F5BEA] rounded-full translate-x-1/2 translate-y-1/2" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 py-20 text-center">
          <div className="inline-block bg-[#2F5BEA]/20 border border-[#2F5BEA]/30 text-[#7BA3F5] text-xs font-bold tracking-widest uppercase px-4 py-1.5 rounded-full mb-5">News & Updates</div>
          <h1 className="text-5xl md:text-6xl font-extrabold mb-4 tracking-tight">Posts</h1>
          <p className="text-gray-300 text-lg max-w-xl mx-auto">Stay updated with the latest news and announcements from STATA</p>
          <Link to="/posts/submit"
            className="mt-7 inline-flex items-center gap-2 bg-[#F39C12] hover:bg-[#e08e0b] text-white px-6 py-3 rounded-xl font-semibold text-sm transition-colors shadow-md">
            <PenLine className="w-4 h-4" /> Write a Post
          </Link>
        </div>
      </section>

      {/* <section className="bg-[#2F5BEA] text-white">
        <div className="max-w-7xl mx-auto px-4 py-4 text-center">
          <span className="text-2xl font-extrabold">{loading ? '...' : posts.length}</span>
          <span className="text-sm opacity-70 ml-2">posts published</span>
        </div>
      </section> */}

      <section className="max-w-7xl mx-auto px-4 py-12">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} />)}
          </div>
        ) : posts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map(post => {
              const img = imageUrl(post.cover_image);
              return (
                <Link key={post.id} to={`/posts/${post.slug}`}
                  className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col">
                  {img ? (
                    <div className="h-48 overflow-hidden flex-shrink-0">
                      <img src={img} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                  ) : (
                    <div className="h-48 bg-gradient-to-br from-[#F39C12]/10 to-[#2F5BEA]/10 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-12 h-12 text-[#2F5BEA]/20" />
                    </div>
                  )}
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-xs text-gray-400">{formatDate(post.created_at)}</span>
                      <span className="text-gray-300 text-xs">·</span>
                      <span className="text-xs font-semibold text-[#1F2A44]">{post.author_name}</span>
                      <span className="inline-flex items-center bg-[#2F5BEA]/10 text-[#2F5BEA] text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Batch {post.author_batch}
                      </span>
                    </div>
                    <h3 className="font-bold text-[#1F2A44] text-lg mb-2 line-clamp-2 group-hover:text-[#2F5BEA] transition-colors">{post.title}</h3>
                    <p className="text-gray-500 text-sm line-clamp-3 flex-1">{stripMarkdown(post.content)}</p>
                    <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-[#2F5BEA] group-hover:text-[#F39C12] transition-colors">
                      Read more <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
            <FileText className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 font-medium mb-4">No posts available yet</p>
            <Link to="/posts/submit" className="inline-flex items-center gap-2 bg-[#2F5BEA] text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-[#1a3fc7] transition-colors">
              <PenLine className="w-4 h-4" /> Be the first to write
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
