export type UserRole = 'admin' | 'client';

export interface SessionInfo {
  email: string;
  role: UserRole;
}
