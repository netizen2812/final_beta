
export enum AppTab {
  CORE = 'core',
  IBADAH = 'ibadah',
  TARBIYAH = 'tarbiyah',
  LIVE = 'live',
  PROFILE = 'profile',
  ADMIN = 'admin',
  ADMIN_LIVE = 'admin-live'
}

export enum Madhab {
  GENERAL = 'General',
  HANAFI = 'Hanafi',
  SHAFI = 'Shafi\'i',
  MALIKI = 'Maliki',
  HANBALI = 'Hanbali'
}

export enum Tone {
  CALM = 'Calm',
  ENCOURAGING = 'Encouraging',
  PRACTICAL = 'Practical',
  PEACEFUL = 'Peaceful',
  GRATEFUL = 'Grateful',
  LOW = 'Low',
  ANXIOUS = 'Anxious'
}

export interface PrayerTime {
  name: string;
  time: string;
  isNext: boolean;
}

export interface Lesson {
  id: string;
  title: string;
  ageGroup: string;
  videoUrl: string;
  completed: boolean;
  questions: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export interface Conversation {
  _id: string;
  title: string;
  updatedAt: string;
  createdAt: string;
}

export interface ChildProgress {
  xp: number;
  level: number;
  lessons_completed: number;
  last_activity: string;
}

export interface Child {
  id: string;
  childUserId: string; // Added for backend linking
  parent_id: string;
  name: string;
  age: number;
  gender: 'Boy' | 'Girl';
  daily_limit: number;
  learning_level: string;
  created_at?: string;
  child_progress?: ChildProgress[];
}

export interface Profile {
  id: string;
  name: string;
  email?: string;
  active_child_id?: string;
}
