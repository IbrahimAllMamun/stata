// src/pages/People.tsx
import { useEffect, useState } from 'react';
import { Users, Crown, Star, Search, ChevronDown, X, Mail, Phone, Building2, MapPin, Briefcase, Droplets } from 'lucide-react';
import { api, Member, Committee, imageUrl } from '../lib/api';

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

function MemberAvatar({ member, size = 'sm' }: { member: Member; size?: 'sm' | 'lg' }) {
  const photoSrc = imageUrl(member.photo_url);
  const sizeClasses = size === 'lg'
    ? 'w-20 h-20 rounded-2xl text-3xl border-4 border-white shadow-md'
    : 'w-9 h-9 rounded-full text-xs';
  const bgColor = member.is_president_or_secretary
    ? 'bg-amber-500'
    : member.is_committee_member
      ? 'bg-[#2F5BEA]'
      : 'bg-[#1F2A44]';

  if (photoSrc) {
    return (
      <img
        src={photoSrc}
        alt={member.full_name}
        className={`${sizeClasses} object-cover flex-shrink-0 ${size === 'sm' ? 'border-2 border-white shadow-sm' : ''}`}
      />
    );
  }
  return (
    <div className={`${sizeClasses} ${bgColor} flex items-center justify-center text-white font-bold flex-shrink-0`}>
      {member.full_name.charAt(0).toUpperCase()}
    </div>
  );
}

function MemberModal({ member, onClose }: { member: Member; onClose: () => void }) {
  const photoSrc = imageUrl(member.photo_url);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(2px)" }}
      onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className={`h-20 ${member.is_president_or_secretary ? "bg-gradient-to-r from-amber-500 to-amber-400" : "bg-gradient-to-r from-[#1F2A44] to-[#2F5BEA]"}`} />
        <div className="px-6 -mt-10 flex justify-between items-end mb-4">
          {photoSrc
            ? <img src={photoSrc} alt={member.full_name} className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-md" />
            : <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-white text-3xl font-bold border-4 border-white shadow-md ${member.is_president_or_secretary ? 'bg-amber-500' : 'bg-[#2F5BEA]'}`}>
              {member.full_name.charAt(0).toUpperCase()}
            </div>
          }
          <div className="flex items-center gap-2 pb-1">
            {member.is_president_or_secretary && (
              <span className="flex items-center gap-1 bg-amber-100 text-amber-700 text-xs px-2.5 py-1 rounded-full font-semibold border border-amber-200">
                <Crown className="w-3 h-3" /> Leader
              </span>
            )}
            {!member.is_president_or_secretary && member.is_committee_member && (
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
          <DetailRow icon={<Phone className="w-4 h-4" />} label="Phone" value={member.phone_number} />
          {member.alternative_phone && <DetailRow icon={<Phone className="w-4 h-4" />} label="Alt. Phone" value={member.alternative_phone} />}
          {member.blood_group && <DetailRow icon={<Droplets className="w-4 h-4" />} label="Blood Group" value={member.blood_group} />}
          {member.job_title && <DetailRow icon={<Briefcase className="w-4 h-4" />} label="Job Title" value={member.job_title} />}
          {member.organisation && <DetailRow icon={<Building2 className="w-4 h-4" />} label="Organisation" value={member.organisation} />}
          {member.organisation_address && <DetailRow icon={<MapPin className="w-4 h-4" />} label="Address" value={member.organisation_address} />}
        </div>
      </div>
    </div>
  );
}

function CommitteeMemberModal({ person, role, year, onClose }: { person: any; role: string; year: number; onClose: () => void }) {
  const imgSrc = imageUrl(person.image_url);
  const isPresident = role === "President";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(2px)" }}
      onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className={`h-24 ${isPresident ? "bg-gradient-to-r from-amber-500 to-amber-400" : "bg-gradient-to-r from-[#2F5BEA] to-[#1F2A44]"}`} />
        <div className="px-6 -mt-12 flex justify-between items-end mb-4">
          {imgSrc
            ? <img src={imgSrc} alt={person.full_name} className="w-24 h-24 rounded-2xl object-cover border-4 border-white shadow-lg" />
            : <div className="w-24 h-24 rounded-2xl bg-[#2F5BEA] flex items-center justify-center text-white text-4xl font-bold border-4 border-white shadow-lg">{person.full_name.charAt(0).toUpperCase()}</div>
          }
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors mb-1">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <div className="px-6 mb-2">
          <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold ${isPresident ? "bg-amber-100 text-amber-700 border border-amber-200" : "bg-blue-100 text-blue-700 border border-blue-200"}`}>
            {isPresident ? <Crown className="w-3 h-3" /> : <Star className="w-3 h-3" />} {role} {year}
          </span>
        </div>
        <div className="px-6 mb-5">
          <h2 className="text-xl font-bold text-[#1F2A44]">{person.full_name}</h2>
          <span className="bg-[#1F2A44] text-white text-xs px-2 py-0.5 rounded-full font-medium">Batch {person.batch}</span>
        </div>
        <div className="px-6 pb-6 space-y-3">
          <DetailRow icon={<Mail className="w-4 h-4" />} label="Email" value={person.email} />
          {person.job_title && <DetailRow icon={<Briefcase className="w-4 h-4" />} label="Job Title" value={person.job_title} />}
          {person.organisation && <DetailRow icon={<Building2 className="w-4 h-4" />} label="Organisation" value={person.organisation} />}
        </div>
      </div>
    </div>
  );
}

function CommitteeCard({ person, role, isCurrent, color, icon, onSelect }: {
  person: any; role: string; year: number; isCurrent: boolean;
  color: string; icon: React.ReactNode; onSelect: () => void;
}) {
  if (!person) return (
    <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center text-gray-400 flex flex-col items-center justify-center min-h-[260px]">
      <p className="text-sm">No {role} assigned</p>
    </div>
  );
  const imgSrc = imageUrl(person.image_url);
  return (
    <button onClick={onSelect}
      className={`w-full bg-white rounded-2xl shadow-sm border overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1 cursor-pointer text-left ${isCurrent ? "border-amber-200" : "border-gray-100"}`}>
      <div className={`${color} px-4 py-2.5 flex items-center gap-2`}>
        {icon}
        <span className="text-sm font-semibold text-white">{role}</span>
      </div>
      <div className="flex flex-col items-center pt-6 pb-5 px-4">
        {imgSrc
          ? <img src={imgSrc} alt={person.full_name} className="w-24 h-24 rounded-full object-cover border-4 border-gray-100 shadow-sm mb-4" />
          : <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#2F5BEA] to-[#1F2A44] flex items-center justify-center text-white text-3xl font-bold border-4 border-gray-100 shadow-sm mb-4">{person.full_name.charAt(0).toUpperCase()}</div>
        }
        <p className="font-bold text-[#1F2A44] text-center text-base leading-tight mb-1">{person.full_name}</p>
        <span className="bg-[#1F2A44] text-white text-xs px-2.5 py-0.5 rounded-full font-medium mb-2">Batch {person.batch}</span>
        {person.job_title && <p className="text-xs text-gray-500 text-center truncate w-full">{person.job_title}</p>}
        {person.organisation && <p className="text-xs text-gray-400 text-center truncate w-full">{person.organisation}</p>}
        <p className="text-xs text-[#2F5BEA] mt-3 opacity-60">View details</p>
      </div>
    </button>
  );
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 rounded ${className}`} />;
}

export default function People() {
  const [members, setMembers] = useState<Member[]>([]);
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [loadingCommittees, setLoadingCommittees] = useState(true);
  const [batchFilter, setBatchFilter] = useState("");
  const [bloodGroupFilter, setBloodGroupFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"members" | "committees">("members");
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [selectedCommitteePerson, setSelectedCommitteePerson] = useState<{ person: any; role: string; year: number } | null>(null);

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
      if (e.key === "Escape") { setSelectedMember(null); setSelectedCommitteePerson(null); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const batches = [...new Set(members.map(m => m.batch))].sort((a, b) => a - b);
  const filtered = members
    .filter(m => {
      const matchBatch = batchFilter ? m.batch === parseInt(batchFilter) : true;
      const matchBloodGroup = bloodGroupFilter ? m.blood_group === bloodGroupFilter : true;
      const matchSearch = searchQuery
        ? m.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || m.email.toLowerCase().includes(searchQuery.toLowerCase())
        : true;
      return matchBatch && matchBloodGroup && matchSearch;
    })
    .sort((a, b) => a.batch !== b.batch ? a.batch - b.batch : a.full_name.localeCompare(b.full_name));

  const sortedCommittees = [...committees].sort((a, b) => b.acting_year - a.acting_year);
  const currentYear = sortedCommittees[0]?.acting_year ?? null;

  return (
    <div className="bg-[#F5F7FA]">
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
          <p className="text-gray-300 text-lg max-w-xl mx-auto">
            Meet the members and leaders who make STATA what it is
          </p>
        </div>
      </section>

      <div className="bg-white border-b border-gray-200 sticky top-16 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 flex">
          <button onClick={() => setActiveTab("members")}
            className={`px-6 py-4 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${activeTab === "members" ? "border-[#2F5BEA] text-[#2F5BEA]" : "border-transparent text-gray-400 hover:text-gray-600"}`}>
            <Users className="w-4 h-4" />
            All Members
            {!loadingMembers && (
              <span className="bg-[#2F5BEA] text-white text-xs px-2 py-0.5 rounded-full">{members.length}</span>
            )}
          </button>
          <button onClick={() => setActiveTab("committees")}
            className={`px-6 py-4 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${activeTab === "committees" ? "border-[#F39C12] text-[#F39C12]" : "border-transparent text-gray-400 hover:text-gray-600"}`}>
            <Crown className="w-4 h-4" />
            Leaders
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {activeTab === "members" && (
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
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {loadingMembers ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-gray-50">
                    <Skeleton className="w-9 h-9 rounded-full flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <Users className="w-12 h-12 mx-auto mb-3 text-gray-200" />
                <p className="text-gray-400 font-medium">No members found</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[#F5F7FA] border-b border-gray-100">
                        <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider w-10">#</th>
                        <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Name</th>
                        <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Batch</th>
                        <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider hidden md:table-cell">Email</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filtered.map((member, idx) => {
                        const photoSrc = imageUrl(member.photo_url);
                        const bgColor = member.is_president_or_secretary
                          ? 'bg-amber-500'
                          : member.is_committee_member
                            ? 'bg-[#2F5BEA]'
                            : 'bg-[#1F2A44]';
                        return (
                          <tr key={member.id} onClick={() => setSelectedMember(member)}
                            className={`cursor-pointer transition-colors ${member.is_president_or_secretary ? "bg-amber-50/50 hover:bg-amber-50" :
                              member.is_committee_member ? "bg-blue-50/30 hover:bg-blue-50" : "hover:bg-gray-50"
                              }`}>
                            <td className="px-5 py-4 text-gray-300 text-xs font-medium">{idx + 1}</td>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                {photoSrc
                                  ? <img src={photoSrc} alt={member.full_name} className="w-9 h-9 rounded-full object-cover border-2 border-white shadow-sm flex-shrink-0 ring-1 ring-gray-100" />
                                  : <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${bgColor}`}>
                                    {member.full_name.charAt(0).toUpperCase()}
                                  </div>
                                }
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-semibold text-[#1F2A44]">{member.full_name}</span>
                                  {member.is_president_or_secretary && (
                                    <span className="inline-flex items-center gap-0.5 bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full border border-amber-200 font-semibold">
                                      <Crown className="w-2.5 h-2.5" /> Leader
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <span className="bg-[#1F2A44] text-white text-xs px-2.5 py-0.5 rounded-full font-medium">{member.batch}</span>
                            </td>
                            <td className="px-5 py-4 text-gray-400 text-sm hidden md:table-cell">{member.email}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="px-5 py-3.5 bg-[#F5F7FA] border-t border-gray-100 text-xs text-gray-400 font-medium">
                  Showing {filtered.length} of {members.length} members
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "committees" && (
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
                        <div className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold shadow-sm ${isCurrent ? "bg-[#2F5BEA] text-white" : "bg-white text-[#1F2A44] border border-gray-200"
                          }`}>
                          {isCurrent && <span className="w-2 h-2 rounded-full bg-white animate-pulse" />}
                          {isCurrent ? "Current Committee" : `${committee.acting_year}`}
                        </div>
                        <div className="flex-1 h-px bg-gray-200" />
                      </div>
                      <div className="grid grid-cols-2 gap-6 max-w-2xl">
                        <CommitteeCard
                          person={committee.president} role="President"
                          year={committee.acting_year} isCurrent={isCurrent}
                          color="bg-amber-500" icon={<Crown className="w-4 h-4 text-white" />}
                          onSelect={() => committee.president && setSelectedCommitteePerson({
                            person: committee.president, role: "President", year: committee.acting_year,
                          })}
                        />
                        <CommitteeCard
                          person={committee.general_secretary} role="General Secretary"
                          year={committee.acting_year} isCurrent={isCurrent}
                          color="bg-[#2F5BEA]" icon={<Star className="w-4 h-4 text-white" />}
                          onSelect={() => committee.general_secretary && setSelectedCommitteePerson({
                            person: committee.general_secretary, role: "General Secretary", year: committee.acting_year,
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

      {selectedMember && <MemberModal member={selectedMember} onClose={() => setSelectedMember(null)} />}
      {selectedCommitteePerson && (
        <CommitteeMemberModal
          person={selectedCommitteePerson.person}
          role={selectedCommitteePerson.role}
          year={selectedCommitteePerson.year}
          onClose={() => setSelectedCommitteePerson(null)}
        />
      )}
    </div>
  );
}