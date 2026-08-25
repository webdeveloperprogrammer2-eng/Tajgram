// DTO бэкенда: https://instagram-back-qibs.onrender.com/docs/

/** Конверт, в который бэкенд оборачивает каждый ответ. */
export type Envelope<T> = {
  data: T;
  errors: string[] | null;
  statusCode: number;
  pageNumber?: number;
  pageSize?: number;
  totalRecords?: number;
  totalPages?: number;
};

export type PostImage = {
  id: number;
  imageName: string | null;
};

export type PostComment = {
  commentId: number;
  comment: string;
  userId: string;
  userName: string;
  userImage: string | null;
  dateCommented: string;
};

export type Post = {
  postId: number;
  title: string | null;
  content: string | null;
  datePublished: string;
  userId: string;
  userName: string;
  userImage: string | null;
  images: PostImage[];
  postLikeCount: number;
  postViewCount: number;
  commentCount: number;
  postFavoriteCount: number;
  postLike: boolean;
  postFavorite: boolean;
  postView: boolean;
  /** Только 3 последних комментария, полный список — /Comment/get-post-comments. */
  comments: PostComment[];
};

export type StoryViewer = {
  userName: string | null;
  name: string | null;
  viewCount: number | null;
  viewLike: number | null;
};

export type Story = {
  id: number;
  fileName: string | null;
  postId: number | null;
  createAt: string;
  userId: string | null;
  userAvatar: string | null;
  viewerDto?: StoryViewer;
};

export type UserProfile = {
  userId: string;
  userName: string;
  fullName: string;
  email: string;
  about: string | null;
  gender: 0 | 1 | null;
  image: string | null;
  postCount: number;
  subscribersCount: number;
  subscriptionsCount: number;
  isFollowing: boolean;
  posts: Post[];
};

export type User = {
  userId: string;
  userName: string;
  fullName: string;
  email: string;
  image: string | null;
  about: string | null;
  isFollowing: boolean;
};

export type ProfileUser = {
  userId: string;
  userName: string;
  fullName: string;
  image: string | null;
  about: string | null;
  isFollowing: boolean;
  isFollower: boolean;
  isFriend: boolean;
};

export type Reel = {
  reelsId: number;
  title: string | null;
  description: string | null;
  videoName: string | null;
  coverName: string | null;
  datePublished: string;
  userId: string;
  userName: string;
  userImage: string | null;
  reelsLikeCount: number;
  reelsViewCount: number;
  commentCount: number;
  reelsFavoriteCount: number;
  repostCount: number;
  reelsLike: boolean;
  reelsFavorite: boolean;
  reelsView: boolean;
};

export type Chat = {
  chatId: number;
  userId: string;
  userName: string;
  fullName: string;
  userImage: string | null;
  lastMessage: string | null;
  lastMessageDate: string | null;
  createdAt: string;
};

export type NotificationType = "like" | "subscribed" | "message";

export type AppNotification = {
  id: number;
  type: NotificationType;
  text: string;
  isRead: boolean;
  createdAt: string;
  userId: string;
  userName: string;
  fullName: string;
  userImage: string | null;
  isFollowing: boolean;
  postId: number | null;
  reelsId: number | null;
  commentId: number | null;
  storyId: number | null;
  chatId: number | null;
  messageId: number | null;
  previewImage: string | null;
  preview: string | null;
};

export type UnreadCount = {
  total: number;
  like: number;
  subscribed: number;
  message: number;
};

export type Settings = {
  userId: string;
  isPrivateAccount: boolean;
  showActivityStatus: boolean;
  allowComments: boolean;
  allowMessages: boolean;
  allowTags: boolean;
  notifyLikes: boolean;
  notifyComments: boolean;
  notifyFollows: boolean;
  notifyMessages: boolean;
  emailNotifications: boolean;
  language: string;
  theme: "light" | "dark" | "system";
  blockedCount: number;
};

export type SettingsPatch = Partial<Omit<Settings, "userId" | "blockedCount">>;

export type BlockedUser = {
  id: number;
  userId: string;
  userName: string;
  fullName: string;
  image: string | null;
  blockedAt: string;
};
