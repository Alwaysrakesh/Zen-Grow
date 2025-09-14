import { useState, useEffect, useRef } from "react";
import { 
  Droplets, 
  Eye, 
  Users, 
  Activity,
  HeartHandshake,
  Bell,
  BellOff,
  X,
  Volume2,
  CheckCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface WellnessReminder {
  id: string;
  type: string;
  title: string;
  message: string;
  frequency_minutes: number;
  last_triggered_at: string | null;
  is_enabled: boolean;
}

export const WellnessReminders = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reminders, setReminders] = useState<WellnessReminder[]>([]);
  const [activeReminder, setActiveReminder] = useState<WellnessReminder | null>(null);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (user) {
      fetchReminders();
      setupReminderInterval();
    }
  }, [user]);

  const fetchReminders = async () => {
    try {
      const { data, error } = await supabase
        .from('wellness_reminders')
        .select('*')
        .eq('user_id', user?.id);

      if (error) throw error;
      
      // If no reminders exist, create default ones
      if (!data || data.length === 0) {
        const defaultReminders = [
          { type: 'water', title: 'Hydration Break', message: 'Time to drink some water! Stay hydrated 💧', frequency_minutes: 30 },
          { type: 'eye_break', title: 'Eye Rest', message: 'Look away from your screen for 20 seconds 👁️', frequency_minutes: 20 },
          { type: 'walk', title: 'Movement Break', message: 'Take a short walk to stretch your legs 🚶', frequency_minutes: 60 },
          { type: 'stretch', title: 'Stretch Break', message: 'Time for a quick stretch session 🙆', frequency_minutes: 45 },
          { type: 'posture', title: 'Posture Check', message: 'Check and correct your posture 🪑', frequency_minutes: 40 }
        ];
        
        const { data: createdReminders } = await supabase
          .from('wellness_reminders')
          .insert(defaultReminders.map(r => ({ ...r, user_id: user?.id })))
          .select();
          
        setReminders(createdReminders || []);
      } else {
        setReminders(data);
      }
    } catch (error: any) {
      console.error('Error fetching reminders:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupReminderInterval = () => {
    const interval = setInterval(async () => {
      if (!user) return;

      const { data: activeReminders } = await supabase
        .from('wellness_reminders')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_enabled', true);

      if (activeReminders) {
        for (const reminder of activeReminders) {
          const shouldTrigger = checkIfShouldTrigger(reminder);
          if (shouldTrigger) {
            triggerReminder(reminder);
            updateLastTriggered(reminder.id);
          }
        }
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  };

  const checkIfShouldTrigger = (reminder: WellnessReminder) => {
    if (!reminder.last_triggered_at) return true;
    
    const lastTriggered = new Date(reminder.last_triggered_at);
    const now = new Date();
    const minutesPassed = (now.getTime() - lastTriggered.getTime()) / (1000 * 60);
    
    return minutesPassed >= reminder.frequency_minutes;
  };

  const playNotificationSound = () => {
    if (!soundEnabled) return;
    
    // Create audio context for notification sound
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  };

  const triggerReminder = (reminder: WellnessReminder) => {
    setActiveReminder(reminder);
    playNotificationSound();
    
    // Show browser notification if permitted
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(reminder.title, {
        body: reminder.message,
        icon: "/zengrow-icon.png",
      });
    }
    
    // Show toast notification as well
    toast({
      title: reminder.title,
      description: reminder.message,
      duration: 10000,
    });

    // Auto-hide dialog after 15 seconds
    setTimeout(() => {
      setActiveReminder(null);
    }, 15000);
  };

  const updateLastTriggered = async (reminderId: string) => {
    await supabase
      .from('wellness_reminders')
      .update({ last_triggered_at: new Date().toISOString() })
      .eq('id', reminderId);
  };

  const toggleReminder = async (reminderId: string, enabled: boolean) => {
    try {
      const { error } = await supabase
        .from('wellness_reminders')
        .update({ is_enabled: enabled })
        .eq('id', reminderId);

      if (error) throw error;

      setReminders(prev => 
        prev.map(r => r.id === reminderId ? { ...r, is_enabled: enabled } : r)
      );

      toast({
        title: enabled ? "Reminder enabled" : "Reminder disabled",
        description: `${enabled ? "You'll receive" : "You won't receive"} this reminder`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update reminder",
        variant: "destructive",
      });
    }
  };

  const requestNotificationPermission = async () => {
    if ("Notification" in window && Notification.permission === "default") {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        toast({
          title: "Notifications enabled",
          description: "You'll receive desktop notifications for reminders",
        });
      }
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'water': return <Droplets className="h-4 w-4 text-blue-500" />;
      case 'eye_break': return <Eye className="h-4 w-4 text-green-500" />;
      case 'walk': return <Users className="h-4 w-4 text-orange-500" />;
      case 'stretch': return <Activity className="h-4 w-4 text-purple-500" />;
      case 'posture': return <HeartHandshake className="h-4 w-4 text-pink-500" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  if (loading) {
    return <div className="animate-pulse">Loading reminders...</div>;
  }

  return (
    <>
      {/* Active Reminder Popup Dialog */}
      <Dialog open={!!activeReminder} onOpenChange={(open) => !open && setActiveReminder(null)}>
        <DialogContent className="sm:max-w-md animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl">
              {activeReminder && getIcon(activeReminder.type)}
              <span>{activeReminder?.title}</span>
            </DialogTitle>
            <DialogDescription className="text-base pt-2">
              {activeReminder?.message}
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Volume2 className="h-4 w-4" />
              <span>Sound {soundEnabled ? "on" : "off"}</span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setActiveReminder(null);
                  if (activeReminder) {
                    // Snooze for 10 minutes
                    setTimeout(() => triggerReminder(activeReminder), 600000);
                    toast({
                      title: "Reminder snoozed",
                      description: "I'll remind you again in 10 minutes",
                    });
                  }
                }}
              >
                Snooze
              </Button>
              <Button
                onClick={() => setActiveReminder(null)}
                className="gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                Done
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Card className="hover:shadow-lg transition-all">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Wellness Reminders
            </CardTitle>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Volume2 className="h-4 w-4 text-muted-foreground" />
                <Switch
                  checked={soundEnabled}
                  onCheckedChange={setSoundEnabled}
                  aria-label="Toggle sound"
                />
              </div>
              {"Notification" in window && Notification.permission === "default" && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={requestNotificationPermission}
                >
                  Enable Notifications
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {reminders.map((reminder) => (
              <div
                key={reminder.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-all"
              >
                <div className="flex items-center gap-3">
                  {getIcon(reminder.type)}
                  <div>
                    <p className="font-medium text-sm">{reminder.title}</p>
                    <p className="text-xs text-muted-foreground">
                      Every {reminder.frequency_minutes} minutes
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => triggerReminder(reminder)}
                    className="text-xs"
                  >
                    Test
                  </Button>
                  <Badge variant={reminder.is_enabled ? "default" : "secondary"}>
                    {reminder.is_enabled ? "Active" : "Paused"}
                  </Badge>
                  <Switch
                    checked={reminder.is_enabled}
                    onCheckedChange={(checked) => toggleReminder(reminder.id, checked)}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
};