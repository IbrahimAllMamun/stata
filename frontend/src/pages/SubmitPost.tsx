// src/pages/SubmitPost.tsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Send, Upload, CheckCircle, Clock, ArrowLeft, FileText } from 'lucide-react';
import { postApi } from '../lib/api';
import MarkdownEditor from '../components/MarkdownEditor';

function SuccessModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Top accent */}
        <div className="h-1.5 bg-gradient-to-r from-[#2F5BEA] via-[#F39C12] to-[#2ECC71]" />
        <div className="p-8 text-center">
          {/* Icon */}
          <div className="relative inline-flex mb-6">
            <div className="w-20 h-20 bg-[#2ECC71]/10 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-[#2ECC71]" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center border-2 border-white">
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
          </div>

          <h2 className="text-2xl font-extrabold text-[#1F2A44] mb-2">Post Submitted!</h2>
          <p className="text-gray-500 text-sm mb-6">
            Thank you for your submission. Your post is now under review by our team.
          </p>

          {/* Status card */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-left">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Pending Review</span>
            </div>
            <p className="text-sm text-amber-700">
              An admin or moderator will review your post shortly. Once approved, it will appear publicly on the Posts page.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={onClose}
              className="flex-1 bg-[#2F5BEA] hover:bg-[#1a3fc7] text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors">
              Submit Another
            </button>
            <Link to="/posts"
              className="flex-1 border border-gray-200 hover:border-[#2F5BEA] text-gray-600 hover:text-[#2F5BEA] px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors text-center">
              View All Posts
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SubmitPost() {
  const [formData, setFormData] = useState({
    title: '', content: '', author_name: '', author_batch: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('title', formData.title);
      fd.append('content', formData.content);
      fd.append('author_name', formData.author_name);
      fd.append('author_batch', formData.author_batch);
      if (imageFile) fd.append('cover_image', imageFile);
      await postApi.submit(fd);
      setShowSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to submit post. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({ title: '', content: '', author_name: '', author_batch: '' });
    setImageFile(null);
    setImagePreview(null);
    setShowSuccess(false);
    setError('');
  };

  const inputCls = 'w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#2F5BEA] focus:border-transparent outline-none transition-all bg-white';

  return (
    <div className="bg-[#F5F7FA] min-h-[calc(100vh-4rem)]">
      {/* Hero */}
      <section className="relative bg-[#1F2A44] text-white overflow-hidden">
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div className="absolute top-0 left-0 w-96 h-96 bg-[#F39C12] rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-[#2F5BEA] rounded-full translate-x-1/2 translate-y-1/2" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 py-16 text-center">
          <div className="inline-block bg-[#2F5BEA]/20 border border-[#2F5BEA]/30 text-[#7BA3F5] text-xs font-bold tracking-widest uppercase px-4 py-1.5 rounded-full mb-5">Community</div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-3 tracking-tight">Share Your Story</h1>
          <p className="text-gray-300 text-base max-w-xl mx-auto">Write a post for the STATA community. Your submission will be reviewed before publishing.</p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 py-12">
        <Link to="/posts" className="inline-flex items-center gap-2 text-gray-500 hover:text-[#2F5BEA] mb-6 text-sm font-medium transition-colors group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" /> Back to Posts
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-[#1F2A44] px-7 py-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Submit a Post</h2>
              <p className="text-gray-400 text-xs mt-0.5">Posts are reviewed before appearing publicly</p>
            </div>
            <div className="ml-auto flex items-center gap-1.5 bg-amber-500/20 text-amber-300 text-xs font-semibold px-3 py-1.5 rounded-full">
              <Clock className="w-3 h-3" /> Pending review
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-7 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>
            )}

            {/* Author info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Your Name <span className="text-red-400">*</span>
                </label>
                <input type="text" value={formData.author_name}
                  onChange={e => setFormData({ ...formData, author_name: e.target.value })}
                  required placeholder="Full name" className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Batch <span className="text-red-400">*</span>
                </label>
                <input type="number" value={formData.author_batch} min={1} max={3000}
                  onChange={e => setFormData({ ...formData, author_batch: e.target.value })}
                  required placeholder="e.g. 26" className={inputCls} />
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Post Title <span className="text-red-400">*</span>
              </label>
              <input type="text" value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                required placeholder="Enter a clear, descriptive title" className={inputCls} />
            </div>

            {/* Cover image */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Cover Image <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-5 text-center hover:border-[#2F5BEA] transition-colors">
                <input type="file" accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleImageChange} className="hidden" id="cover_image" />
                <label htmlFor="cover_image" className="cursor-pointer flex flex-col items-center gap-2">
                  <Upload className="w-7 h-7 text-gray-300" />
                  <span className="text-sm text-gray-400">Click to upload · jpg, png, webp · max 2 MB</span>
                </label>
              </div>
              {imagePreview && <img src={imagePreview} alt="Preview" className="mt-3 w-full max-h-52 object-cover rounded-xl" />}
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Content <span className="text-red-400">*</span>
              </label>
              <MarkdownEditor
                value={formData.content}
                onChange={content => setFormData({ ...formData, content })}
                placeholder={"Write your post here...\n\nUse **bold**, *italic*, ## headings, - lists, > quotes, `code`..."}
                minRows={14}
              />
            </div>

            <button type="submit" disabled={submitting}
              className="w-full bg-[#2F5BEA] hover:bg-[#1a3fc7] text-white px-6 py-3.5 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-60 text-sm">
              {submitting
                ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Submitting…</>
                : <><Send className="w-4 h-4" /> Post</>
              }
            </button>
          </form>
        </div>
      </section>

      {showSuccess && <SuccessModal onClose={resetForm} />}
    </div>
  );
}
