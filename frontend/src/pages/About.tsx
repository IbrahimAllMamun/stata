import { Heart, Users, Target, Award } from 'lucide-react';

export default function About() {
  return (
    <div>
      <section className="bg-gradient-to-r from-[#1F2A44] to-[#2F5BEA] text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">About STATA</h1>
          <p className="text-lg md:text-xl text-gray-200">
            Student Welfare Organization of ISRT, University of Dhaka
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-16">
          <div>
            <h2 className="text-3xl font-bold text-[#1F2A44] mb-4">Who We Are</h2>
            <p className="text-lg text-gray-600 mb-4 leading-relaxed">
              STATA is the student welfare organization of the Institute of Statistical Research and Training (ISRT),
              University of Dhaka. We are a passionate group of students dedicated to creating a supportive and
              vibrant community for all ISRT students and alumni.
            </p>
            <p className="text-lg text-gray-600 leading-relaxed">
              Founded with the vision of improving mental health and strengthening social bonds, STATA organizes
              various activities throughout the year that bring students together, create lasting memories, and
              foster a sense of belonging.
            </p>
          </div>
          <div className="bg-gradient-to-br from-[#2F5BEA] to-[#2ECC71] rounded-lg p-8 text-white">
            <blockquote className="text-xl italic">
              "Connecting Minds, Building Bonds, Nourishing Well-being."
            </blockquote>
            <p className="mt-4 text-gray-200">
              This is more than just our motto — it's our commitment to every student at ISRT.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="w-12 h-12 bg-[#2F5BEA] rounded-full flex items-center justify-center mb-4">
              <Target className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-[#1F2A44] mb-2">Our Vision</h3>
            <p className="text-gray-600">
              To create a supportive ecosystem where every ISRT student thrives academically, socially, and emotionally.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="w-12 h-12 bg-[#2ECC71] rounded-full flex items-center justify-center mb-4">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-[#1F2A44] mb-2">Mental Health</h3>
            <p className="text-gray-600">
              Prioritizing student well-being through activities that reduce stress and promote positive mental health.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="w-12 h-12 bg-[#F39C12] rounded-full flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-[#1F2A44] mb-2">Community</h3>
            <p className="text-gray-600">
              Building lasting friendships and professional networks that extend beyond university years.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="w-12 h-12 bg-[#E74C3C] rounded-full flex items-center justify-center mb-4">
              <Award className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-[#1F2A44] mb-2">Excellence</h3>
            <p className="text-gray-600">
              Striving for excellence in all our activities while maintaining an inclusive and welcoming environment.
            </p>
          </div>
        </div>

        <div className="bg-[#F5F7FA] rounded-lg p-8 md:p-12">
          <h2 className="text-3xl font-bold text-[#1F2A44] mb-6 text-center">What We Do</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold text-[#2F5BEA] mb-3">Social Events</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start">
                  <span className="text-[#F39C12] mr-2">•</span>
                  <span>BBQ parties bringing students together in a relaxed atmosphere</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#F39C12] mr-2">•</span>
                  <span>Iftar Mahfil during Ramadan for community bonding</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#F39C12] mr-2">•</span>
                  <span>Khashi parties celebrating special occasions</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#F39C12] mr-2">•</span>
                  <span>Educational tours to explore and learn together</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-[#2F5BEA] mb-3">Sports & Recreation</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start">
                  <span className="text-[#F39C12] mr-2">•</span>
                  <span>Annual cricket tournaments for sports enthusiasts</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#F39C12] mr-2">•</span>
                  <span>Football tournaments promoting teamwork and fitness</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#F39C12] mr-2">•</span>
                  <span>Regular recreational activities and games</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#F39C12] mr-2">•</span>
                  <span>Collaborative events with other university organizations</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-[#1F2A44] mb-6 text-center">Alumni Bridge</h2>
          <p className="text-lg text-gray-600 text-center max-w-3xl mx-auto mb-12">
            One of STATA's unique initiatives is serving as a bridge between current students and alumni.
            We facilitate networking opportunities, mentorship programs, and knowledge-sharing sessions
            that help students navigate their academic journey and prepare for their professional careers.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-[#F5F7FA] p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-[#1F2A44] mb-3">Mentorship</h3>
              <p className="text-gray-600">
                Connect with experienced alumni who provide guidance on academics, career paths, and life after university.
              </p>
            </div>
            <div className="bg-[#F5F7FA] p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-[#1F2A44] mb-3">Networking</h3>
              <p className="text-gray-600">
                Build professional relationships that can open doors to internships, jobs, and collaborative opportunities.
              </p>
            </div>
            <div className="bg-[#F5F7FA] p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-[#1F2A44] mb-3">Knowledge Sharing</h3>
              <p className="text-gray-600">
                Learn from alumni experiences through talks, workshops, and informal discussions about various fields.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
