// src/pages/admin/Dashboard.tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Calendar, Users, Plus, LogOut, BarChart2, Settings } from 'lucide-react';
import { adminApi, DashboardStats } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

export default function AdminDashboard() {
  const { isAdmin, logout, admin } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAdmin) {
      adminApi.getDashboard()
        .then(res => setStats(res.data))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isAdmin]);

  if (!isAdmin) return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-[#1F2A44] mb-2">Access Denied</h2>
        <p className="text-gray-600">You do not have permission to access this page.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F5F7FA] py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-[#1F2A44] mb-1">Admin Dashboard</h1>
            <p className="text-gray-500 text-sm">Logged in as <span className="font-semibold">{admin?.username}</span></p>
          </div>
          <button onClick={logout} className="flex items-center gap-2 text-gray-600 hover:text-[#E74C3C] transition-colors text-sm">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-[#2F5BEA] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : stats && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {[
              { label: 'Members', value: stats.total_members, color: 'bg-[#2F5BEA]', icon: Users },
              { label: 'Committees', value: stats.total_committees, color: 'bg-[#9B59B6]', icon: BarChart2 },
              { label: 'Posts', value: stats.total_posts, color: 'bg-[#F39C12]', icon: FileText },
              { label: 'Total Events', value: stats.total_events, color: 'bg-[#1F2A44]', icon: Calendar },
              { label: 'Upcoming', value: stats.upcoming_events, color: 'bg-[#2ECC71]', icon: Calendar },
              { label: 'Past Events', value: stats.past_events, color: 'bg-[#E74C3C]', icon: Calendar },
            ].map(({ label, value, color, icon: Icon }) => (
              <div key={label} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                <div className={`w-10 h-10 ${color} rounded-lg flex items-center justify-center mb-3`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="text-2xl font-bold text-[#1F2A44]">{value}</div>
                <div className="text-xs text-gray-500 mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Link to="/admin/posts" className="bg-white p-7 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-[#2F5BEA] rounded-xl flex items-center justify-center group-hover:bg-[#F39C12] transition-colors">
                <FileText className="w-7 h-7 text-white" />
              </div>
              <Plus className="w-5 h-5 text-gray-300 group-hover:text-[#F39C12] transition-colors" />
            </div>
            <h2 className="text-xl font-bold text-[#1F2A44] mb-1">Manage Posts</h2>
            <p className="text-gray-500 text-sm">Create, edit, and publish announcements</p>
          </Link>

          <Link to="/admin/events" className="bg-white p-7 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-[#2ECC71] rounded-xl flex items-center justify-center group-hover:bg-[#F39C12] transition-colors">
                <Calendar className="w-7 h-7 text-white" />
              </div>
              <Plus className="w-5 h-5 text-gray-300 group-hover:text-[#F39C12] transition-colors" />
            </div>
            <h2 className="text-xl font-bold text-[#1F2A44] mb-1">Manage Events</h2>
            <p className="text-gray-500 text-sm">Create and manage STATA events</p>
          </Link>

          <Link to="/admin/settings" className="bg-white p-7 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-[#9B59B6] rounded-xl flex items-center justify-center group-hover:bg-[#F39C12] transition-colors">
                <Settings className="w-7 h-7 text-white" />
              </div>
              <Plus className="w-5 h-5 text-gray-300 group-hover:text-[#F39C12] transition-colors" />
            </div>
            <h2 className="text-xl font-bold text-[#1F2A44] mb-1">Committee Settings</h2>
            <p className="text-gray-500 text-sm">Assign president & general secretary</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
