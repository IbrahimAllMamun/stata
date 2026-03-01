// src/pages/People.tsx
import { useEffect, useState } from 'react';
import { Users, Crown, Star, Search, ChevronDown } from 'lucide-react';
import { api, Member, Committee, imageUrl } from '../lib/api';

export default function People() {
  const [members, setMembers] = useState<Member[]>([]);
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [loadingCommittees, setLoadingCommittees] = useState(true);
  const [batchFilter, setBatchFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'members' | 'committees'>('members');

  useEffect(() => {
    api.getMembers({ limit: 500 })
      .then(res => setMembers(res.data))
      .catch(console.error)
      .finally(() => setLoadingMembers(false));

    api.getCommittees()
      .then(res => setCommittees(res.data))
      .catch(console.error)
      .finally(() => setLoadingCommittees(false));
  }, []);

  // Unique batches for filter
  const batches = [...new Set(members.map(m => m.batch))].sort((a, b) => a - b);

  // Filtered + sorted members
  const filtered = members
    .filter(m => {
      const matchBatch = batchFilter ? m.batch === parseInt(batchFilter) : true;
      const matchSearch = searchQuery
        ? m.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.email.toLowerCase().includes(searchQuery.toLowerCase())
        : true;
      return matchBatch && matchSearch;
    })
    .sort((a, b) => a.batch !== b.batch ? a.batch - b.batch : a.full_name.localeCompare(b.full_name));

  // Most recent year = current committee
  const currentYear = committees.length > 0 ? Math.max(...committees.map(c => c.acting_year)) : null;

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-r from-[#1F2A44] to-[#2F5BEA] text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Our People</h1>
          <p className="text-lg text-gray-200">Meet the STATA members and committee leaders</p>
        </div>
      </section>

      {/* Tab switcher */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex">
            <button
              onClick={() => setActiveTab('members')}
              className={`px-6 py-4 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === 'members'
                  ? 'border-[#2F5BEA] text-[#2F5BEA]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                All Members
                {!loadingMembers && (
                  <span className="bg-[#2F5BEA] text-white text-xs px-2 py-0.5 rounded-full">{members.length}</span>
                )}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('committees')}
              className={`px-6 py-4 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === 'committees'
                  ? 'border-[#F39C12] text-[#F39C12]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="flex items-center gap-2">
                <Crown className="w-4 h-4" />
                Committees
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10">

        {/* ═══════════════ ALL MEMBERS TAB ═══════════════ */}
        {activeTab === 'members' && (
          <div>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#2F5BEA] focus:border-transparent outline-none"
                />
              </div>
              <div className="relative">
                <select
                  value={batchFilter}
                  onChange={e => setBatchFilter(e.target.value)}
                  className="appearance-none pl-4 pr-9 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#2F5BEA] focus:border-transparent outline-none bg-white min-w-[150px]"
                >
                  <option value="">All Batches</option>
                  {batches.map(b => <option key={b} value={b}>Batch {b}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 mb-4 text-xs">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-100 border border-amber-300 inline-block" /> President / General Secretary</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-blue-50 border border-blue-200 inline-block" /> Committee Member</span>
            </div>

            {loadingMembers ? (
              <div className="text-center py-16">
                <div className="inline-block w-8 h-8 border-4 border-[#2F5BEA] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p>No members found</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[#F5F7FA] border-b border-gray-200">
                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Batch</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Email</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Organisation</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filtered.map((member, idx) => (
                        <tr
                          key={member.id}
                          className={`transition-colors ${
                            member.is_president_or_secretary
                              ? 'bg-amber-50 hover:bg-amber-100'
                              : member.is_committee_member
                              ? 'bg-blue-50 hover:bg-blue-100'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <td className="px-5 py-3.5 text-gray-400 text-xs">{idx + 1}</td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-[#2F5BEA] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                {member.full_name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-medium text-[#1F2A44]">{member.full_name}</p>
                                {member.job_title && <p className="text-xs text-gray-400">{member.job_title}</p>}
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="bg-[#1F2A44] text-white text-xs px-2 py-0.5 rounded-full font-medium">{member.batch}</span>
                          </td>
                          <td className="px-5 py-3.5 text-gray-500 hidden md:table-cell">{member.email}</td>
                          <td className="px-5 py-3.5 text-gray-500 hidden lg:table-cell">{member.organisation || '—'}</td>
                          <td className="px-5 py-3.5">
                            {member.is_president_or_secretary ? (
                              <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 text-xs px-2.5 py-1 rounded-full font-semibold border border-amber-200">
                                <Crown className="w-3 h-3" /> Officer
                              </span>
                            ) : member.is_committee_member ? (
                              <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-xs px-2.5 py-1 rounded-full font-semibold border border-blue-200">
                                <Star className="w-3 h-3" /> Committee
                              </span>
                            ) : (
                              <span className="text-gray-400 text-xs">Member</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="px-5 py-3 bg-[#F5F7FA] border-t border-gray-100 text-xs text-gray-500">
                  Showing {filtered.length} of {members.length} members
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════ COMMITTEES TAB ═══════════════ */}
        {activeTab === 'committees' && (
          <div>
            {loadingCommittees ? (
              <div className="text-center py-16">
                <div className="inline-block w-8 h-8 border-4 border-[#F39C12] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : committees.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <Crown className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p>No committees found</p>
              </div>
            ) : (
              <div className="space-y-10">
                {committees.map(committee => {
                  const isCurrent = committee.acting_year === currentYear;
                  return (
                    <div key={committee.id}>
                      {/* Section label */}
                      <div className="flex items-center gap-3 mb-5">
                        <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold ${
                          isCurrent ? 'bg-[#2F5BEA] text-white' : 'bg-[#F5F7FA] text-[#1F2A44] border border-gray-200'
                        }`}>
                          {isCurrent && <span className="w-2 h-2 rounded-full bg-white animate-pulse" />}
                          {isCurrent ? 'Current Committee' : `Committee — ${committee.acting_year}`}
                        </div>
                        <div className="flex-1 h-px bg-gray-200" />
                      </div>

                      {/* Two cards: President then General Secretary */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-2xl">
                        <CommitteeCard
                          person={committee.president}
                          role="President"
                          year={committee.acting_year}
                          isCurrent={isCurrent}
                          color="bg-amber-500"
                          icon={<Crown className="w-4 h-4" />}
                        />
                        <CommitteeCard
                          person={committee.general_secretary}
                          role="General Secretary"
                          year={committee.acting_year}
                          isCurrent={isCurrent}
                          color="bg-[#2F5BEA]"
                          icon={<Star className="w-4 h-4" />}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function CommitteeCard({ person, role, isCurrent, color, icon }: {
  person: any; role: string; year: number; isCurrent: boolean; color: string; icon: React.ReactNode;
}) {
  if (!person) return (
    <div className="border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center text-gray-400">
      <p className="text-sm">No {role} assigned</p>
    </div>
  );

  const imgSrc = imageUrl(person.image_url);

  return (
    <div className={`bg-white rounded-2xl shadow-sm border overflow-hidden transition-shadow hover:shadow-md ${isCurrent ? 'border-amber-200' : 'border-gray-100'}`}>
      {/* Role badge */}
      <div className={`${color} text-white px-4 py-2.5 flex items-center gap-2`}>
        {icon}
        <span className="text-sm font-semibold">{role}</span>
      </div>
      {/* Photo */}
      <div className="p-5 flex gap-4 items-center">
        {imgSrc ? (
          <img src={imgSrc} alt={person.full_name} className="w-16 h-16 rounded-full object-cover flex-shrink-0 border-2 border-gray-100" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-[#2F5BEA] flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
            {person.full_name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <p className="font-bold text-[#1F2A44] truncate">{person.full_name}</p>
          <p className="text-xs text-gray-400 mt-0.5">Batch {person.batch}</p>
          {person.job_title && <p className="text-xs text-gray-500 mt-1 truncate">{person.job_title}</p>}
          {person.organisation && <p className="text-xs text-gray-400 truncate">{person.organisation}</p>}
        </div>
      </div>
    </div>
  );
}
