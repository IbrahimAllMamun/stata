// src/pages/Contact.tsx
import { useState } from 'react';
import { Mail, MapPin, Phone, Facebook, Twitter, Instagram, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { contactApi } from '../lib/api';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '', email: '', subject: '', message: '', batch: '', designation: '',
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');
    try {
      await contactApi.submit({
        name: formData.name,
        email: formData.email,
        subject: formData.subject,
        message: formData.message,
        ...(formData.batch ? { batch: formData.batch } : {}),
        ...(formData.designation ? { designation: formData.designation } : {}),
      });
      setStatus('success');
      setFormData({ name: '', email: '', subject: '', message: '', batch: '', designation: '' });
      setTimeout(() => setStatus('idle'), 6000);
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err.message || 'Failed to send message. Please try again.');
      setTimeout(() => setStatus('idle'), 5000);
    }
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

          {/* Form */}
          <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-[#2F5BEA] px-7 py-5">
              <h2 className="text-xl font-bold text-white">Send Us a Message</h2>
              <p className="text-blue-200 text-sm mt-1">We typically reply within 24 hours</p>
            </div>
            <div className="p-7">
              {status === 'success' && (
                <div className="mb-6 bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl flex items-center gap-3 text-sm">
                  <CheckCircle className="w-5 h-5 flex-shrink-0" />
                  Thank you! Your message has been sent. We'll get back to you soon.
                </div>
              )}
              {status === 'error' && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3 text-sm">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Name + Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Your Name <span className="text-red-400">*</span></label>
                    <input type="text" name="name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                      required className={inputCls} placeholder="John Doe" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address <span className="text-red-400">*</span></label>
                    <input type="email" name="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
                      required className={inputCls} placeholder="example@isrt.ac.bd" />
                  </div>
                </div>

                {/* Batch + Designation (optional) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Batch
                    </label>
                    <input type="number" name="batch" value={formData.batch} min={1} max={3000}
                      onChange={e => setFormData({ ...formData, batch: e.target.value })}
                      className={inputCls} placeholder="e.g. 26" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Designation
                    </label>
                    <input type="text" name="designation" value={formData.designation}
                      onChange={e => setFormData({ ...formData, designation: e.target.value })}
                      className={inputCls} placeholder="e.g. Data Scientist" />
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject <span className="text-red-400">*</span></label>
                  <input type="text" name="subject" value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })}
                    required className={inputCls} placeholder="What is this about?" />
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Message <span className="text-red-400">*</span></label>
                  <textarea name="message" value={formData.message} onChange={e => setFormData({ ...formData, message: e.target.value })}
                    required rows={5} className={inputCls + ' resize-none'} placeholder="Tell us what's on your mind..." />
                </div>

                <button type="submit" disabled={status === 'loading'}
                  className="w-full bg-[#2F5BEA] hover:bg-[#1a3fc7] text-white px-6 py-3.5 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-60">
                  {status === 'loading'
                    ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Sending…</>
                    : <><Send className="w-4 h-4" /> Send Message</>
                  }
                </button>
              </form>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-2 space-y-5">
            {[
              { icon: MapPin, color: 'bg-[#2F5BEA]', title: 'Address', lines: ['Institute of Statistical Research', 'and Training (ISRT)', 'University of Dhaka, Dhaka 1000'] },
              { icon: Mail, color: 'bg-[#2ECC71]', title: 'Email', lines: ['stata@isrt.ac.bd', 'info@stata.org.bd'] },
              { icon: Phone, color: 'bg-[#F39C12]', title: 'Phone', lines: ['+880 123 456 789', '+880 987 654 321'] },
            ].map(({ icon: Icon, color, title, lines }) => (
              <div key={title} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-start gap-4">
                <div className={`w-11 h-11 ${color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-[#1F2A44] mb-1">{title}</h3>
                  {lines.map((l, i) => <p key={i} className="text-gray-500 text-sm">{l}</p>)}
                </div>
              </div>
            ))}
            <div className="bg-[#1F2A44] rounded-2xl p-6">
              <h3 className="font-bold text-white mb-2">Follow Us</h3>
              <p className="text-gray-400 text-sm mb-4">Stay connected for the latest updates and events.</p>
              <div className="flex gap-3">
                {[Facebook, Twitter, Instagram].map((Icon, i) => (
                  <a key={i} href="#" className="w-10 h-10 bg-white/10 hover:bg-[#F39C12] rounded-xl flex items-center justify-center transition-colors">
                    <Icon className="w-5 h-5 text-white" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
