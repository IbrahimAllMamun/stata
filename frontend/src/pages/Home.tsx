// src/pages/Home.tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Users, Heart, Trophy, ArrowRight } from 'lucide-react';
import { api, Post, imageUrl } from '../lib/api';

export default function Home() {
  const [latestPosts, setLatestPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getPosts({ limit: 3 })
      .then(res => setLatestPosts(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <section className="relative bg-gradient-to-r from-[#1F2A44] to-[#2F5BEA] text-white py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">Welcome to STATA</h1>
          <p className="text-xl md:text-2xl mb-4 text-gray-200">Student Welfare Organization of ISRT</p>
          <p className="text-lg md:text-xl mb-8 text-gray-300 max-w-3xl mx-auto">Connecting Minds, Building Bonds, Nourishing Well-being</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/events" className="bg-[#F39C12] hover:bg-[#E67E22] text-white px-8 py-3 rounded-lg font-semibold transition-colors inline-flex items-center justify-center">
              Explore Events <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <Link to="/about" className="bg-white hover:bg-gray-100 text-[#1F2A44] px-8 py-3 rounded-lg font-semibold transition-colors">
              Learn More
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-[#1F2A44] mb-4 text-center">Our Mission</h2>
        <p className="text-lg text-gray-600 text-center mb-12 max-w-3xl mx-auto">
          STATA is dedicated to improving students' mental health and social bonding through meaningful activities and events.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {[
            { icon: Heart, color: 'bg-[#2F5BEA]', title: 'Mental Health', desc: 'Supporting student well-being through various activities and peer connections.' },
            { icon: Users, color: 'bg-[#2ECC71]', title: 'Social Bonding', desc: 'Building strong relationships among students through shared experiences.' },
            { icon: Calendar, color: 'bg-[#F39C12]', title: 'Events & Activities', desc: 'Organizing BBQ parties, tours, sports tournaments, and cultural events.' },
            { icon: Trophy, color: 'bg-[#E74C3C]', title: 'Alumni Network', desc: 'Connecting current students with alumni for mentorship and guidance.' },
          ].map(({ icon: Icon, color, title, desc }) => (
            <div key={title} className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow">
              <div className={`w-12 h-12 ${color} rounded-full flex items-center justify-center mb-4`}><Icon className="w-6 h-6 text-white" /></div>
              <h3 className="text-xl font-semibold text-[#1F2A44] mb-2">{title}</h3>
              <p className="text-gray-600">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#1F2A44] mb-4">Latest Updates</h2>
            <p className="text-lg text-gray-600">Stay informed about our recent activities and announcements</p>
          </div>
          {loading ? (
            <div className="text-center py-12"><div className="inline-block w-8 h-8 border-4 border-[#2F5BEA] border-t-transparent rounded-full animate-spin"></div></div>
          ) : latestPosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {latestPosts.map(post => (
                <div key={post.id} className="bg-[#F5F7FA] rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow">
                  {imageUrl(post.cover_image) && <img src={imageUrl(post.cover_image)!} alt={post.title} className="w-full h-48 object-cover" />}
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-[#1F2A44] mb-2">{post.title}</h3>
                    <p className="text-gray-600 mb-4 line-clamp-3">{post.content}</p>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-500">{post.admin?.username}</div>
                      <Link to={`/posts/${post.slug}`} className="text-[#2F5BEA] hover:text-[#F39C12] font-medium transition-colors">Read More</Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">No posts yet. Check back soon!</div>
          )}
          {latestPosts.length > 0 && (
            <div className="text-center mt-8">
              <Link to="/posts" className="text-[#2F5BEA] hover:text-[#F39C12] font-semibold inline-flex items-center transition-colors">
                View All Posts <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </div>
          )}
        </div>
      </section>

      <section className="bg-gradient-to-r from-[#2F5BEA] to-[#2ECC71] py-16 px-4">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Join Our Community</h2>
          <p className="text-lg mb-8">Be part of the STATA family and experience the joy of belonging to a supportive community.</p>
          <Link to="/register" className="bg-white text-[#2F5BEA] px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-block">
            Register as Member
          </Link>
        </div>
      </section>
    </div>
  );
}
