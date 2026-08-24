export interface ApiResponse<T = any> {
  data: T | null;
  errors: string[] | null;
  statusCode: number;
}

export interface UserProfile {
  userId: string;
  userName: string;
  fullName: string;
  email: string;
  about: string | null;
  gender: number | null;
  image: string | null;
  postCount: number;
  subscribersCount: number;
  subscriptionsCount: number;
}
