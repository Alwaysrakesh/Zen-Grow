import { useState, useEffect } from "react";
import { Play, Pause, RotateCcw, Brain, Coffee, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { taskStore, focusStore } from "@/lib/store";
import { FocusSession } from "@/types";
import { useToast } from "@/hooks/use-toast";

export function FocusAssistant() {
  const [currentSession, setCurrentSession] = useState<FocusSession | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [tasks, setTasks] = useState(taskStore.getTasks());
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = taskStore.subscribe(() => {
      setTasks(taskStore.getTasks());
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            handleSessionComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const handleSessionComplete = () => {
    if (currentSession) {
      focusStore.addSession({
        ...currentSession,
        completedAt: new Date()
      });
      
      toast({
        title: "Session Complete! 🎉",
        description: `Great job! You completed a ${currentSession.duration} minute ${currentSession.type} session.`,
      });
    }
  };

  const startSession = (type: FocusSession['type'], duration: number) => {
    const session: FocusSession = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      duration,
      startedAt: new Date()
    };
    
    setCurrentSession(session);
    setTimeLeft(duration * 60);
    setIsRunning(true);
  };

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(0);
    setCurrentSession(null);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const incompleteTasks = tasks.filter(t => !t.completed);
  const highPriorityTasks = incompleteTasks.filter(t => t.priority === 'high');
  const totalEstimatedTime = incompleteTasks.reduce((acc, task) => acc + (task.estimatedMinutes || 25), 0);

  const getSuggestion = () => {
    if (highPriorityTasks.length > 0) {
      return {
        icon: Target,
        text: `You have ${highPriorityTasks.length} high-priority task${highPriorityTasks.length > 1 ? 's' : ''}. Consider a focused deep work session.`,
        action: () => startSession('deep-work', 90)
      };
    } else if (totalEstimatedTime > 120) {
      return {
        icon: Brain,
        text: "You have a lot to do today. Break it down with Pomodoro sessions.",
        action: () => startSession('pomodoro', 25)
      };
    } else {
      return {
        icon: Coffee,
        text: "Light workload today. Perfect for mindful productivity.",
        action: () => startSession('pomodoro', 25)
      };
    }
  };

  const suggestion = getSuggestion();

  return (
    <div className="space-y-6">
      {/* AI Suggestion */}
      <Card className="p-6 bg-gradient-focus text-primary-foreground">
        <div className="flex items-start gap-4">
          <suggestion.icon className="w-6 h-6 mt-1" />
          <div className="flex-1">
            <h3 className="font-semibold mb-2">AI Focus Recommendation</h3>
            <p className="text-sm opacity-90 mb-4">{suggestion.text}</p>
            <Button 
              variant="secondary" 
              size="sm"
              onClick={suggestion.action}
              disabled={isRunning}
            >
              Start Recommended Session
            </Button>
          </div>
        </div>
      </Card>

      {/* Timer Display */}
      {currentSession && (
        <Card className="p-8 text-center bg-card">
          <div className="mb-4">
            <p className="text-sm text-muted-foreground mb-2">
              {currentSession.type === 'pomodoro' && 'Pomodoro Session'}
              {currentSession.type === 'deep-work' && 'Deep Work Session'}
              {currentSession.type === 'short-break' && 'Short Break'}
            </p>
            <div className="text-6xl font-bold text-primary">
              {formatTime(timeLeft)}
            </div>
          </div>
          
          <div className="flex justify-center gap-3">
            <Button
              variant={isRunning ? "outline" : "focus"}
              onClick={toggleTimer}
            >
              {isRunning ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
              {isRunning ? 'Pause' : 'Resume'}
            </Button>
            <Button variant="outline" onClick={resetTimer}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>
        </Card>
      )}

      {/* Quick Start Options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card 
          className="p-4 cursor-pointer hover:bg-accent/5 transition-all duration-300"
          onClick={() => startSession('pomodoro', 25)}
        >
          <Brain className="w-5 h-5 text-primary mb-2" />
          <h4 className="font-medium">Pomodoro</h4>
          <p className="text-sm text-muted-foreground">25 min focused work</p>
        </Card>
        
        <Card 
          className="p-4 cursor-pointer hover:bg-accent/5 transition-all duration-300"
          onClick={() => startSession('deep-work', 90)}
        >
          <Target className="w-5 h-5 text-primary mb-2" />
          <h4 className="font-medium">Deep Work</h4>
          <p className="text-sm text-muted-foreground">90 min intense focus</p>
        </Card>
        
        <Card 
          className="p-4 cursor-pointer hover:bg-accent/5 transition-all duration-300"
          onClick={() => startSession('short-break', 5)}
        >
          <Coffee className="w-5 h-5 text-primary mb-2" />
          <h4 className="font-medium">Short Break</h4>
          <p className="text-sm text-muted-foreground">5 min recharge</p>
        </Card>
      </div>

      {/* Stats */}
      <Card className="p-4 bg-gradient-calm">
        <h4 className="font-medium mb-3">Today's Focus Stats</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-2xl font-bold text-primary">
              {focusStore.getTodaysSessions().length}
            </p>
            <p className="text-sm text-muted-foreground">Sessions completed</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-primary">
              {focusStore.getTodaysSessions().reduce((acc, s) => acc + s.duration, 0)}
            </p>
            <p className="text-sm text-muted-foreground">Minutes focused</p>
          </div>
        </div>
      </Card>
    </div>
  );
}