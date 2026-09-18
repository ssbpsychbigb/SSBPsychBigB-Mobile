/**
 * Public profile DTO — same shape as web `/profile/:username`.
 */

export type ProfileStats = {
  followers: number;
  following: number;
  posts: number;
  followingAuthor: boolean;
  followsYou: boolean;
};

export type ProfileBadge = {
  code: string;
  label: string;
  source: string;
};

export type OfficerReadiness = {
  score: number;
  band: string;
  bandLabel: string;
};

export type MentorAvailability = {
  enabled: boolean;
  status: 'available_now' | 'next' | 'unset';
  label: string;
  nextWindowLabel?: string;
};

export type MentorPortfolio = {
  recommendations: number;
  menteesApprox: number;
  specialties: string[];
  preparationStage: string;
  preferredService: string;
  sessionsNote?: string;
};

export type TimelineEvent = {
  id: string;
  eventType: string;
  title: string;
  description: string;
  eventDate: string;
  source: 'auto' | 'manual';
};

export type ProfileAchievement = {
  id: string;
  title: string;
  category: string;
  description: string;
  achievementDate: string | null;
  certificateUrl: string;
  verificationStatus: string;
};

export type MemberProfile = {
  id: string;
  username: string;
  fullName: string;
  role: string;
  bio?: string;
  city?: string;
  education?: string;
  languages?: string[];
  hobbies?: string;
  examGoal?: string;
  examGoals?: string[];
  instituteName?: string;
  profilePhotoPath?: string;
  coverPhotoPath?: string;
  officerPhotoPath?: string;
  instituteLogoPath?: string;
  verificationLevel?: number;
  preferredService?: string;
  targetEntry?: string;
  ssbBoard?: string;
  preparationStage?: string;
  attempts?: number;
  recommendations?: number;
  conferenceOuts?: number;
  preferredBranch?: string;
  medicalStatus?: string;
  expectedJoining?: string;
  stats?: ProfileStats;
  isOwner?: boolean;
  profileUrl?: string;
  sectionVisible?: {
    bio: boolean;
    about: boolean;
    defence: boolean;
    journey: boolean;
    achievements: boolean;
  };
  officerReadiness?: OfficerReadiness | null;
  badges?: ProfileBadge[];
  mentorAvailability?: MentorAvailability | null;
  mentorPortfolio?: MentorPortfolio | null;
};
