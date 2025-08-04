export interface KtpLesson {
  id: number;
  title: string;
  description?: string;
  duration: number; // в часах
  week: number;
  date?: string;
  status: 'planned' | 'in_progress' | 'completed';
  materials?: string[];
  objectives: string[];
  methods: string[];
  assessment?: string;
  homework?: string;
  children?: KtpLesson[];
}

export interface KtpSection {
  id: number;
  title: string;
  description?: string;
  totalHours: number;
  lessons: KtpLesson[];
  expanded?: boolean;
}

export interface KtpData {
  id: number;
  studyPlanId: number;
  totalHours: number;
  totalLessons: number;
  sections: KtpSection[];
  studyPlan?: {
    id: number;
    name: string;
    teacher?: {
      id: number;
      name: string;
    };
  };
  createdAt?: string;
  updatedAt?: string;
}
