import { useState, useEffect } from "react";
import { Plus, Target, Flame, Trophy, Calendar, X } from "lucide-react";
import { Habit } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { habitStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const habitColors = [
  "hsl(var(--primary))",
  "hsl(var(--secondary))",
  "hsl(var(--accent))",
  "hsl(var(--calm-purple))",
  "hsl(var(--calm-green))",
  "hsl(var(--focus-blue))",
];

export function HabitTracker() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newHabit, setNewHabit] = useState({
    title: "",
    description: "",
    frequency: "daily" as const,
    color: habitColors[0],
  });

  useEffect(() => {
    setHabits(habitStore.getHabits());
    const unsubscribe = habitStore.subscribe(() => {
      setHabits(habitStore.getHabits());
    });
    return unsubscribe;
  }, []);

  const handleAddHabit = () => {
    if (newHabit.title.trim()) {
      habitStore.addHabit(newHabit);
      setNewHabit({
        title: "",
        description: "",
        frequency: "daily",
        color: habitColors[0],
      });
      setShowAddForm(false);
    }
  };

  const handleToggleHabit = (habitId: string, date: string) => {
    habitStore.toggleHabitCompletion(habitId, date);
  };

  const handleDeleteHabit = (id: string) => {
    habitStore.deleteHabit(id);
  };

  const getDateString = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const getLast7Days = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push(date);
    }
    return days;
  };

  const isHabitCompletedOnDate = (habit: Habit, dateString: string) => {
    const completion = habit.completions.find(c => c.date === dateString);
    return completion?.completed || false;
  };

  const days = getLast7Days();

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="bg-gradient-calm p-6 rounded-xl shadow-soft">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Daily Habits</h2>
            <p className="text-sm text-muted-foreground mt-1">Track your progress and build consistency</p>
          </div>
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            variant="focus"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Habit
          </Button>
        </div>

        {/* Add Habit Form */}
        {showAddForm && (
          <div className="mt-4 p-4 bg-background/50 rounded-lg space-y-3">
            <Input
              placeholder="Habit name (e.g., Morning meditation)"
              value={newHabit.title}
              onChange={(e) => setNewHabit({ ...newHabit, title: e.target.value })}
              className="bg-background/50 border-primary/20"
            />
            <Textarea
              placeholder="Description (optional)"
              value={newHabit.description}
              onChange={(e) => setNewHabit({ ...newHabit, description: e.target.value })}
              className="bg-background/50 border-primary/20 min-h-[60px]"
            />
            <div className="flex gap-2">
              <div className="flex gap-2 flex-1">
                {habitColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setNewHabit({ ...newHabit, color })}
                    className={cn(
                      "w-8 h-8 rounded-full transition-all",
                      newHabit.color === color ? "ring-2 ring-offset-2 ring-offset-background" : ""
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <Button onClick={handleAddHabit} variant="focus" size="sm">
                Add Habit
              </Button>
              <Button
                onClick={() => setShowAddForm(false)}
                variant="outline"
                size="sm"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Habits Grid */}
      {habits.length > 0 ? (
        <div className="space-y-4">
          {/* Calendar Header */}
          <div className="flex items-center gap-4 px-4">
            <div className="w-48 text-sm font-medium text-muted-foreground">Habit</div>
            <div className="flex gap-2 flex-1">
              {days.map((day) => (
                <div
                  key={day.toISOString()}
                  className="flex-1 text-center text-xs text-muted-foreground"
                >
                  <div className="font-medium">{day.toLocaleDateString('en', { weekday: 'short' })}</div>
                  <div>{day.getDate()}</div>
                </div>
              ))}
            </div>
            <div className="w-20 text-center text-sm font-medium text-muted-foreground">Streak</div>
          </div>

          {/* Habits List */}
          {habits.map((habit) => (
            <div
              key={habit.id}
              className="bg-card/50 backdrop-blur-sm rounded-lg p-4 border border-border/50 hover:border-primary/20 transition-all"
            >
              <div className="flex items-center gap-4">
                {/* Habit Info */}
                <div className="w-48">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: habit.color }}
                    />
                    <h3 className="font-medium text-foreground">{habit.title}</h3>
                  </div>
                  {habit.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                      {habit.description}
                    </p>
                  )}
                </div>

                {/* Completion Grid */}
                <div className="flex gap-2 flex-1">
                  {days.map((day) => {
                    const dateString = getDateString(day);
                    const isCompleted = isHabitCompletedOnDate(habit, dateString);
                    const isToday = dateString === getDateString(new Date());

                    return (
                      <button
                        key={dateString}
                        onClick={() => handleToggleHabit(habit.id, dateString)}
                        className={cn(
                          "flex-1 aspect-square rounded-lg transition-all",
                          isCompleted
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted/30 hover:bg-muted/50",
                          isToday && "ring-2 ring-primary/50"
                        )}
                      >
                        {isCompleted && (
                          <div className="w-full h-full flex items-center justify-center">
                            <Target className="w-4 h-4" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Streak */}
                <div className="w-20 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Flame className={cn(
                      "w-4 h-4",
                      habit.streak > 0 ? "text-orange-500" : "text-muted-foreground"
                    )} />
                    <span className={cn(
                      "text-sm font-medium",
                      habit.streak > 0 ? "text-foreground" : "text-muted-foreground"
                    )}>
                      {habit.streak}
                    </span>
                  </div>
                  {habit.bestStreak > 0 && (
                    <div className="flex items-center justify-center gap-1 mt-1">
                      <Trophy className="w-3 h-3 text-yellow-500" />
                      <span className="text-xs text-muted-foreground">{habit.bestStreak}</span>
                    </div>
                  )}
                </div>

                {/* Delete Button */}
                <button
                  onClick={() => handleDeleteHabit(habit.id)}
                  className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg">No habits yet</p>
          <p className="text-sm mt-2">Start building healthy habits today</p>
        </div>
      )}

      {/* Stats Summary */}
      {habits.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gradient-focus p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-primary">
              {habits.filter(h => h.streak > 0).length}
            </div>
            <div className="text-sm text-muted-foreground">Active Streaks</div>
          </div>
          <div className="bg-gradient-mindful p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-secondary">
              {Math.max(...habits.map(h => h.bestStreak), 0)}
            </div>
            <div className="text-sm text-muted-foreground">Best Streak</div>
          </div>
          <div className="bg-gradient-calm p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-accent">
              {habits.reduce((acc, h) => {
                const today = getDateString(new Date());
                return acc + (isHabitCompletedOnDate(h, today) ? 1 : 0);
              }, 0)}/{habits.length}
            </div>
            <div className="text-sm text-muted-foreground">Today's Progress</div>
          </div>
        </div>
      )}
    </div>
  );
}