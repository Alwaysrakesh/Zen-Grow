import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { CheckSquare, Brain, Heart, FileText, Target, LogOut, User, LayoutDashboard } from "lucide-react";
import { TaskManager } from "@/components/TaskManager";
import { FocusAssistant } from "@/components/FocusAssistant";
import { MindfulnessTab } from "@/components/MindfulnessTab";
import { DailySummary } from "@/components/DailySummary";
import { HabitTracker } from "@/components/HabitTracker";
import Dashboard from "./Dashboard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import zengrowLogo from "@/assets/zengrow-logo.png";

type TabType = 'dashboard' | 'tasks' | 'focus' | 'mindfulness' | 'habits' | 'summary';

const Index = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    return (location.state as any)?.tab || 'dashboard';
  });
  const { user, session, loading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !session) {
      navigate('/auth');
    }
  }, [loading, session, navigate]);

  const tabs = [
    { id: 'dashboard' as TabType, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tasks' as TabType, label: 'Tasks', icon: CheckSquare },
    { id: 'focus' as TabType, label: 'Focus', icon: Brain },
    { id: 'mindfulness' as TabType, label: 'Mindfulness', icon: Heart },
    { id: 'habits' as TabType, label: 'Habits', icon: Target },
    { id: 'summary' as TabType, label: 'Summary', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-focus p-0.5">
                <img 
                  src={zengrowLogo} 
                  alt="Zengrow" 
                  className="h-full w-full rounded-full object-cover bg-background"
                />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-focus bg-clip-text text-transparent">
                Zengrow
              </h1>
            </div>
            <div className="flex items-center gap-4">
              {user && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="w-4 h-4" />
                  <span>{user.email}</span>
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={signOut}
                className="flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="container mx-auto px-4 py-6">
        <nav className="flex gap-2 p-1 bg-muted/30 rounded-lg max-w-2xl mx-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-md transition-all duration-300",
                  activeTab === tab.id
                    ? "bg-background shadow-soft text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 pb-12">
        <div className="max-w-6xl mx-auto">
          {activeTab === 'dashboard' && (
            <div className="animate-in fade-in duration-500">
              <Dashboard />
            </div>
          )}
          
          {activeTab === 'tasks' && (
            <div className="animate-in fade-in duration-500">
              <TaskManager />
            </div>
          )}
          
          {activeTab === 'focus' && (
            <div className="animate-in fade-in duration-500">
              <FocusAssistant />
            </div>
          )}
          
          {activeTab === 'mindfulness' && (
            <div className="animate-in fade-in duration-500">
              <MindfulnessTab />
            </div>
          )}
          
          {activeTab === 'habits' && (
            <div className="animate-in fade-in duration-500">
              <HabitTracker />
            </div>
          )}
          
          {activeTab === 'summary' && (
            <div className="animate-in fade-in duration-500">
              <DailySummary />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;