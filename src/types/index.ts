export interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  estimatedMinutes?: number;
  createdAt: Date;
  completedAt?: Date;
}

export interface FocusSession {
  id: string;
  type: 'pomodoro' | 'deep-work' | 'short-break';
  duration: number;
  taskId?: string;
  startedAt?: Date;
  completedAt?: Date;
}

export interface MindfulExercise {
  id: string;
  type: 'breathing' | 'reflection' | 'quote';
  content: string;
  duration?: number;
}

export interface DailySummary {
  date: Date;
  tasksCompleted: number;
  focusMinutes: number;
  mindfulBreaks: number;
  insights: string[];
  suggestions: string[];
}

export interface Habit {
  id: string;
  title: string;
  description?: string;
  frequency: 'daily' | 'weekly' | 'custom';
  targetDays?: number[]; // 0 = Sunday, 6 = Saturday
  color: string;
  icon?: string;
  createdAt: Date;
  streak: number;
  bestStreak: number;
  completions: HabitCompletion[];
}

export interface HabitCompletion {
  date: string; // YYYY-MM-DD format
  completed: boolean;
  note?: string;
}

export interface ScheduleItem {
  id: string;
  title: string;
  description?: string;
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  category: 'work' | 'meeting' | 'break' | 'exercise' | 'personal' | 'meal';
  completed: boolean;
  reminderTime?: string; // HH:mm format
  priority?: 'low' | 'medium' | 'high';
}

export interface DaySchedule {
  id: string;
  date: string; // YYYY-MM-DD format
  items: ScheduleItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  schedule?: DaySchedule;
}