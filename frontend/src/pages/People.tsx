// src/pages/People.tsx
import { useEffect, useState } from 'react';
import { Users, Crown, Star, Search, ChevronDown, X, Mail, Phone, Building2, MapPin, Briefcase, Droplets, LogIn } from 'lucide-react';
import { api, Member, Committee, CommitteeMemberDetail, imageUrl } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-7 h-7 rounded-lg bg-[#F5F7FA] flex items-center justify-center flex-shrink-0 text-[#2F5BEA] mt-0.5">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-sm text-[#1F2A44] font-medium break-all">{value}</p>
      </div>
    </div>
  );
}

/* ── Member popup (All Members tab) ──────────────────────────────── */
function MemberModal({ member, onClose, isMember }: { member: Member; onClose: () => void; isMember: boolean }) {
  const photoSrc = imageUrl(member.photo_url);
  const isLeader = member.is_president_or_secretary;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(2px)' }}
      onClick={onClose}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className={`h-24 ${isLeader ? 'bg-gradient-to-r from-amber-500 to-amber-400' : 'bg-gradient-to-r from-[#1F2A44] to-[#2F5BEA]'}`} />
        <div className="px-6 -mt-14 flex justify-between items-end mb-4">
          {photoSrc
            ? <img src={photoSrc} alt={member.full_name} className="w-28 h-28 rounded-2xl object-cover border-4 border-white shadow-md" />
            : <div className={`w-28 h-28 rounded-2xl flex items-center justify-center text-white text-3xl font-bold border-4 border-white shadow-md ${isLeader ? 'bg-amber-500' : 'bg-[#2F5BEA]'}`}>
              {member.full_name.charAt(0).toUpperCase()}
            </div>
          }
          <div className="flex items-center gap-2 pb-1">
            {isLeader && (
              <span className="flex items-center gap-1 bg-amber-100 text-amber-700 text-xs px-2.5 py-1 rounded-full font-semibold border border-amber-200">
                <Crown className="w-3 h-3" />
              </span>
            )}
            {!isLeader && member.is_committee_member && (
              <span className="flex items-center gap-1 bg-blue-100 text-blue-700 text-xs px-2.5 py-1 rounded-full font-semibold border border-blue-200">
                <Star className="w-3 h-3" /> Committee
              </span>
            )}
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>
        <div className="px-6 mb-5">
          <h2 className="text-xl font-bold text-[#1F2A44]">{member.full_name}</h2>
          <span className="bg-[#1F2A44] text-white text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block">Batch {member.batch}</span>
        </div>
        <div className="px-6 pb-6 space-y-3">
          <DetailRow icon={<Mail className="w-4 h-4" />} label="Email" value={member.email} />
          {isMember && member.phone_number && <DetailRow icon={<Phone className="w-4 h-4" />} label="Phone" value={member.phone_number} />}
          {isMember && member.alternative_phone && <DetailRow icon={<Phone className="w-4 h-4" />} label="Alt. Phone" value={member.alternative_phone} />}
          {member.blood_group && <DetailRow icon={<Droplets className="w-4 h-4" />} label="Blood Group" value={member.blood_group} />}
          {member.job_title && <DetailRow icon={<Briefcase className="w-4 h-4" />} label="Job Title" value={member.job_title} />}
          {member.organisation && <DetailRow icon={<Building2 className="w-4 h-4" />} label="Organisation" value={member.organisation} />}
          {member.organisation_address && <DetailRow icon={<MapPin className="w-4 h-4" />} label="Address" value={member.organisation_address} />}
          {!isMember && (
            <a href="/login"
              className="mt-2 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold transition-colors border-2 border-dashed border-[#2F5BEA]/30 text-[#2F5BEA] hover:bg-[#2F5BEA] hover:text-white hover:border-[#2F5BEA]">
              <LogIn className="w-4 h-4" /> Sign in to see full information
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Leader popup (Leaders tab) - identical layout to MemberModal ── */
function LeaderModal({ person, role, year, onClose, isMember }: {
  person: CommitteeMemberDetail; role: string; year: number; onClose: () => void; isMember: boolean;
}) {
  const photoSrc = imageUrl(person.photo_url);
  const isPresident = role === 'President';
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(2px)' }}
      onClick={onClose}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Same banner gradient as MemberModal, colour-coded by role */}
        <div className={`h-24 ${isPresident ? 'bg-gradient-to-r from-amber-500 to-amber-400' : 'bg-gradient-to-r from-[#2F5BEA] to-[#1F2A44]'}`} />
        <div className="px-6 -mt-14 flex justify-between items-end mb-4">
          {photoSrc
            ? <img src={photoSrc} alt={person.full_name} className="w-28 h-28 rounded-2xl object-cover border-4 border-white shadow-md" />
            : <div className={`w-28 h-28 rounded-2xl flex items-center justify-center text-white text-3xl font-bold border-4 border-white shadow-md ${isPresident ? 'bg-amber-500' : 'bg-[#2F5BEA]'}`}>
              {person.full_name.charAt(0).toUpperCase()}
            </div>
          }
          <div className="flex items-center gap-2 pb-1">
            <span className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold border ${isPresident ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-blue-100 text-blue-700 border-blue-200'}`}>
              {isPresident ? <Crown className="w-3 h-3" /> : <Star className="w-3 h-3" />}
              {role} {year}
            </span>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>
        <div className="px-6 mb-5">
          <h2 className="text-xl font-bold text-[#1F2A44]">{person.full_name}</h2>
          <span className="bg-[#1F2A44] text-white text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block">Batch {person.batch}</span>
        </div>
        <div className="px-6 pb-6 space-y-3">
          <DetailRow icon={<Mail className="w-4 h-4" />} label="Email" value={person.email} />
          {isMember && person.phone_number && <DetailRow icon={<Phone className="w-4 h-4" />} label="Phone" value={person.phone_number} />}
          {isMember && person.alternative_phone && <DetailRow icon={<Phone className="w-4 h-4" />} label="Alt. Phone" value={person.alternative_phone} />}
          {person.blood_group && <DetailRow icon={<Droplets className="w-4 h-4" />} label="Blood Group" value={person.blood_group} />}
          {person.job_title && <DetailRow icon={<Briefcase className="w-4 h-4" />} label="Job Title" value={person.job_title} />}
          {person.organisation && <DetailRow icon={<Building2 className="w-4 h-4" />} label="Organisation" value={person.organisation} />}
          {person.organisation_address && <DetailRow icon={<MapPin className="w-4 h-4" />} label="Address" value={person.organisation_address} />}
          {!isMember && (
            <a href="/login"
              className="mt-2 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold transition-colors border-2 border-dashed border-[#2F5BEA]/30 text-[#2F5BEA] hover:bg-[#2F5BEA] hover:text-white hover:border-[#2F5BEA]">
              <LogIn className="w-4 h-4" /> Sign in to see full information
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Card shown in the Leaders grid ─────────────────────────────── */
function CommitteeCard({ person, role, isCurrent, color, icon, onSelect }: {
  person: CommitteeMemberDetail | null; role: string; isCurrent: boolean;
  color: string; icon: React.ReactNode; onSelect: () => void;
}) {
  const isPresident = color === 'bg-amber-500';
  const accent = isPresident
    ? { badge: 'bg-amber-500 text-white', footer: 'bg-amber-50', link: 'text-amber-600', ring: 'ring-amber-200', border: 'border-amber-200' }
    : { badge: 'bg-[#2F5BEA] text-white', footer: 'bg-blue-50', link: 'text-[#2F5BEA]', ring: 'ring-blue-200', border: 'border-blue-100' };

  if (!person) return (
    <div className={`border-2 border-dashed rounded-2xl p-8 text-center flex flex-col items-center justify-center min-h-[260px] ${isPresident ? 'border-amber-200 text-amber-300' : 'border-blue-100 text-blue-300'}`}>
      <p className="text-sm">No {role} assigned</p>
    </div>
  );
  const photoSrc = imageUrl(person.photo_url);
  return (
    <button
      onClick={onSelect}
      className={`group w-full bg-white rounded-2xl shadow-sm border overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1 cursor-pointer text-left flex flex-col ${isCurrent ? accent.border : 'border-gray-100'}`}
    >
      {/* Coloured role header */}
      <div className={`${color} px-4 py-3 flex items-center gap-2`}>
        {icon}
        <span className="text-sm font-bold text-white tracking-wide">{role}</span>
      </div>
      {/* Square full-width image */}
      <div className="w-full px-3 pt-3">
        <div className={`w-full aspect-square rounded-xl overflow-hidden ring-2 ${accent.ring}`}>
          {photoSrc
            ? <img src={photoSrc} alt={person.full_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            : <div className={`w-full h-full ${color} flex items-center justify-center text-white text-5xl font-bold`}>
              {person.full_name.charAt(0).toUpperCase()}
            </div>
          }
        </div>
      </div>
      {/* Info footer — tinted to match card colour */}
      <div className={`flex flex-col items-center pt-4 pb-5 px-4 flex-1 ${accent.footer} mt-3 border-t ${accent.border}`}>
        <p className="font-bold text-[#1F2A44] text-center text-base leading-tight mb-2">{person.full_name}</p>
        <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold mb-2 ${accent.badge}`}>Batch {person.batch}</span>
        {person.job_title && <p className="text-xs text-gray-600 text-center truncate w-full">{person.job_title}</p>}
        {person.organisation && <p className="text-xs text-gray-500 text-center truncate w-full mt-0.5">{person.organisation}</p>}
        <p className={`text-xs mt-3 font-semibold ${accent.link}`}>View details →</p>
      </div>
    </button>
  );
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 rounded ${className}`} />;
}

/* ── Page ────────────────────────────────────────────────────────── */
export default function People() {
  const { isMember } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [loadingCommittees, setLoadingCommittees] = useState(true);
  const [batchFilter, setBatchFilter] = useState('');
  const [bloodGroupFilter, setBloodGroupFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'members' | 'committees'>('members');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [selectedLeader, setSelectedLeader] = useState<{ person: CommitteeMemberDetail; role: string; year: number } | null>(null);

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

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setSelectedMember(null); setSelectedLeader(null); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const batches = [...new Set(members.map(m => m.batch))].sort((a, b) => a - b);
  const filtered = members
    .filter(m => {
      const matchBatch = batchFilter ? m.batch === parseInt(batchFilter) : true;
      const matchBlood = bloodGroupFilter ? m.blood_group === bloodGroupFilter : true;
      const matchSearch = searchQuery
        ? m.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.email.toLowerCase().includes(searchQuery.toLowerCase())
        : true;
      return matchBatch && matchBlood && matchSearch;
    })
    .sort((a, b) => a.batch !== b.batch ? a.batch - b.batch : a.full_name.localeCompare(b.full_name));

  const sortedCommittees = [...committees].sort((a, b) => b.acting_year - a.acting_year);
  const currentYear = sortedCommittees[0]?.acting_year ?? null;

  return (
    <div className="bg-[#F5F7FA]">
      {/* Hero */}
      <section className="relative bg-[#1F2A44] text-white overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#2F5BEA] rounded-full translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#F39C12] rounded-full -translate-x-1/2 translate-y-1/2" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 py-20 text-center">
          <div className="inline-block bg-[#2F5BEA]/20 border border-[#2F5BEA]/30 text-[#7BA3F5] text-xs font-bold tracking-widest uppercase px-4 py-1.5 rounded-full mb-5">
            The STATA Community
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold mb-4 tracking-tight">Our Family</h1>
          <p className="text-gray-300 text-lg max-w-xl mx-auto">Meet the members and leaders who make STATA what it is</p>
        </div>
      </section>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 flex">
          <button onClick={() => setActiveTab('members')}
            className={`px-6 py-4 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'members' ? 'border-[#2F5BEA] text-[#2F5BEA]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
            <Users className="w-4 h-4" />
            All Members
            {!loadingMembers && <span className="bg-[#2F5BEA] text-white text-xs px-2 py-0.5 rounded-full">{members.length}</span>}
          </button>
          <button onClick={() => setActiveTab('committees')}
            className={`px-6 py-4 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'committees' ? 'border-[#F39C12] text-[#F39C12]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
            <Crown className="w-4 h-4" />
            Leaders
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">

        {/* ── All Members tab ── */}
        {activeTab === 'members' && (
          <div>
            <div className="flex flex-col sm:flex-row gap-3 mb-8">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" placeholder="Search by name or email..."
                  value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#2F5BEA] focus:border-transparent outline-none bg-white shadow-sm" />
              </div>
              <div className="relative">
                <select value={batchFilter} onChange={e => setBatchFilter(e.target.value)}
                  className="appearance-none pl-4 pr-9 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#2F5BEA] focus:border-transparent outline-none bg-white shadow-sm min-w-[150px]">
                  <option value="">All Batches</option>
                  {batches.map(b => <option key={b} value={b}>Batch {b}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
              <div className="relative">
                <select value={bloodGroupFilter} onChange={e => setBloodGroupFilter(e.target.value)}
                  className="appearance-none pl-4 pr-9 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#2F5BEA] focus:border-transparent outline-none bg-white shadow-sm min-w-[150px]">
                  <option value="">All Blood Groups</option>
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {loadingMembers ? (
              <div className="space-y-10">
                {[1, 2].map(s => (
                  <div key={s}>
                    <Skeleton className="h-6 w-32 mb-5 rounded-full" />
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className="bg-white rounded-2xl p-4 flex flex-col items-center gap-3 border border-gray-100">
                          <div className="w-full px-3 pt-3"><Skeleton className="w-full aspect-square rounded-xl" /></div>
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <Users className="w-12 h-12 mx-auto mb-3 text-gray-200" />
                <p className="text-gray-400 font-medium">No members found</p>
              </div>
            ) : (() => {
              // Group filtered members by batch (already sorted asc by batch then name)
              const byBatch: Record<number, Member[]> = {};
              for (const m of filtered) {
                if (!byBatch[m.batch]) byBatch[m.batch] = [];
                byBatch[m.batch].push(m);
              }
              const batchNums = Object.keys(byBatch).map(Number).sort((a, b) => a - b);
              return (
                <div className="space-y-10">
                  {batchNums.map(batch => (
                    <div key={batch}>
                      {/* Batch header */}
                      <div className="flex items-center gap-3 mb-5">
                        <span className="bg-[#1F2A44] text-white text-sm font-bold px-4 py-1.5 rounded-full">
                          Batch {batch}
                        </span>
                        <span className="text-xs text-gray-400 font-medium">{byBatch[batch].length} member{byBatch[batch].length !== 1 ? 's' : ''}</span>
                        <div className="flex-1 h-px bg-gray-200" />
                      </div>
                      {/* Member cards */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
                        {byBatch[batch].map(member => {
                          const photoSrc = imageUrl(member.photo_url);
                          const avatarBg = member.is_president_or_secretary
                            ? 'bg-amber-500'
                            : member.is_committee_member
                              ? 'bg-[#2F5BEA]'
                              : 'bg-[#1F2A44]';
                          return (
                            <button
                              key={member.id}
                              onClick={() => setSelectedMember(member)}
                              className="group bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg hover:border-[#2F5BEA]/40 hover:-translate-y-1 transition-all duration-200 p-5 flex flex-col items-center text-center cursor-pointer w-full"
                            >
                              {/* Photo */}
                              <div className="relative w-full px-3 pt-3 mb-3">
                                <div className="relative w-full aspect-square rounded-xl overflow-hidden">
                                  {photoSrc
                                    ? <img src={photoSrc} alt={member.full_name}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                    : <div className={`w-full h-full flex items-center justify-center text-white text-4xl font-bold ${avatarBg}`}>
                                      {member.full_name.charAt(0).toUpperCase()}
                                    </div>
                                  }
                                  {member.is_president_or_secretary && (
                                    <span className="absolute top-2 right-2 w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center shadow">
                                      <Crown className="w-3 h-3 text-white" />
                                    </span>
                                  )}
                                  {!member.is_president_or_secretary && member.is_committee_member && (
                                    <span className="absolute top-2 right-2 w-6 h-6 bg-[#2F5BEA] rounded-full flex items-center justify-center shadow">
                                      <Star className="w-3 h-3 text-white" />
                                    </span>
                                  )}
                                </div>
                              </div>
                              {/* Name */}
                              <p className="text-sm font-bold text-[#1F2A44] leading-tight line-clamp-2 mb-1 group-hover:text-[#2F5BEA] transition-colors">
                                {member.full_name}
                              </p>
                              {/* Job title */}
                              {member.job_title && (
                                <p className="text-xs text-gray-600 line-clamp-1 leading-tight">
                                  {member.job_title}
                                </p>
                              )}
                              {/* Organisation */}
                              {member.organisation && (
                                <p className="text-[10px] text-gray-500 line-clamp-1 leading-tight mt-0.5">
                                  {member.organisation}
                                </p>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  <p className="text-xs text-gray-400 font-medium text-right pt-2">
                    Showing {filtered.length} of {members.length} members
                  </p>
                </div>
              );
            })()}
          </div>
        )}

        {/* ── Leaders tab ── */}
        {activeTab === 'committees' && (
          <div>
            {loadingCommittees ? (
              <div className="text-center py-20">
                <div className="inline-block w-8 h-8 border-4 border-[#F39C12] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : sortedCommittees.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <Crown className="w-12 h-12 mx-auto mb-3 text-gray-200" />
                <p className="text-gray-400 font-medium">No committees found</p>
              </div>
            ) : (
              <div className="space-y-14">
                {sortedCommittees.map(committee => {
                  const isCurrent = committee.acting_year === currentYear;
                  return (
                    <div key={committee.id}>
                      <div className="flex items-center gap-4 mb-7">
                        <div className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold shadow-sm ${isCurrent ? 'bg-[#2F5BEA] text-white' : 'bg-white text-[#1F2A44] border border-gray-200'}`}>
                          {isCurrent && <span className="w-2 h-2 rounded-full bg-white animate-pulse" />}
                          {isCurrent ? 'Current Committee' : `${committee.acting_year}-${committee.acting_year + 1}`}
                        </div>
                        <div className="flex-1 h-px bg-gray-200" />
                      </div>
                      <div className="grid grid-cols-2 gap-6 max-w-3xl">
                        <CommitteeCard
                          person={committee.president} role="President"
                          isCurrent={isCurrent}
                          color="bg-amber-500" icon={<Crown className="w-4 h-4 text-white" />}
                          onSelect={() => committee.president && setSelectedLeader({
                            person: committee.president, role: 'President', year: committee.acting_year,
                          })}
                        />
                        <CommitteeCard
                          person={committee.general_secretary} role="General Secretary"
                          isCurrent={isCurrent}
                          color="bg-[#2F5BEA]" icon={<Star className="w-4 h-4 text-white" />}
                          onSelect={() => committee.general_secretary && setSelectedLeader({
                            person: committee.general_secretary, role: 'General Secretary', year: committee.acting_year,
                          })}
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

      {selectedMember && <MemberModal member={selectedMember} onClose={() => setSelectedMember(null)} isMember={isMember} />}
      {selectedLeader && (
        <LeaderModal
          person={selectedLeader.person}
          role={selectedLeader.role}
          year={selectedLeader.year}
          isMember={isMember}
          onClose={() => setSelectedLeader(null)}
        />
      )}
    </div>
  );
}