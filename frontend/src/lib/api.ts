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
  published: boolean;
  created_at: string;
  updated_at: string;
  admin?: { id: string; username: string };
}

export interface Event {
  id: string;
  title: string;
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
  total_members: number;
  total_committees: number;
  total_posts: number;
  total_events: number;
  upcoming_events: number;
  past_events: number;
}

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

  getEventById: (id: string) =>
    request<{ success: boolean; data: Event }>(`/events/${id}`),
};

export const adminApi = {
  login: (username: string, password: string) =>
    request<{
      success: boolean;
      data: { token: string; admin: { id: string; username: string; role: string } };
    }>('/admin/login', { method: 'POST', body: { username, password } }),

  getDashboard: () =>
    request<{ success: boolean; data: DashboardStats }>('/admin/dashboard'),

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

  deleteCommittee: (id: string) =>
    request<{ success: boolean; message: string }>(`/admin/committee/${id}`, { method: 'DELETE' }),
};

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';

export const imageUrl = (path: string | null | undefined): string | null => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${API_BASE}${path}`;
};