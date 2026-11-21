import type {
  ArticleCard, ArticleDetail, AuthState, Draft, ExchangeRecord, ExchangeResult, FavoriteGroups,
  MutationResult, Page, PointsOverview, PointLog, QuestionCard, QuestionDetail, ResourceCard,
  SearchResponse, Section, User, UserProfile, UserBrief, FollowResult, LikeResult, PostType,
} from './types'

export class ApiError extends Error {
  code: string
  status: number
  details?: Record<string, unknown>
  constructor(status: number, code: string, message: string, details?: Record<string, unknown>) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

type Query = Record<string, string | number | boolean | null | undefined>

function toQuery(query?: Query): string {
  if (!query) return ''
  const params = new URLSearchParams()
  Object.entries(query).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') params.set(k, String(v))
  })
  const s = params.toString()
  return s ? '?' + s : ''
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(path, {
      credentials: 'include',
      ...init,
      headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    })
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', '网络连接失败，请检查后端服务是否启动')
  }
  const text = await res.text()
  let body: unknown = null
  if (text) {
    try { body = JSON.parse(text) } catch { body = text }
  }
  if (!res.ok) {
    const b = (body ?? {}) as { code?: string; message?: string; details?: Record<string, unknown> }
    throw new ApiError(res.status, b.code || 'ERROR', b.message || '请求失败（' + res.status + '）', b.details)
  }
  return body as T
}

export const api = {
  get: <T,>(path: string, query?: Query) => request<T>(path + toQuery(query)),
  post: <T,>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) }),
  put: <T,>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PUT', body: body === undefined ? undefined : JSON.stringify(body) }),
  del: <T,>(path: string, query?: Query) => request<T>(path + toQuery(query), { method: 'DELETE' }),

  me: () => api.get<AuthState>('/api/auth/me'),
  login: (username: string, password: string) =>
    api.post<{ user: User }>('/api/auth/login', { username, password }),
  register: (username: string, password: string, nickname: string) =>
    api.post<{ user: User }>('/api/auth/register', { username, password, nickname }),
  logout: () => api.post<void>('/api/auth/logout'),

  sections: () => api.get<Section[]>('/api/sections'),
  section: (code: string) => api.get<Section>('/api/sections/' + code),

  articles: (query?: Query) => api.get<Page<ArticleCard>>('/api/articles', query),
  article: (id: number) => api.get<ArticleDetail>('/api/articles/' + id),
  createArticle: (body: { title: string; sectionId: number; summary?: string; contentMd: string }) =>
    api.post<MutationResult>('/api/articles', body),
  updateArticle: (id: number, body: { title: string; sectionId: number; summary?: string; contentMd: string }) =>
    api.put<MutationResult>('/api/articles/' + id, body),

  questions: (query?: Query) => api.get<Page<QuestionCard>>('/api/questions', query),
  question: (id: number) => api.get<QuestionDetail>('/api/questions/' + id),
  askQuestion: (body: { title: string; sectionId: number; contentMd: string }) =>
    api.post<{ id: number; pointsDelta: number; balance: number }>('/api/questions', body),
  answerQuestion: (id: number, contentMd: string) =>
    api.post<MutationResult>('/api/questions/' + id + '/answers', { contentMd }),
  acceptAnswer: (questionId: number, answerId: number) =>
    api.post<{ questionId: number; acceptedAnswerId: number; solved: boolean }>(
      '/api/questions/' + questionId + '/accept', { answerId }),

  resources: (query?: Query) => api.get<Page<ResourceCard>>('/api/resources', query),
  resource: (id: number) => api.get<ResourceCard>('/api/resources/' + id),
  exchange: (id: number) => api.post<ExchangeResult>('/api/resources/' + id + '/exchange'),
  downloadUrl: (id: number) => '/api/resources/' + id + '/download',

  points: () => api.get<PointsOverview>('/api/points'),
  pointLogs: (query?: Query) => api.get<Page<PointLog>>('/api/points/logs', query),

  search: (query: { q: string; type?: string; sectionCode?: string; limit?: number }) =>
    api.get<SearchResponse>('/api/search', query),

  favorites: (type?: string) => api.get<FavoriteGroups>('/api/favorites', { type }),
  toggleFavorite: (targetType: string, targetId: number) =>
    api.post<{ favorited: boolean; count: number }>('/api/favorites/toggle', { targetType, targetId }),

  userProfile: (username: string) => api.get<UserProfile>('/api/users/' + encodeURIComponent(username)),
  userArticles: (username: string, page: number) =>
    api.get<Page<ArticleCard>>('/api/users/' + encodeURIComponent(username) + '/articles', { page, size: 9 }),
  userQuestions: (username: string, page: number) =>
    api.get<Page<QuestionCard>>('/api/users/' + encodeURIComponent(username) + '/questions', { page, size: 9 }),
  userConnections: (username: string, kind: 'followers' | 'following', page: number) =>
    api.get<Page<UserBrief>>('/api/users/' + encodeURIComponent(username) + '/' + kind, { page, size: 12 }),
  followUser: (username: string, following: boolean) =>
    api.post<FollowResult>('/api/users/' + encodeURIComponent(username) + (following ? '/follow' : '/unfollow')),
  renameProfile: (nickname: string) =>
    request<User>('/api/users/me', { method: 'PATCH', body: JSON.stringify({ nickname }) }),
  likePost: (targetType: PostType, targetId: number, liked: boolean) =>
    api.post<LikeResult>('/api/likes/toggle', { targetType, targetId, liked }),

  drafts: (draftType?: string) => api.get<Draft[]>('/api/drafts', { draftType }),
  getDraft: (draftType: string, draftKey: string) =>
    api.get<Draft | null>('/api/drafts', { draftType, draftKey }),
  saveDraft: (body: { draftType: string; draftKey: string; title?: string; sectionId?: number; contentMd: string }) =>
    api.put<{ updatedAt: string }>('/api/drafts', body),
  deleteDraft: (draftType: string, draftKey: string) =>
    api.del<void>('/api/drafts', { draftType, draftKey }),
}

export { request }
