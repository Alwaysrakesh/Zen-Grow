import { Task, FocusSession, Habit, HabitCompletion, DaySchedule, ScheduleItem } from '@/types';

// Simple in-memory store for tasks
class TaskStore {
  private tasks: Task[] = [];
  private listeners: Set<() => void> = new Set();

  getTasks(): Task[] {
    return this.tasks;
  }

  addTask(task: Omit<Task, 'id' | 'createdAt'>): Task {
    const newTask: Task = {
      ...task,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
    };
    this.tasks = [...this.tasks, newTask];
    this.notifyListeners();
    return newTask;
  }

  updateTask(id: string, updates: Partial<Task>): void {
    this.tasks = this.tasks.map(task =>
      task.id === id 
        ? { ...task, ...updates, completedAt: updates.completed ? new Date() : undefined }
        : task
    );
    this.notifyListeners();
  }

  deleteTask(id: string): void {
    this.tasks = this.tasks.filter(task => task.id !== id);
    this.notifyListeners();
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }
}

export const taskStore = new TaskStore();

// Focus session store
class FocusStore {
  private sessions: FocusSession[] = [];

  getSessions(): FocusSession[] {
    return this.sessions;
  }

  addSession(session: FocusSession): void {
    this.sessions = [...this.sessions, session];
  }

  getTodaysSessions(): FocusSession[] {
    const today = new Date().toDateString();
    return this.sessions.filter(
      session => session.startedAt && new Date(session.startedAt).toDateString() === today
    );
  }
}

export const focusStore = new FocusStore();

// Habit tracker store
class HabitStore {
  private habits: Habit[] = [];
  private listeners: Set<() => void> = new Set();

  getHabits(): Habit[] {
    return this.habits;
  }

  addHabit(habit: Omit<Habit, 'id' | 'createdAt' | 'streak' | 'bestStreak' | 'completions'>): Habit {
    const newHabit: Habit = {
      ...habit,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
      streak: 0,
      bestStreak: 0,
      completions: [],
    };
    this.habits = [...this.habits, newHabit];
    this.notifyListeners();
    return newHabit;
  }

  toggleHabitCompletion(habitId: string, date: string): void {
    this.habits = this.habits.map(habit => {
      if (habit.id !== habitId) return habit;
      
      const existingCompletionIndex = habit.completions.findIndex(c => c.date === date);
      let newCompletions = [...habit.completions];
      
      if (existingCompletionIndex >= 0) {
        newCompletions[existingCompletionIndex] = {
          ...newCompletions[existingCompletionIndex],
          completed: !newCompletions[existingCompletionIndex].completed
        };
      } else {
        newCompletions.push({ date, completed: true });
      }
      
      // Calculate streak
      const streak = this.calculateStreak(newCompletions);
      const bestStreak = Math.max(streak, habit.bestStreak);
      
      return {
        ...habit,
        completions: newCompletions,
        streak,
        bestStreak
      };
    });
    this.notifyListeners();
  }

  private calculateStreak(completions: HabitCompletion[]): number {
    if (completions.length === 0) return 0;
    
    const sortedCompletions = [...completions]
      .filter(c => c.completed)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    if (sortedCompletions.length === 0) return 0;
    
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < sortedCompletions.length; i++) {
      const completionDate = new Date(sortedCompletions[i].date);
      completionDate.setHours(0, 0, 0, 0);
      
      const diffDays = Math.floor((today.getTime() - completionDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays === i) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  }

  deleteHabit(id: string): void {
    this.habits = this.habits.filter(habit => habit.id !== id);
    this.notifyListeners();
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }
}

export const habitStore = new HabitStore();

// Schedule store for AI Scheduler
class ScheduleStore {
  private schedules: DaySchedule[] = [];
  private listeners: Set<() => void> = new Set();

  getSchedules(): DaySchedule[] {
    return this.schedules;
  }

  getTodaySchedule(): DaySchedule | null {
    const today = new Date().toISOString().split('T')[0];
    return this.schedules.find(s => s.date === today) || null;
  }

  saveSchedule(schedule: DaySchedule): void {
    const existingIndex = this.schedules.findIndex(s => s.date === schedule.date);
    if (existingIndex >= 0) {
      this.schedules[existingIndex] = schedule;
    } else {
      this.schedules.push(schedule);
    }
    this.notifyListeners();
  }

  updateScheduleItem(scheduleId: string, itemId: string, updates: Partial<ScheduleItem>): void {
    this.schedules = this.schedules.map(schedule => {
      if (schedule.id === scheduleId) {
        return {
          ...schedule,
          items: schedule.items.map(item =>
            item.id === itemId ? { ...item, ...updates } : item
          ),
          updatedAt: new Date(),
        };
      }
      return schedule;
    });
    this.notifyListeners();
  }

  deleteScheduleItem(scheduleId: string, itemId: string): void {
    this.schedules = this.schedules.map(schedule => {
      if (schedule.id === scheduleId) {
        return {
          ...schedule,
          items: schedule.items.filter(item => item.id !== itemId),
          updatedAt: new Date(),
        };
      }
      return schedule;
    });
    this.notifyListeners();
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }
}

export const scheduleStore = new ScheduleStore();