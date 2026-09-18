/**
 * Network API types — aligned with the web profile module.
 */

export type NetworkMember = {
  id: string;
  username: string;
  fullName: string;
  role: string;
  examGoal?: string;
  instituteName?: string;
  verificationLevel: number;
  profilePhotoPath?: string;
  followingAuthor: boolean;
  followsYou: boolean;
  isMutual: boolean;
  isSelf: boolean;
};

export type NetworkSuggestion = NetworkMember & {
  city?: string;
  education?: string;
  coverPhotoPath?: string;
  reason?: {
    code: string;
    label: string;
  };
};

export type NetworkOverview = {
  followers: number;
  following: number;
  mutual: number;
  newFollowers7d: number;
};

export type NetworkSuggestionsPage = {
  items: NetworkSuggestion[];
  nextCursor: string | null;
  hasMore: boolean;
};

export type NetworkGraphKind = 'followers' | 'following' | 'mutual';

export type NetworkPage = {
  items: NetworkMember[];
  nextCursor: string | null;
  hasMore: boolean;
  kind?: NetworkGraphKind;
};
