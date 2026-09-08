/**
 * Preview Prep Reels — bundled MP4s only (no still posters).
 */

export type PrepReelPreview = {
  id: string;
  title: string;
  synopsis: string;
  author: string;
  authorRole: string;
  postedAgo: string;
  duration: string;
  category: string;
  likesLabel: string;
  commentsLabel: string;
  color: string;
  video: number;
  /** Android `res/raw` name (no extension). */
  androidRaw: string;
};

export const PREP_REELS_PREVIEW: PrepReelPreview[] = [
  {
    id: 'r1',
    title: 'TAT in 60 seconds — hero, obstacle, decision',
    synopsis:
      'Three beats. One picture. Say the story like an officer, not a novelist.',
    author: 'Capt. Vikram Rao',
    authorRole: 'Psychology mentor',
    postedAgo: '19h ago',
    duration: '0:15',
    category: 'Psychology',
    likesLabel: '4.2k',
    commentsLabel: '186',
    color: '#1351A1',
    video: require('../assets/reel-1.mp4'),
    androidRaw: 'reel1',
  },
  {
    id: 'r2',
    title: 'PGT voice: 12-second plan before the plank',
    synopsis:
      'Name the task, assign roles, then move. Silence is not leadership.',
    author: 'Meera Sharma',
    authorRole: 'GTO coach',
    postedAgo: '2d ago',
    duration: '0:15',
    category: 'GTO',
    likesLabel: '1.8k',
    commentsLabel: '94',
    color: '#1667CF',
    video: require('../assets/reel-2.mp4'),
    androidRaw: 'reel2',
  },
  {
    id: 'r3',
    title: 'Interview hot-seat: why defence, not a script',
    synopsis:
      'Motive that survives a follow-up. Specific, personal, and calm.',
    author: 'Valour Institute',
    authorRole: 'SSB academy',
    postedAgo: '5h ago',
    duration: '1:00',
    category: 'Interview',
    likesLabel: '3.1k',
    commentsLabel: '210',
    color: '#0E2B50',
    video: require('../assets/reel-3.mp4'),
    androidRaw: 'reel3',
  },
  {
    id: 'r4',
    title: 'SRT endings that sound like an officer',
    synopsis:
      'Close with action and accountability — not a slogan.',
    author: 'Arjun Kulkarni',
    authorRole: 'Aspirant mentor',
    postedAgo: '1d ago',
    duration: '0:15',
    category: 'Psychology',
    likesLabel: '956',
    commentsLabel: '41',
    color: '#CC5800',
    video: require('../assets/reel-4.mp4'),
    androidRaw: 'reel4',
  },
];
