export interface User {
  id: number;
  name: string;
  email: string;
}

export interface JournalNote {
  id: number;
  userId: number;
  title: string | null;
  body: string | null;
  noteDate: string;
  createdAt: string;
  updatedAt: string;
  gratitude1: string | null;
  gratitude2: string | null;
  gratitude3: string | null;
  gratitudeCategory1: string | null;
  gratitudeCategory2: string | null;
  gratitudeCategory3: string | null;
  gratitudeCount: number;
  imagePath: string | null;
  imageUrl: string | null;
}

export interface DailyAnalysis {
  summary: string;
  dominantMood: string;
  moodScore: number;
  highlights: string[];
  advice: string[];
  affirmation: string;
}

export interface WeeklyAnalysis {
  id: number;
  userId: number;
  weekStart: string;
  weekEnd: string;
  analysis: DailyAnalysis;
  recommendations: any;
  musicRecommendations: any;
}

export interface LoginResponse {
  status: string;
  data: {
    access_token: string;
    token_type: string;
    expires_in: number;
    user: User;
  };
}

export interface CreateJournalPayload {
  title?: string;
  body?: string;
  note_date?: string;
  gratitude_1?: string;
  gratitude_2?: string;
  gratitude_3?: string;
  image?: any;
}
