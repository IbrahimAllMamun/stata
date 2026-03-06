// src/pages/About.tsx
import { Heart, Users, Target, Award, Utensils, Trophy, GraduationCap, Handshake } from 'lucide-react';
export default function About() {
  return (
    <div className="bg-[#F5F7FA]">
      <section className="relative bg-[#1F2A44] text-white overflow-hidden">
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div className="absolute top-0 left-0 w-96 h-96 bg-[#2F5BEA] rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-[#F39C12] rounded-full translate-x-1/2 translate-y-1/2" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 py-20 text-center">
          <div className="inline-block bg-[#2F5BEA]/20 border border-[#2F5BEA]/30 text-[#7BA3F5] text-xs font-bold tracking-widest uppercase px-4 py-1.5 rounded-full mb-5">ISRT · University of Dhaka</div>
          <h1 className="text-5xl md:text-6xl font-extrabold mb-4 tracking-tight">About STATA</h1>
          <p className="text-gray-300 text-lg max-w-xl mx-auto">Student Welfare Organization of ISRT, University of Dhaka</p>
        </div>
      </section>
      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-xs font-bold tracking-widest uppercase text-[#2F5BEA] mb-3 block">Who We Are</span>
            <h2 className="text-3xl md:text-4xl font-bold text-[#1F2A44] mb-5 leading-tight">More Than Just a Student Organization</h2>
            <p className="text-gray-500 mb-4 leading-relaxed">STATA is the student welfare organization of the Institute of Statistical Research and Training (ISRT), University of Dhaka. We are a passionate group of students dedicated to creating a supportive and vibrant community for all ISRT students and alumni.</p>
            <p className="text-gray-500 leading-relaxed">Founded with the vision of improving mental health and strengthening social bonds, STATA organizes various activities throughout the year that bring students together, create lasting memories, and foster a sense of belonging.</p>
          </div>
          <div className="bg-gradient-to-br from-[#2F5BEA] to-[#1F2A44] rounded-2xl p-8 text-white shadow-xl">
            <div className="text-5xl mb-4 opacity-20 font-serif leading-none">"</div>
            <blockquote className="text-xl font-medium leading-relaxed mb-5">Connecting Minds, Building Bonds, Nourishing Well-being.</blockquote>
            <p className="text-blue-200 text-sm">This is more than just our motto — it is our commitment to every student at ISRT.</p>
          </div>
        </div>
      </section>
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-xs font-bold tracking-widest uppercase text-[#2F5BEA] mb-3 block">What Drives Us</span>
            <h2 className="text-3xl md:text-4xl font-bold text-[#1F2A44]">Our Core Values</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { icon: Target, color: 'bg-[#2F5BEA]', title: 'Our Vision', desc: 'To create a supportive ecosystem where every ISRT student thrives academically, socially, and emotionally.' },
              { icon: Heart, color: 'bg-[#2ECC71]', title: 'Mental Health', desc: 'Prioritizing student well-being through activities that reduce stress and promote positive mental health.' },
              { icon: Users, color: 'bg-[#F39C12]', title: 'Community', desc: 'Building lasting friendships and professional networks that extend beyond university years.' },
              { icon: Award, color: 'bg-[#E74C3C]', title: 'Excellence', desc: 'Striving for excellence in all activities while maintaining an inclusive and welcoming environment.' },
            ].map(({ icon: Icon, color, title, desc }) => (
              <div key={title} className="bg-[#F5F7FA] p-6 rounded-2xl border border-gray-100 hover:shadow-md transition-shadow">
                <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center mb-4`}><Icon className="w-6 h-6 text-white" /></div>
                <h3 className="text-lg font-bold text-[#1F2A44] mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <span className="text-xs font-bold tracking-widest uppercase text-[#2F5BEA] mb-3 block">Activities</span>
          <h2 className="text-3xl md:text-4xl font-bold text-[#1F2A44]">What We Do</h2>
          <p className="text-gray-500 mt-3 max-w-xl mx-auto">From social gatherings to sporting events, we bring students together in meaningful ways</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { icon: Utensils, color: 'bg-[#F39C12]', title: 'Social Events', items: ['BBQ parties bringing students together in a relaxed atmosphere', 'Iftar Mahfil during Ramadan for community bonding', 'Khashi parties celebrating special occasions', 'Educational tours to explore and learn together'] },
            { icon: Trophy, color: 'bg-[#E74C3C]', title: 'Sports & Recreation', items: ['Annual cricket tournaments for sports enthusiasts', 'Football tournaments promoting teamwork and fitness', 'Regular recreational activities and games', 'Collaborative events with other university organizations'] },
          ].map(({ icon: Icon, color, title, items }) => (
            <div key={title} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className={`${color} px-6 py-4 flex items-center gap-3`}><Icon className="w-5 h-5 text-white" /><h3 className="font-bold text-white text-lg">{title}</h3></div>
              <ul className="p-6 space-y-3">{items.map((item, i) => (<li key={i} className="flex items-start gap-3 text-gray-500 text-sm"><span className="w-5 h-5 rounded-full bg-[#F5F7FA] flex items-center justify-center flex-shrink-0 mt-0.5"><span className="w-1.5 h-1.5 rounded-full bg-[#F39C12]" /></span>{item}</li>))}</ul>
            </div>
          ))}
        </div>
      </section>
      <section className="bg-[#1F2A44] py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs font-bold tracking-widest uppercase text-[#F39C12] mb-3 block">Alumni Network</span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Alumni Bridge</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">STATA serves as a bridge between current students and alumni, facilitating networking, mentorship, and knowledge-sharing.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: GraduationCap, title: 'Mentorship', desc: 'Connect with experienced alumni who provide guidance on academics, career paths, and life after university.' },
              { icon: Handshake, title: 'Networking', desc: 'Build professional relationships that open doors to internships, jobs, and collaborative opportunities.' },
              { icon: Users, title: 'Knowledge Sharing', desc: 'Learn from alumni through talks, workshops, and informal discussions about various fields.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors">
                <Icon className="w-8 h-8 text-[#F39C12] mb-4" />
                <h3 className="font-bold text-white text-lg mb-2">{title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
