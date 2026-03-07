// src/lib/api.ts
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const getToken = (): string | null => localStorage.getItem('stata_token');
export const setToken = (token: string) => localStorage.setItem('stata_token', token);
export const removeToken = () => localStorage.removeItem('stata_token');

interface RequestOptions {
  method?: string;
  body?: unknown;
  isFormData?: boolean;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, isFormData = false } = options;

  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!isFormData && body) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: isFormData
      ? (body as FormData)
      : body
        ? JSON.stringify(body)
        : undefined,
  });

  const data = await res.json();
  if (!res.ok) {
    // Surface the actual validation errors, not just the generic message
    if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
      throw new Error(data.errors.join(', '));
    }
    throw new Error(data.message || 'Request failed');
  }
  return data;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface Member {
  id: string;
  batch: number;
  full_name: string;
  email: string;
  phone_number: string;
  alternative_phone?: string | null;
  job_title?: string | null;
  organisation?: string | null;
  organisation_address?: string | null;
  notify_events: boolean;
  created_at: string;
  is_committee_member: boolean;
  is_president_or_secretary: boolean;
}

export interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  cover_image?: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  published: boolean;
  author_name: string;
  author_batch: number;
  created_at: string;
  updated_at: string;
  admin?: { id: string; username: string };
}

export interface Event {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  event_date: string;
  location?: string | null;
  banner_image?: string | null;
  is_upcoming: boolean;
  created_at: string;
  updated_at: string;
  admin?: { id: string; username: string };
}

export interface CommitteeMemberDetail {
  id: string;
  full_name: string;
  email: string;
  batch: number;
  job_title?: string | null;
  organisation?: string | null;
  image_url: string;
  committee_member_id: string;
}

export interface Committee {
  id: string;
  acting_year: number;
  president: CommitteeMemberDetail | null;
  general_secretary: CommitteeMemberDetail | null;
  created_at: string;
}

export interface DashboardStats {
  pending_members: number;
  total_members: number;
  total_committees: number;
  total_posts: number;
  total_events: number;
  upcoming_events: number;
  past_events: number;
  unread_messages: number;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  batch?: number | null;
  designation?: string | null;
  status: 'UNREAD' | 'READ' | 'ARCHIVED';
  featured: boolean;
  created_at: string;
}

export interface Speech {
  id: string;
  name: string;
  designation?: string | null;
  batch?: number | null;
  message: string;
  created_at: string;
}

export interface GalleryPhoto {
  id: string;
  image_url: string;
  caption?: string | null;
  moment_date: string;
  created_at: string;
  admin?: { id: string; username: string };
}

export interface GalleryGroup {
  date: string; // YYYY-MM-DD
  photos: GalleryPhoto[];
}

export const contactApi = {
  submit: (data: { name: string; email: string; subject: string; message: string; batch?: string; designation?: string }) =>
    request<{ success: boolean; message: string; data: { id: string } }>('/contact', {
      method: 'POST', body: data,
    }),
};

export const speechApi = {
  getAll: () =>
    request<{ success: boolean; data: Speech[] }>('/speeches'),
};

export const postApi = {
  submit: (formData: FormData) =>
    request<{ success: boolean; message: string; data: { id: string } }>('/posts', {
      method: 'POST', body: formData, isFormData: true,
    }),
};

export const api = {
  register: (data: {
    batch: number;
    full_name: string;
    email: string;
    phone_number: string;
    notify_events: boolean;
    alternative_phone?: string;
    job_title?: string;
    organisation?: string;
    organisation_address?: string;
  }) =>
    request<{ success: boolean; message: string; data: { id: string } }>('/register', {
      method: 'POST',
      body: data,
    }),

  getMembers: (params?: { batch?: number; page?: number; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.batch) qs.set('batch', String(params.batch));
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    return request<{ success: boolean; data: Member[]; pagination: Pagination }>(`/members?${qs}`);
  },

  getCommittees: () =>
    request<{ success: boolean; data: Committee[] }>('/committees'),

  getPosts: (params?: { page?: number; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    return request<{ success: boolean; data: Post[]; pagination: Pagination }>(`/posts?${qs}`);
  },

  getPostBySlug: (slug: string) =>
    request<{ success: boolean; data: Post }>(`/posts/${slug}`),

  getEvents: (type?: 'upcoming' | 'past') => {
    const qs = type ? `?type=${type}` : '';
    return request<{ success: boolean; data: Event[]; pagination: Pagination }>(`/events${qs}`);
  },

  getGallery: (params?: { from?: string; to?: string }) => {
    const qs = new URLSearchParams();
    if (params?.from) qs.set('from', params.from);
    if (params?.to) qs.set('to', params.to);
    const q = qs.toString();
    return request<{ success: boolean; data: GalleryGroup[]; total: number }>(`/gallery${q ? '?' + q : ''}`);
  },

  getGalleryDates: () =>
    request<{ success: boolean; data: string[] }>('/gallery/dates'),
};

export const adminApi = {
  login: (username: string, password: string) =>
    request<{
      success: boolean;
      data: { token: string; admin: { id: string; username: string; role: string } };
    }>('/admin/login', { method: 'POST', body: { username, password } }),

  getDashboard: () =>
    request<{ success: boolean; data: DashboardStats }>('/admin/dashboard'),

  getPosts: (params?: { page?: number; limit?: number; status?: string }) => {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.status) qs.set('status', params.status);
    return request<{ success: boolean; data: Post[]; pagination: Pagination }>(`/admin/posts?${qs}`);
  },

  getPendingPostCount: () =>
    request<{ success: boolean; data: { count: number } }>('/admin/posts/pending-count'),

  approvePost: (id: string) =>
    request<{ success: boolean; data: Post }>(`/admin/posts/${id}/approve`, { method: 'PATCH' }),

  rejectPost: (id: string) =>
    request<{ success: boolean; data: Post }>(`/admin/posts/${id}/reject`, { method: 'PATCH' }),

  createPost: (formData: FormData) =>
    request<{ success: boolean; data: Post }>('/admin/posts', {
      method: 'POST',
      body: formData,
      isFormData: true,
    }),

  updatePost: (id: string, formData: FormData) =>
    request<{ success: boolean; data: Post }>(`/admin/posts/${id}`, {
      method: 'PUT',
      body: formData,
      isFormData: true,
    }),

  deletePost: (id: string) =>
    request<{ success: boolean; message: string }>(`/admin/posts/${id}`, { method: 'DELETE' }),

  togglePost: (id: string) =>
    request<{ success: boolean; data: { id: string; published: boolean } }>(
      `/admin/posts/${id}/toggle`,
      { method: 'PATCH' }
    ),

  createEvent: (formData: FormData) =>
    request<{ success: boolean; data: Event }>('/admin/events', {
      method: 'POST',
      body: formData,
      isFormData: true,
    }),

  updateEvent: (id: string, formData: FormData) =>
    request<{ success: boolean; data: Event }>(`/admin/events/${id}`, {
      method: 'PUT',
      body: formData,
      isFormData: true,
    }),

  deleteEvent: (id: string) =>
    request<{ success: boolean; message: string }>(`/admin/events/${id}`, { method: 'DELETE' }),

  createCommittee: (acting_year: number) =>
    request<{ success: boolean; data: Committee }>('/admin/committee', {
      method: 'POST',
      body: { acting_year },
    }),

  assignCommitteeMember: (formData: FormData) =>
    request('/admin/committee/assign', {
      method: 'POST',
      body: formData,
      isFormData: true,
    }),

  getMembersByStatus: (status: string) =>
    request<{ success: boolean; data: any[]; pagination: Pagination }>(`/admin/members?status=${status}`),

  updateMemberStatus: (id: string, status: string) =>
    request<{ success: boolean }>(`/admin/members/${id}/status`, {
      method: 'PATCH',
      body: { status },
    }),

  deleteMember: (id: string) =>
    request<{ success: boolean }>(`/admin/members/${id}`, { method: 'DELETE' }),

  getPendingCount: () =>
    request<{ success: boolean; data: { count: number } }>('/admin/members/pending-count'),

  createModerator: (username: string, password: string) =>
    request<{ success: boolean; data: { id: string; username: string; role: string } }>('/admin/moderators', {
      method: 'POST',
      body: { username, password },
    }),

  deleteCommittee: (id: string) =>
    request<{ success: boolean; message: string }>(`/admin/committee/${id}`, { method: 'DELETE' }),

  exportMembersCSV: (filters: { batch?: number | ''; notify_events?: boolean | '' }) => {
    const qs = new URLSearchParams();
    if (filters.batch !== undefined && filters.batch !== '') qs.set('batch', String(filters.batch));
    if (filters.notify_events !== undefined && filters.notify_events !== '') qs.set('notify_events', String(filters.notify_events));
    const token = getToken();
    const url = `${BASE_URL}/admin/members/export-csv${qs.toString() ? '?' + qs.toString() : ''}`;
    return fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  },

  getApprovedBatches: () =>
    request<{ success: boolean; data: number[] }>('/admin/members/batches'),

  getMessages: (params?: { status?: string; page?: number; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.status) qs.set('status', params.status);
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    return request<{ success: boolean; data: ContactMessage[]; pagination: Pagination }>(`/admin/messages?${qs}`);
  },

  getUnreadMessageCount: () =>
    request<{ success: boolean; data: { count: number } }>('/admin/messages/unread-count'),

  updateMessageStatus: (id: string, status: 'UNREAD' | 'READ' | 'ARCHIVED') =>
    request<{ success: boolean; data: ContactMessage }>(`/admin/messages/${id}/status`, {
      method: 'PATCH',
      body: { status },
    }),

  deleteMessage: (id: string) =>
    request<{ success: boolean; message: string }>(`/admin/messages/${id}`, { method: 'DELETE' }),

  toggleFeatured: (id: string) =>
    request<{ success: boolean; data: ContactMessage }>(`/admin/messages/${id}/feature`, { method: 'PATCH' }),

  // Gallery
  getGallery: () =>
    request<{ success: boolean; data: GalleryGroup[]; total: number }>('/admin/gallery'),

  uploadGalleryPhotos: (formData: FormData) =>
    request<{ success: boolean; message: string; data: { count: number } }>('/admin/gallery', {
      method: 'POST',
      body: formData,
      isFormData: true,
    }),

  deleteGalleryPhoto: (id: string) =>
    request<{ success: boolean; message: string }>(`/admin/gallery/${id}`, { method: 'DELETE' }),
};

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';

export const imageUrl = (path: string | null | undefined): string | null => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  // Normalize path: strip /tmp prefix so /tmp/uploads/x.jpg becomes /uploads/x.jpg
  const normalizedPath = path.replace(/^\/tmp/, '');
  return `${API_BASE}${normalizedPath}`;
};