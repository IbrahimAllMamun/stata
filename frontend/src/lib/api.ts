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
  photo_url?: string | null;
  blood_group?: string | null;
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


export const visitorApi = {
  track: () => fetch(`${BASE_URL}/track`, { method: 'POST' }).catch(() => { }),
  getStats: (): Promise<{ today: number; lifetime: number }> =>
    fetch(`${BASE_URL}/visitors/stats`).then(r => r.json()),
};
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
  // Multipart version of register that includes optional photo
  registerWithPhoto: (formData: FormData) =>
    request<{ success: boolean; message: string; data: { id: string } }>('/register', {
      method: 'POST', body: formData, isFormData: true,
    }),

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

  lookupMember: (email: string) =>
    request<{ success: boolean; data: Member & { status: string } }>(`/lookup-member?email=${encodeURIComponent(email)}`),

  updateMemberPhoto: (email: string, photo: File) => {
    const fd = new FormData();
    fd.append('email', email);
    fd.append('photo', photo);
    return request<{ success: boolean; message: string; data: { photo_url: string } }>('/update-member-photo', {
      method: 'POST', body: fd, isFormData: true,
    });
  },

  updateMember: (data: {
    email: string;
    batch?: number;
    full_name?: string;
    phone_number?: string;
    notify_events?: boolean;
    alternative_phone?: string;
    job_title?: string;
    organisation?: string;
    organisation_address?: string;
    blood_group?: string | null;
  }) =>
    request<{ success: boolean; message: string; data: { id: string; full_name: string; status: string } }>('/update-member', {
      method: 'PUT',
      body: data,
    }),

  getMembers: (params?: { batch?: number; blood_group?: string; page?: number; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.batch) qs.set('batch', String(params.batch));
    if (params?.blood_group) qs.set('blood_group', params.blood_group);
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

  getEventBySlug: (slug: string) =>
    request<{ success: boolean; data: Event }>(`/events/${slug}`),

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

  uploadMemberPhoto: (id: string, photo: File) => {
    const fd = new FormData();
    fd.append('photo', photo);
    return request<{ success: boolean; data: { photo_url: string } }>(`/admin/members/${id}/photo`, {
      method: 'POST', body: fd, isFormData: true,
    });
  },

  getPendingCount: () =>
    request<{ success: boolean; data: { count: number } }>('/admin/members/pending-count'),

  getMemberUpdateRequests: (status = 'PENDING') =>
    request<{ success: boolean; data: any[] }>(`/admin/member-updates?status=${status}`),

  getPendingUpdateCount: () =>
    request<{ success: boolean; data: { count: number } }>('/admin/member-updates/count'),

  approveMemberUpdate: (id: string, admin_note?: string) =>
    request<{ success: boolean; message: string }>(`/admin/member-updates/${id}/approve`, {
      method: 'POST',
      body: { admin_note },
    }),

  rejectMemberUpdate: (id: string, admin_note?: string) =>
    request<{ success: boolean; message: string }>(`/admin/member-updates/${id}/reject`, {
      method: 'POST',
      body: { admin_note },
    }),

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

  // Email Campaigns
  sendEmailCampaign: (payload: { subject: string; html_body: string; text_body: string; recipient_filter: string }) =>
    request<{ success: boolean; message: string; data: { campaign_id: string; recipient_count: number } }>('/admin/email/send', {
      method: 'POST',
      body: payload,
    }),

  getEmailCampaigns: (params?: { page?: number; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    return request<{ success: boolean; data: unknown[]; pagination: Pagination }>(`/admin/email/campaigns?${qs}`);
  },

  previewEmailRecipients: (filter: string) =>
    request<{ success: boolean; data: { count: number; filter: string; sample: { email: string; name: string }[] } }>(
      `/admin/email/preview-recipients?filter=${encodeURIComponent(filter)}`
    ).then(res => ({ ...res, data: res.data as { count: number; filter: string; sample: { email: string; name: string }[] } })),

  verifySmtp: () =>
    request<{ success: boolean; message: string }>('/admin/email/verify-smtp'),
};

// Base URL for uploaded file serving (no /api suffix).
// Set VITE_UPLOAD_URL explicitly in production to avoid brittle string manipulation.
// e.g. dev:  VITE_UPLOAD_URL=http://localhost:3000
//      prod: VITE_UPLOAD_URL=https://api.stataisrt.instechbd.com
const API_BASE = import.meta.env.VITE_UPLOAD_URL
  || (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace(/\/api$/, '');

export const imageUrl = (path: string | null | undefined): string | null => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  // Normalize path: strip /tmp prefix so /tmp/uploads/x.jpg becomes /uploads/x.jpg
  const normalizedPath = path.replace(/^\/tmp/, '');
  return `${API_BASE}${normalizedPath}`;
};
// ── ASPL ─────────────────────────────────────────────────────────────────────

const ASPL_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

async function asplRequest<T>(path: string, options: RequestOptions & { isFormData?: boolean; formBody?: FormData } = {}): Promise<T> {
  const { method = 'GET', body, isFormData = false, formBody } = options;
  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!isFormData && body) headers['Content-Type'] = 'application/json';
  const res = await fetch(`${ASPL_BASE}/aspl${path}`, {
    method,
    headers,
    body: isFormData ? formBody : body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || data.detail || 'Request failed');
  return data;
}

export type AsplSport = 'FOOTBALL' | 'CRICKET';
export type AsplSeasonStatus = 'DRAFT' | 'ACTIVE' | 'COMPLETED';

export interface AsplSeason {
  id: number;
  name: string;
  sport: AsplSport;
  status: AsplSeasonStatus;
  max_squad_size: number;
  min_squad_size: number;
  min_bid_price: number;
  starting_balance: number;
  total_players: number;
  registration_open: boolean;
  created_at: string;
  updated_at: string;
  _count?: { teams: number; players: number; registrations: number };
  teams?: AsplTeam[];
}

export interface AsplPlayer {
  sl: number;
  season_id: number;
  member_email: string;
  playing_position: string;
  photo_url?: string | null; // from member table via enrichment
  status: boolean;      // false = available, true = sold
  randomized: boolean;
  // enriched from Member at query time:
  name: string;
  batch: number | null;
  phone?: string | null;
  job_title?: string | null;
  organisation?: string | null;
}

export type AsplRegistrationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface AsplRegistration {
  id: number;
  season_id: number;
  email: string;
  playing_position: string;
  status: AsplRegistrationStatus;
  conflict_note?: string | null;
  admin_note?: string | null;
  player_sl?: number | null;
  created_at: string;
  updated_at: string;
  // enriched from Member when returned by lookup / getRegistrations:
  member?: {
    full_name: string;
    batch: number;
    phone_number: string;
    job_title?: string | null;
    organisation?: string | null;
    photo_url?: string | null;
  } | null;
}

export interface AsplTeam {
  id: number;
  season_id: number;
  owner_name: string;
  team_name: string;
  logo_url?: string | null;
  color: string;
  balance: number;
}

export interface AsplTeamPlayer {
  id: number;
  team_id: number;
  player_sl: number;
  price: number;
  player: AsplPlayer;
  team: AsplTeam;
}

export interface AsplSettings {
  visible: boolean;
}

export const FOOTBALL_POSITIONS = ['GK', 'DEF', 'LB', 'RB', 'CDM', 'CM', 'MID', 'LW', 'RW', 'CF', 'FWD'];
export const CRICKET_POSITIONS = ['BAT', 'BOWL', 'AR', 'WK'];

export const asplApi = {
  // Seasons
  getSeasons: () => asplRequest<AsplSeason[]>('/seasons'),
  getSeasonById: (id: number) => asplRequest<AsplSeason>(`/seasons/${id}`),
  getActiveSeason: () => asplRequest<AsplSeason>('/seasons/active'),
  createSeason: (data: Partial<AsplSeason>) =>
    asplRequest<AsplSeason>('/seasons', { method: 'POST', body: data }),
  updateSeason: (id: number, data: Partial<AsplSeason>) =>
    asplRequest<AsplSeason>(`/seasons/${id}`, { method: 'PATCH', body: data }),
  deleteSeason: (id: number) =>
    asplRequest<{ message: string }>(`/seasons/${id}`, { method: 'DELETE' }),

  // Players
  getPlayers: (seasonId?: number) =>
    asplRequest<AsplPlayer[]>(seasonId ? `/players?season_id=${seasonId}` : '/players'),
  getPlayerBySL: (sl: number) => asplRequest<AsplPlayer>(`/players/${sl}`),
  getRandomPlayer: (seasonId?: number) =>
    asplRequest<AsplPlayer>(seasonId ? `/players/random?season_id=${seasonId}` : '/players/random'),

  // Teams
  getTeams: (seasonId?: number) =>
    asplRequest<AsplTeam[]>(seasonId ? `/teams?season_id=${seasonId}` : '/teams'),
  getTeamById: (id: number) => asplRequest<AsplTeam>(`/teams/${id}`),
  createTeam: (formData: FormData) =>
    asplRequest<AsplTeam>('/teams', { method: 'POST', isFormData: true, formBody: formData }),
  updateTeam: (id: number, formData: FormData) =>
    asplRequest<AsplTeam>(`/teams/${id}`, { method: 'PUT', isFormData: true, formBody: formData }),
  deleteTeam: (id: number) =>
    asplRequest<{ message: string }>(`/teams/${id}`, { method: 'DELETE' }),

  // Team-Players
  getTeamPlayers: (seasonId?: number) =>
    asplRequest<AsplTeamPlayer[]>(seasonId ? `/team-players?season_id=${seasonId}` : '/team-players'),
  getTeamPlayersByTeam: (id: number) => asplRequest<AsplTeamPlayer[]>(`/team-players/${id}`),
  createTeamPlayer: (player: number, team: number, price: number) =>
    asplRequest<AsplTeamPlayer>('/team-players/create', { method: 'POST', body: { player, team, price } }),
  updateTeamPlayer: (id: number, data: { team_id?: number; price?: number }) =>
    asplRequest<AsplTeamPlayer>(`/team-players/${id}`, { method: 'PATCH', body: data }),
  deleteTeamPlayer: (id: number) =>
    asplRequest<{ message: string }>(`/team-players/${id}`, { method: 'DELETE' }),

  // Registrations
  register: (formData: FormData) =>
    asplRequest<{ message: string; registration: AsplRegistration; member: { full_name: string; batch: number }; updated: boolean }>(
      '/registrations', { method: 'POST', isFormData: true, formBody: formData }
    ),
  updatePlayerDetails: (formData: FormData) =>
    asplRequest<{ message: string; registration: AsplRegistration }>(
      '/registrations/update-player', { method: 'POST', isFormData: true, formBody: formData }
    ),
  checkRegistration: (email: string, seasonId: number) =>
    asplRequest<AsplRegistration>(`/registrations/check?email=${encodeURIComponent(email)}&season_id=${seasonId}`),
  getPendingRegistrationCount: () =>
    asplRequest<{ success: boolean; data: { count: number } }>('/registrations/pending-count'),
  lookupRegistration: (email: string, seasonId: number) =>
    asplRequest<AsplRegistration & { member: { full_name: string; batch: number; phone_number: string; job_title?: string | null; organisation?: string | null } | null }>(
      `/registrations/lookup?email=${encodeURIComponent(email)}&season_id=${seasonId}`),
  getRegistrations: (seasonId?: number, status?: string) =>
    asplRequest<AsplRegistration[]>(
      `/registrations?${seasonId ? `season_id=${seasonId}` : ''}${status ? `&status=${status}` : ''}`
    ),
  approveRegistration: (id: number, admin_note?: string) =>
    asplRequest<{ message: string }>(`/registrations/${id}/approve`, { method: 'PATCH', body: { admin_note } }),
  rejectRegistration: (id: number, admin_note?: string) =>
    asplRequest<{ message: string }>(`/registrations/${id}/reject`, { method: 'PATCH', body: { admin_note } }),
  deleteRegistration: (id: number) =>
    asplRequest<{ message: string }>(`/registrations/${id}`, { method: 'DELETE' }),

  // Settings
  getSettings: (): AsplSettings => {
    try { return JSON.parse(localStorage.getItem('aspl_settings') || '{"visible":false}'); }
    catch { return { visible: false }; }
  },
  saveSettings: (settings: AsplSettings): void => {
    localStorage.setItem('aspl_settings', JSON.stringify(settings));
  },

  // Helpers
  getPositions: (sport: AsplSport) => sport === 'FOOTBALL' ? FOOTBALL_POSITIONS : CRICKET_POSITIONS,
  imageUrl: (path: string | null | undefined): string | null => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const base = import.meta.env.VITE_UPLOAD_URL || (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace(/\/api$/, '');
    return `${base}${path}`;
  },
};