/**
 * Preview Prep Reels — bundled MP4s only (no still posters).
 */

export type PrepReelPreview = {
  id: string;
  title: string;
  synopsis: string;
  author: string;
  authorId?: string;
  authorUsername?: string;
  authorRole: string;
  postedAgo: string;
  duration: string;
  category: string;
  likesLabel: string;
  commentsLabel: string;
  color: string;
  /** Remote playable URL from `/feed/reels`. */
  videoUri?: string;
  posterUri?: string;
  video?: number;
  androidRaw?: string;
  isOwn?: boolean;
  followingAuthor?: boolean;
  liked?: boolean;
  bookmarked?: boolean;
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
  {
    id: 'r5',
    title: 'WAT: first word, first honest beat',
    synopsis:
      'Do not decorate. Association that an assessor can believe in three seconds.',
    author: 'Dr. Naina Kapoor',
    authorRole: 'Psychologist',
    postedAgo: '8h ago',
    duration: '0:15',
    category: 'Psychology',
    likesLabel: '2.4k',
    commentsLabel: '71',
    color: '#1351A1',
    video: require('../assets/reel-1.mp4'),
    androidRaw: 'reel1',
  },
  {
    id: 'r6',
    title: 'HGT: when the group goes silent',
    synopsis:
      'Re-state the goal, invite one voice, then decide. That is still GTO.',
    author: 'Maj. Rohan Iyer',
    authorRole: 'GTO coach',
    postedAgo: '3d ago',
    duration: '0:15',
    category: 'GTO',
    likesLabel: '1.1k',
    commentsLabel: '38',
    color: '#1667CF',
    video: require('../assets/reel-2.mp4'),
    androidRaw: 'reel2',
  },
  {
    id: 'r7',
    title: 'PI: current affairs without a TED talk',
    synopsis:
      'One fact, one implication, one link to service. Then stop talking.',
    author: 'Valour Institute',
    authorRole: 'SSB academy',
    postedAgo: '12h ago',
    duration: '1:00',
    category: 'Interview',
    likesLabel: '5.6k',
    commentsLabel: '302',
    color: '#0E2B50',
    video: require('../assets/reel-3.mp4'),
    androidRaw: 'reel3',
  },
  {
    id: 'r8',
    title: 'Lecturette closer that lands',
    synopsis:
      'Circle back to the opening line. Assessors remember structure.',
    author: 'Priya Nair',
    authorRole: 'Communication coach',
    postedAgo: '4d ago',
    duration: '0:15',
    category: 'Interview',
    likesLabel: '890',
    commentsLabel: '29',
    color: '#CC5800',
    video: require('../assets/reel-4.mp4'),
    androidRaw: 'reel4',
  },
  {
    id: 'r9',
    title: 'Self-description: three lines, no fluff',
    synopsis:
      'Parents, teachers, friends — each gets one trait you can defend.',
    author: 'Capt. Vikram Rao',
    authorRole: 'Psychology mentor',
    postedAgo: '6h ago',
    duration: '0:15',
    category: 'Psychology',
    likesLabel: '3.8k',
    commentsLabel: '144',
    color: '#1351A1',
    video: require('../assets/reel-1.mp4'),
    androidRaw: 'reel1',
  },
  {
    id: 'r10',
    title: 'Command task: brief like you mean it',
    synopsis:
      'Time, resources, sequence. Subordinates need orders, not a speech.',
    author: 'Meera Sharma',
    authorRole: 'GTO coach',
    postedAgo: '1d ago',
    duration: '0:15',
    category: 'GTO',
    likesLabel: '2.0k',
    commentsLabel: '66',
    color: '#1667CF',
    video: require('../assets/reel-2.mp4'),
    androidRaw: 'reel2',
  },
  {
    id: 'r11',
    title: 'PI: hobbies that survive a probe',
    synopsis:
      'If you cannot talk process, do not list it. Depth beats a long list.',
    author: 'Arjun Kulkarni',
    authorRole: 'Aspirant mentor',
    postedAgo: '9h ago',
    duration: '1:00',
    category: 'Interview',
    likesLabel: '1.4k',
    commentsLabel: '52',
    color: '#0E2B50',
    video: require('../assets/reel-3.mp4'),
    androidRaw: 'reel3',
  },
  {
    id: 'r12',
    title: 'OIR pace: skip, mark, return',
    synopsis:
      'Accuracy first on the ones you own. Ego on a stuck item costs the paper.',
    author: 'Nexus Prep',
    authorRole: 'SSB academy',
    postedAgo: '2d ago',
    duration: '0:15',
    category: 'OIR',
    likesLabel: '720',
    commentsLabel: '18',
    color: '#CC5800',
    video: require('../assets/reel-4.mp4'),
    androidRaw: 'reel4',
  },
];
