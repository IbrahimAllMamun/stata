// src/pages/Contact.tsx
import { useState } from 'react';
import { Mail, MapPin, Phone, Facebook, Twitter, Instagram, Send, CheckCircle } from 'lucide-react';
export default function Contact() {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setFormData({ name: '', email: '', subject: '', message: '' });
    setTimeout(() => setSubmitted(false), 5000);
  };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  const inputCls = 'w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#2F5BEA] focus:border-transparent outline-none transition-all bg-white';
  return (
    <div className="bg-[#F5F7FA]">
      <section className="relative bg-[#1F2A44] text-white overflow-hidden">
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#2F5BEA] rounded-full -translate-x-1/2 translate-y-1/2" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#F39C12] rounded-full translate-x-1/2 -translate-y-1/2" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 py-20 text-center">
          <div className="inline-block bg-[#2F5BEA]/20 border border-[#2F5BEA]/30 text-[#7BA3F5] text-xs font-bold tracking-widest uppercase px-4 py-1.5 rounded-full mb-5">Get In Touch</div>
          <h1 className="text-5xl md:text-6xl font-extrabold mb-4 tracking-tight">Contact Us</h1>
          <p className="text-gray-300 text-lg max-w-xl mx-auto">We would love to hear from you!</p>
        </div>
      </section>
      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
          <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-[#2F5BEA] px-7 py-5">
              <h2 className="text-xl font-bold text-white">Send Us a Message</h2>
              <p className="text-blue-200 text-sm mt-1">We typically reply within 24 hours</p>
            </div>
            <div className="p-7">
              {submitted && (
                <div className="mb-6 bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl flex items-center gap-3 text-sm">
                  <CheckCircle className="w-5 h-5 flex-shrink-0" /> Thank you! We will get back to you soon.
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Your Name</label><input type="text" name="name" value={formData.name} onChange={handleChange} required className={inputCls} placeholder="John Doe" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label><input type="email" name="email" value={formData.email} onChange={handleChange} required className={inputCls} placeholder="john@example.com" /></div>
                </div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Subject</label><input type="text" name="subject" value={formData.subject} onChange={handleChange} required className={inputCls} placeholder="What is this about?" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Message</label><textarea name="message" value={formData.message} onChange={handleChange} required rows={5} className={inputCls + ' resize-none'} placeholder="Tell us what's on your mind..." /></div>
                <button type="submit" className="w-full bg-[#2F5BEA] hover:bg-[#1a3fc7] text-white px-6 py-3.5 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm">
                  <Send className="w-4 h-4" /> Send Message
                </button>
              </form>
            </div>
          </div>
          <div className="lg:col-span-2 space-y-5">
            {[
              { icon: MapPin, color: 'bg-[#2F5BEA]', title: 'Address', lines: ['Institute of Statistical Research', 'and Training (ISRT)', 'University of Dhaka, Dhaka 1000'] },
              { icon: Mail, color: 'bg-[#2ECC71]', title: 'Email', lines: ['stata@isrt.ac.bd', 'info@stata.org.bd'] },
              { icon: Phone, color: 'bg-[#F39C12]', title: 'Phone', lines: ['+880 123 456 789', '+880 987 654 321'] },
            ].map(({ icon: Icon, color, title, lines }) => (
              <div key={title} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-start gap-4">
                <div className={`w-11 h-11 ${color} rounded-xl flex items-center justify-center flex-shrink-0`}><Icon className="w-5 h-5 text-white" /></div>
                <div><h3 className="font-bold text-[#1F2A44] mb-1">{title}</h3>{lines.map((l, i) => <p key={i} className="text-gray-500 text-sm">{l}</p>)}</div>
              </div>
            ))}
            <div className="bg-[#1F2A44] rounded-2xl p-6">
              <h3 className="font-bold text-white mb-2">Follow Us</h3>
              <p className="text-gray-400 text-sm mb-4">Stay connected for the latest updates and events.</p>
              <div className="flex gap-3">
                {[Facebook, Twitter, Instagram].map((Icon, i) => (
                  <a key={i} href="#" className="w-10 h-10 bg-white/10 hover:bg-[#F39C12] rounded-xl flex items-center justify-center transition-colors"><Icon className="w-5 h-5 text-white" /></a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
