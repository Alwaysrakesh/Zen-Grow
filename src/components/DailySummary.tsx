import { useState } from "react";
import { FileText, TrendingUp, Brain, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { taskStore, focusStore } from "@/lib/store";
import { DailySummary as DailySummaryType } from "@/types";

export function DailySummary() {
  const [summary, setSummary] = useState<DailySummaryType | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateSummary = () => {
    setIsGenerating(true);
    
    // Simulate AI generation
    setTimeout(() => {
      const tasks = taskStore.getTasks();
      const completedToday = tasks.filter(t => 
        t.completed && t.completedAt && 
        new Date(t.completedAt).toDateString() === new Date().toDateString()
      );
      
      const sessions = focusStore.getTodaysSessions();
      const totalFocusMinutes = sessions.reduce((acc, s) => acc + s.duration, 0);
      
      const insights = [];
      const suggestions = [];
      
      // Generate insights based on data
      if (completedToday.length > 5) {
        insights.push("Exceptional productivity today! You completed more tasks than usual.");
      } else if (completedToday.length > 0) {
        insights.push(`You completed ${completedToday.length} task${completedToday.length > 1 ? 's' : ''} today.`);
      }
      
      if (totalFocusMinutes > 120) {
        insights.push("Great focus stamina! You maintained deep concentration for extended periods.");
      } else if (totalFocusMinutes > 60) {
        insights.push("Good balance of focused work sessions today.");
      }
      
      if (sessions.filter(s => s.type === 'short-break').length > 0) {
        insights.push("You remembered to take breaks - excellent for sustained productivity!");
      }
      
      // Generate suggestions
      const incompleteTasks = tasks.filter(t => !t.completed);
      const highPriorityIncomplete = incompleteTasks.filter(t => t.priority === 'high');
      
      if (highPriorityIncomplete.length > 0) {
        suggestions.push(`Focus on your ${highPriorityIncomplete.length} high-priority task${highPriorityIncomplete.length > 1 ? 's' : ''} tomorrow morning when energy is highest.`);
      }
      
      if (totalFocusMinutes < 60) {
        suggestions.push("Try to increase your focused work time tomorrow with longer deep work sessions.");
      }
      
      if (sessions.filter(s => s.type === 'short-break').length === 0) {
        suggestions.push("Remember to schedule regular breaks tomorrow to maintain energy levels.");
      }
      
      suggestions.push("Start tomorrow with a 5-minute mindfulness exercise to set a positive tone.");
      
      const newSummary: DailySummaryType = {
        date: new Date(),
        tasksCompleted: completedToday.length,
        focusMinutes: totalFocusMinutes,
        mindfulBreaks: sessions.filter(s => s.type === 'short-break').length,
        insights: insights.length > 0 ? insights : ["Today was a fresh start. Tomorrow brings new opportunities."],
        suggestions: suggestions
      };
      
      setSummary(newSummary);
      setIsGenerating(false);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {!summary ? (
        <Card className="p-12 text-center bg-gradient-calm">
          <FileText className="w-12 h-12 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-3">Generate Your Daily Summary</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Get AI-powered insights about your productivity and mindfulness practices, 
            plus personalized suggestions for tomorrow.
          </p>
          <Button 
            variant="focus" 
            size="lg"
            onClick={generateSummary}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <Sparkles className="w-4 h-4 mr-2 animate-pulse" />
                Analyzing Your Day...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Summary
              </>
            )}
          </Button>
        </Card>
      ) : (
        <>
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-6 bg-gradient-focus text-primary-foreground">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-white/20 rounded-lg">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <span className="text-sm opacity-90">Tasks Completed</span>
              </div>
              <p className="text-3xl font-bold">{summary.tasksCompleted}</p>
            </Card>
            
            <Card className="p-6 bg-gradient-mindful">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-accent/20 rounded-lg">
                  <Brain className="w-5 h-5 text-accent-foreground" />
                </div>
                <span className="text-sm text-accent-foreground">Focus Time</span>
              </div>
              <p className="text-3xl font-bold text-accent-foreground">{summary.focusMinutes} min</p>
            </Card>
            
            <Card className="p-6 bg-card">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <span className="text-sm text-muted-foreground">Mindful Breaks</span>
              </div>
              <p className="text-3xl font-bold text-foreground">{summary.mindfulBreaks}</p>
            </Card>
          </div>

          {/* Insights */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Today's Insights
            </h3>
            <ul className="space-y-2">
              {summary.insights.map((insight, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span className="text-foreground">{insight}</span>
                </li>
              ))}
            </ul>
          </Card>

          {/* Suggestions */}
          <Card className="p-6 bg-gradient-calm">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Tomorrow's Recommendations
            </h3>
            <ul className="space-y-3">
              {summary.suggestions.map((suggestion, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="text-2xl">
                    {index === 0 ? '🎯' : index === 1 ? '⏰' : index === 2 ? '🧘' : '✨'}
                  </span>
                  <span className="text-foreground">{suggestion}</span>
                </li>
              ))}
            </ul>
          </Card>

          {/* Generate New Button */}
          <div className="text-center">
            <Button
              variant="outline"
              onClick={() => {
                setSummary(null);
                generateSummary();
              }}
            >
              Generate New Summary
            </Button>
          </div>
        </>
      )}
    </div>
  );
}