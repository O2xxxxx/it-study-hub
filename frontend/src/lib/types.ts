export interface User {
  id: number
  username: string
  nickname: string
  avatarHue: number
  points: number
  createdAt?: string
}

export interface AuthState {
  authenticated: boolean
  user?: User
}

export interface Section {
  id: number
  code: string
  name: string
  tagline: string
  description: string
  icon: string
  accent: string
  sortOrder: number
  articleCount: number
  questionCount: number
  resourceCount: number
}

export interface SectionBrief {
  id: number
  code: string
  name: string
  accent?: string
}

export interface AuthorBrief {
  id: number
  nickname: string
  avatarHue: number
}

export interface Page<T> {
  items: T[]
  page: number
  size: number
  total: number
  totalPages: number
}

export interface ArticleCard {
  id: number
  title: string
  summary: string
  sectionId: number
  sectionCode: string
  sectionName: string
  authorId: number
  authorName: string
  authorAvatarHue: number
  rewardGranted: boolean
  viewCount: number
  createdAt: string
  favorite: boolean
}

export interface ArticleDetail {
  id: number
  title: string
  summary: string
  contentMd: string
  contentHtml: string
  section: SectionBrief
  author: AuthorBrief
  rewardGranted: boolean
  viewCount: number
  createdAt: string
  updatedAt: string
  favorite: boolean
  canEdit: boolean
}

export interface QuestionCard {
  id: number
  title: string
  sectionId: number
  sectionCode: string
  sectionName: string
  authorId: number
  authorName: string
  authorAvatarHue: number
  answerCount: number
  solved: boolean
  viewCount: number
  createdAt: string
  favorite: boolean
}

export interface Answer {
  id: number
  contentMd: string
  contentHtml: string
  author: AuthorBrief
  accepted: boolean
  createdAt: string
  isMine: boolean
}

export interface QuestionDetail {
  id: number
  title: string
  contentMd: string
  contentHtml: string
  solved: boolean
  section: SectionBrief
  author: AuthorBrief
  answerCount: number
  acceptedAnswerId: number | null
  viewCount: number
  createdAt: string
  favorite: boolean
  canAccept: boolean
  canAnswer: boolean
  myAnswerId: number | null
  answers: Answer[]
}

export interface ResourceCard {
  id: number
  title: string
  description: string
  fileType: string
  fileSize: number
  points: number
  downloadCount: number
  sectionId: number
  sectionCode: string
  sectionName: string
  owned: boolean
  canDownload: boolean
}

export interface PointLog {
  id: number
  changeAmount: number
  balanceAfter: number
  reasonType: 'ARTICLE_REWARD' | 'ANSWER_REWARD' | 'RESOURCE_EXCHANGE' | string
  reasonDesc: string
  refType: string
  refId: number
  createdAt: string
}

export interface ExchangeRecord {
  id: number
  resourceId: number
  resourceTitle: string
  fileType: string
  pointsCost: number
  createdAt: string
}

export interface PointsOverview {
  balance: number
  earned: number
  spent: number
  logs: PointLog[]
  exchanges: ExchangeRecord[]
}

export interface SearchItem {
  id: number
  type: 'article' | 'question' | 'resource'
  title: string
  summary: string
  sectionCode: string
  sectionName: string
  snippet: string
  meta: string
}

export interface SearchGroup {
  type: 'article' | 'question' | 'resource'
  label: string
  items: SearchItem[]
}

export interface SearchResponse {
  keyword: string
  total: number
  elapsedMs: number
  groups: SearchGroup[]
}

export interface FavoriteGroups {
  article: ArticleCard[]
  question: QuestionCard[]
  resource: ResourceCard[]
}

export interface Draft {
  draftType: string
  draftKey: string
  title: string | null
  sectionId: number | null
  contentMd: string
  updatedAt: string
}

export interface MutationResult {
  id?: number
  pointsDelta: number
  balance: number
}

export interface ExchangeResult {
  owned: boolean
  pointsDelta: number
  balance: number
  exchangeId?: number
  alreadyOwned?: boolean
}
