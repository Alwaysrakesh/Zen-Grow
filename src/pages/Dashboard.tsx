import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  CheckSquare, 
  Brain, 
  Heart, 
  Target, 
  TrendingUp, 
  Calendar,
  Clock,
  Award,
  ArrowRight,
  Activity,
  Droplets,
  Eye,
  Users,
  Sparkles,
  Sun,
  Moon,
  Coffee,
  Zap
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { taskStore, habitStore, focusStore } from "@/lib/store";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { WellnessReminders } from "@/components/WellnessReminders";
import { ScheduledAlarms } from "@/components/ScheduledAlarms";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState(taskStore.getTasks());
  const [habits, setHabits] = useState(habitStore.getHabits());
  const [focusSessions] = useState(focusStore.getSessions());
  const [profile, setProfile] = useState<any>(null);
  const [greeting, setGreeting] = useState("");
  const [timeOfDay, setTimeOfDay] = useState("");
  const [motivationalQuote] = useState("Every accomplishment starts with the decision to try.");
  
  useEffect(() => {
    const unsubscribeTasks = taskStore.subscribe(() => {
      setTasks(taskStore.getTasks());
    });
    const unsubscribeHabits = habitStore.subscribe(() => {
      setHabits(habitStore.getHabits());
    });
    
    // Fetch user profile
    const fetchProfile = async () => {
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        setProfile(data);
      }
    };
    
    fetchProfile();
    
    // Set greeting based on time
    const hour = new Date().getHours();
    if (hour < 12) {
      setTimeOfDay("morning");
      setGreeting("Good morning");
    } else if (hour < 17) {
      setTimeOfDay("afternoon");
      setGreeting("Good afternoon");
    } else {
      setTimeOfDay("evening");
      setGreeting("Good evening");
    }
    
    return () => {
      unsubscribeTasks();
      unsubscribeHabits();
    };
  }, [user]);
  
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  
  // Calculate metrics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const taskCompletionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  
  const todayFocusMinutes = focusSessions
    .filter(s => s.completedAt && format(s.completedAt, 'yyyy-MM-dd') === todayStr)
    .reduce((acc, s) => acc + s.duration, 0);
  
  const activeHabits = habits.filter(h => {
    const todayCompletion = h.completions.find(c => c.date === todayStr);
    return todayCompletion?.completed;
  }).length;
  
  const totalHabits = habits.length;
  const habitCompletionRate = totalHabits > 0 ? (activeHabits / totalHabits) * 100 : 0;
  
  const getTimeIcon = () => {
    if (timeOfDay === "morning") return <Sun className="h-5 w-5 text-yellow-500" />;
    if (timeOfDay === "afternoon") return <Coffee className="h-5 w-5 text-orange-500" />;
    return <Moon className="h-5 w-5 text-indigo-500" />;
  };

  const stats = [
    {
      title: "Tasks Completed",
      value: `${completedTasks}/${totalTasks}`,
      description: "Today's progress",
      icon: CheckSquare,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      progress: taskCompletionRate
    },
    {
      title: "Focus Time",
      value: `${todayFocusMinutes}m`,
      description: "Minutes focused today",
      icon: Brain,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      progress: Math.min((todayFocusMinutes / 120) * 100, 100)
    },
    {
      title: "Habits Tracked",
      value: `${activeHabits}/${totalHabits}`,
      description: "Completed today",
      icon: Target,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      progress: habitCompletionRate
    },
    {
      title: "Streak",
      value: habits.reduce((max, h) => Math.max(max, h.streak), 0),
      description: "Best habit streak",
      icon: Award,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
      progress: null
    }
  ];

  const quickActions = [
    { 
      title: "Manage Tasks", 
      description: "View and organize",
      icon: CheckSquare,
      color: "bg-blue-500/10 hover:bg-blue-500/20 text-blue-500",
      action: () => navigate("/", { state: { tab: 'tasks' } })
    },
    { 
      title: "Start Focus", 
      description: "Begin session",
      icon: Brain,
      color: "bg-purple-500/10 hover:bg-purple-500/20 text-purple-500",
      action: () => navigate("/", { state: { tab: 'focus' } })
    },
    { 
      title: "Track Habits", 
      description: "Update progress",
      icon: Target,
      color: "bg-green-500/10 hover:bg-green-500/20 text-green-500",
      action: () => navigate("/", { state: { tab: 'habits' } })
    },
    { 
      title: "View Schedule", 
      description: "AI-optimized",
      icon: Calendar,
      color: "bg-orange-500/10 hover:bg-orange-500/20 text-orange-500",
      action: () => navigate("/", { state: { tab: 'scheduler' } })
    }
  ];

  const upcomingTasks = tasks
    .filter(t => !t.completed && t.priority === 'high')
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-muted/40">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Header with Personalized Greeting */}
      <div className="relative border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div className="space-y-2 animate-fade-in">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                {getTimeIcon()}
                <span className="text-sm">{format(today, 'EEEE, MMMM d, yyyy')}</span>
              </div>
              <h1 className="text-4xl font-bold">
                <span className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent animate-gradient">
                  {greeting}, {profile?.username || profile?.full_name || user?.email?.split('@')[0]}!
                </span>
              </h1>
              <p className="text-lg text-muted-foreground flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-yellow-500 animate-pulse" />
                How is your day going? Let's make it productive!
              </p>
              <p className="text-sm text-muted-foreground italic mt-2">"{motivationalQuote}"</p>
            </div>
            <div className="flex gap-3">
              <Button 
                onClick={() => navigate("/")} 
                variant="outline" 
                size="lg"
                className="hover:scale-105 transition-all"
              >
                <Activity className="mr-2 h-4 w-4" />
                Go to App
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Wellness & Alarms Section */}
        <div className="mb-8 animate-fade-in">
          <Tabs defaultValue="reminders" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="reminders">Wellness Reminders</TabsTrigger>
              <TabsTrigger value="alarms">Scheduled Alarms</TabsTrigger>
            </TabsList>
            <TabsContent value="reminders">
              <WellnessReminders />
            </TabsContent>
            <TabsContent value="alarms">
              <ScheduledAlarms />
            </TabsContent>
          </Tabs>
        </div>

        {/* Stats Grid with Animations */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card 
                key={index} 
                className="hover:shadow-xl transition-all duration-300 hover:scale-105 hover:-translate-y-1 animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </CardTitle>
                    <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                      <Icon className={`h-4 w-4 ${stat.color}`} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stat.description}
                  </p>
                  {stat.progress !== null && (
                    <Progress 
                      value={stat.progress} 
                      className="mt-3 h-2" 
                    />
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions with Modern Design */}
          <div className="lg:col-span-2">
            <Card className="hover:shadow-xl transition-all duration-300 animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  Quick Actions
                </CardTitle>
                <CardDescription>Jump into your productivity tools</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {quickActions.map((action, index) => {
                    const Icon = action.icon;
                    return (
                      <Button
                        key={index}
                        variant="outline"
                        className={`h-24 flex flex-col items-center justify-center gap-2 ${action.color} border-2 hover:scale-105 transition-all animate-fade-in`}
                        style={{ animationDelay: `${index * 50}ms` }}
                        onClick={action.action}
                      >
                        <Icon className="h-8 w-8" />
                        <div className="text-center">
                          <div className="font-semibold text-sm">{action.title}</div>
                          <div className="text-xs opacity-80">
                            {action.description}
                          </div>
                        </div>
                      </Button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* High Priority Tasks with Better Visual */}
          <div>
            <Card className="hover:shadow-xl transition-all duration-300 animate-fade-in">
              <CardHeader className="bg-gradient-to-r from-red-500/10 to-orange-500/10">
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-red-500" />
                    Priority Tasks
                  </span>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => navigate("/", { state: { tab: 'tasks' } })}
                  >
                    View All
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {upcomingTasks.length > 0 ? (
                  <div className="space-y-3">
                    {upcomingTasks.map((task, index) => (
                      <div
                        key={task.id}
                        className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-red-500/5 to-orange-500/5 hover:from-red-500/10 hover:to-orange-500/10 transition-all animate-fade-in"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{task.title}</p>
                          {task.estimatedMinutes && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                              <Clock className="h-3 w-3" />
                              {task.estimatedMinutes} min
                            </p>
                          )}
                        </div>
                        <Badge variant="destructive" className="text-xs">
                          High
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CheckSquare className="h-12 w-12 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      No high priority tasks
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Productivity Insights with Better Visuals */}
        <Card className="mt-6 hover:shadow-xl transition-all duration-300 animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary animate-pulse" />
              Productivity Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-6 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 hover:from-blue-500/20 hover:to-purple-500/20 transition-all">
                <p className="text-sm font-medium mb-2">Most Productive Time</p>
                <p className="text-3xl font-bold text-primary">Morning</p>
                <p className="text-xs text-muted-foreground mt-1">Based on completed tasks</p>
              </div>
              <div className="p-6 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 hover:from-green-500/20 hover:to-emerald-500/20 transition-all">
                <p className="text-sm font-medium mb-2">Weekly Average</p>
                <p className="text-3xl font-bold text-green-500">{Math.round(completedTasks / 7)} tasks/day</p>
                <p className="text-xs text-muted-foreground mt-1">Last 7 days</p>
              </div>
              <div className="p-6 rounded-xl bg-gradient-to-br from-orange-500/10 to-red-500/10 hover:from-orange-500/20 hover:to-red-500/20 transition-all">
                <p className="text-sm font-medium mb-2">Focus Improvement</p>
                <p className="text-3xl font-bold text-orange-500">+15%</p>
                <p className="text-xs text-muted-foreground mt-1">Compared to last week</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
    </div>
  );
};

export default Dashboard;