// src/pages/Posts.tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { api, Post, imageUrl } from '../lib/api';

export default function Posts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getPosts({ limit: 50 })
      .then(res => setPosts(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <section className="bg-gradient-to-r from-[#1F2A44] to-[#2F5BEA] text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Latest Posts</h1>
          <p className="text-lg md:text-xl text-gray-200">Stay updated with the latest news and announcements from STATA</p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-16">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-[#2F5BEA] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : posts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map(post => (
              <Link key={post.id} to={`/posts/${post.slug}`} className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow group">
                {imageUrl(post.cover_image) && (
                  <img src={imageUrl(post.cover_image)!} alt={post.title} className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" />
                )}
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-[#1F2A44] mb-2 group-hover:text-[#2F5BEA] transition-colors">{post.title}</h3>
                  <p className="text-gray-600 mb-4 line-clamp-3">{post.content}</p>
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    {/* <span>{post.admin?.username}</span> */}
                    <span>{new Date(post.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center justify-end pt-4 border-t border-gray-200">
                    <span className="text-[#2F5BEA] group-hover:text-[#F39C12] font-medium flex items-center">
                      Read More <ArrowRight className="w-4 h-4 ml-1" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No posts available yet.</p>
          </div>
        )}
      </section>
    </div>
  );
}
