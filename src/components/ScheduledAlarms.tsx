import { useState, useEffect, useRef } from "react";
import { 
  Bell, 
  BellOff, 
  Plus, 
  Trash2, 
  Edit,
  Clock,
  Droplets,
  Eye,
  Users,
  Activity,
  HeartHandshake,
  Volume2,
  CheckCircle,
  X
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ScheduledAlarm {
  id: string;
  type: string;
  title: string;
  message: string;
  scheduled_time: string;
  is_active: boolean;
  days_of_week: number[];
  sound_enabled: boolean;
}

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const ScheduledAlarms = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [alarms, setAlarms] = useState<ScheduledAlarm[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [activeAlarm, setActiveAlarm] = useState<ScheduledAlarm | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [triggeredAlarms, setTriggeredAlarms] = useState<Set<string>>(new Set());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [newAlarm, setNewAlarm] = useState({
    type: 'water',
    title: '',
    message: '',
    scheduled_time: '',
    days_of_week: [1, 2, 3, 4, 5],
    sound_enabled: true
  });

  useEffect(() => {
    if (user) {
      fetchAlarms();
      requestNotificationPermission();
    }
  }, [user]);

  useEffect(() => {
    if (user && alarms.length > 0) {
      setupAlarmChecker();
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [alarms, user]);

  const fetchAlarms = async () => {
    try {
      const { data, error } = await supabase
        .from('scheduled_alarms')
        .select('*')
        .eq('user_id', user?.id)
        .order('scheduled_time');

      if (error) throw error;
      setAlarms(data || []);
    } catch (error: any) {
      console.error('Error fetching alarms:', error);
    } finally {
      setLoading(false);
    }
  };

  const requestNotificationPermission = async () => {
    if ("Notification" in window && Notification.permission === "default") {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        toast({
          title: "Notifications enabled",
          description: "You'll receive desktop notifications for alarms",
        });
      }
    }
  };

  const setupAlarmChecker = () => {
    const checkAlarms = () => {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:00`;
      const currentDay = now.getDay();
      const alarmKey = `${currentTime}-${currentDay}`;

      alarms.forEach(alarm => {
        const uniqueAlarmId = `${alarm.id}-${alarmKey}`;
        
        if (
          alarm.is_active &&
          alarm.scheduled_time === currentTime &&
          alarm.days_of_week.includes(currentDay) &&
          !triggeredAlarms.has(uniqueAlarmId)
        ) {
          triggerAlarm(alarm);
          setTriggeredAlarms(prev => new Set(prev).add(uniqueAlarmId));
        }
      });
    };

    // Clear the old interval if it exists
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Check every 30 seconds for better accuracy
    intervalRef.current = setInterval(checkAlarms, 30000);
    
    // Also check immediately
    checkAlarms();
  };

  const triggerAlarm = (alarm: ScheduledAlarm) => {
    // Set active alarm for popup dialog
    setActiveAlarm(alarm);
    
    // Play sound if enabled and global sound is on
    if (alarm.sound_enabled && soundEnabled) {
      playAlarmSound();
    }

    // Browser notification if permitted
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(alarm.title, {
        body: alarm.message,
        icon: "/zengrow-icon.png",
      });
    }
    
    // Show toast notification as well
    toast({
      title: alarm.title,
      description: alarm.message,
      duration: 10000,
    });

    // Auto-hide dialog after 15 seconds
    setTimeout(() => {
      setActiveAlarm(null);
    }, 15000);
  };

  const playAlarmSound = () => {
    if (!soundEnabled) return;
    
    // Create a more pleasant alarm sound using Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Create a pleasant two-tone alarm
    oscillator.frequency.value = 600;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
    
    // Second tone
    setTimeout(() => {
      const osc2 = audioContext.createOscillator();
      const gain2 = audioContext.createGain();
      
      osc2.connect(gain2);
      gain2.connect(audioContext.destination);
      
      osc2.frequency.value = 800;
      osc2.type = 'sine';
      
      gain2.gain.setValueAtTime(0.3, audioContext.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      
      osc2.start(audioContext.currentTime);
      osc2.stop(audioContext.currentTime + 0.2);
    }, 250);
  };

  const toggleAlarm = async (alarmId: string, enabled: boolean) => {
    try {
      const { error } = await supabase
        .from('scheduled_alarms')
        .update({ is_active: enabled })
        .eq('id', alarmId);

      if (error) throw error;

      setAlarms(prev => 
        prev.map(a => a.id === alarmId ? { ...a, is_active: enabled } : a)
      );

      toast({
        title: enabled ? "Alarm enabled" : "Alarm disabled",
        description: `The alarm has been ${enabled ? "activated" : "deactivated"}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update alarm",
        variant: "destructive",
      });
    }
  };

  const addAlarm = async () => {
    try {
      const { error } = await supabase
        .from('scheduled_alarms')
        .insert({
          user_id: user?.id,
          ...newAlarm,
          scheduled_time: newAlarm.scheduled_time + ':00'
        });

      if (error) throw error;

      toast({
        title: "Alarm added",
        description: "Your new alarm has been created",
      });

      setIsAddDialogOpen(false);
      fetchAlarms();
      
      // Reset form
      setNewAlarm({
        type: 'water',
        title: '',
        message: '',
        scheduled_time: '',
        days_of_week: [1, 2, 3, 4, 5],
        sound_enabled: true
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to add alarm",
        variant: "destructive",
      });
    }
  };

  const deleteAlarm = async (alarmId: string) => {
    try {
      const { error } = await supabase
        .from('scheduled_alarms')
        .delete()
        .eq('id', alarmId);

      if (error) throw error;

      setAlarms(prev => prev.filter(a => a.id !== alarmId));
      
      toast({
        title: "Alarm deleted",
        description: "The alarm has been removed",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete alarm",
        variant: "destructive",
      });
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'water': return <Droplets className="h-4 w-4 text-blue-500" />;
      case 'eye_break': return <Eye className="h-4 w-4 text-green-500" />;
      case 'walk': return <Users className="h-4 w-4 text-orange-500" />;
      case 'stretch': return <Activity className="h-4 w-4 text-purple-500" />;
      case 'posture': return <HeartHandshake className="h-4 w-4 text-pink-500" />;
      default: return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  if (loading) {
    return <div className="animate-pulse">Loading alarms...</div>;
  }

  return (
    <>
      {/* Active Alarm Popup Dialog */}
      <Dialog open={!!activeAlarm} onOpenChange={(open) => !open && setActiveAlarm(null)}>
        <DialogContent className="sm:max-w-md animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl">
              {activeAlarm && getIcon(activeAlarm.type)}
              <span>{activeAlarm?.title}</span>
            </DialogTitle>
            <DialogDescription className="text-base pt-2">
              {activeAlarm?.message}
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
                  setActiveAlarm(null);
                  if (activeAlarm) {
                    // Snooze for 5 minutes
                    setTimeout(() => triggerAlarm(activeAlarm), 300000);
                    toast({
                      title: "Alarm snoozed",
                      description: "I'll remind you again in 5 minutes",
                    });
                  }
                }}
              >
                Snooze
              </Button>
              <Button
                onClick={() => setActiveAlarm(null)}
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
              <Clock className="h-5 w-5 text-primary" />
              Scheduled Alarms
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
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Alarm
                  </Button>
                </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Alarm</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label>Type</Label>
                  <Select 
                    value={newAlarm.type} 
                    onValueChange={(value) => setNewAlarm({...newAlarm, type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="water">Water Break</SelectItem>
                      <SelectItem value="eye_break">Eye Break</SelectItem>
                      <SelectItem value="walk">Walk Break</SelectItem>
                      <SelectItem value="stretch">Stretch Break</SelectItem>
                      <SelectItem value="posture">Posture Check</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Title</Label>
                  <Input
                    value={newAlarm.title}
                    onChange={(e) => setNewAlarm({...newAlarm, title: e.target.value})}
                    placeholder="Alarm title"
                  />
                </div>
                
                <div>
                  <Label>Message</Label>
                  <Textarea
                    value={newAlarm.message}
                    onChange={(e) => setNewAlarm({...newAlarm, message: e.target.value})}
                    placeholder="Reminder message"
                  />
                </div>
                
                <div>
                  <Label>Time</Label>
                  <Input
                    type="time"
                    value={newAlarm.scheduled_time}
                    onChange={(e) => setNewAlarm({...newAlarm, scheduled_time: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label>Days</Label>
                  <div className="flex gap-2 flex-wrap">
                    {daysOfWeek.map((day, index) => (
                      <Button
                        key={index}
                        size="sm"
                        variant={newAlarm.days_of_week.includes(index) ? "default" : "outline"}
                        onClick={() => {
                          const days = newAlarm.days_of_week.includes(index)
                            ? newAlarm.days_of_week.filter(d => d !== index)
                            : [...newAlarm.days_of_week, index];
                          setNewAlarm({...newAlarm, days_of_week: days});
                        }}
                      >
                        {day}
                      </Button>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <Label>Sound Enabled</Label>
                  <Switch
                    checked={newAlarm.sound_enabled}
                    onCheckedChange={(checked) => setNewAlarm({...newAlarm, sound_enabled: checked})}
                  />
                </div>
                
                <Button onClick={addAlarm} className="w-full">
                  Create Alarm
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alarms.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No alarms set. Create your first alarm to stay on track!
            </p>
          ) : (
            alarms.map((alarm) => (
              <div
                key={alarm.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-all"
              >
                <div className="flex items-center gap-3">
                  {getIcon(alarm.type)}
                  <div>
                    <p className="font-medium text-sm">{alarm.title}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {alarm.scheduled_time.slice(0, 5)}
                      <span className="mx-1">•</span>
                      {alarm.days_of_week.map(d => daysOfWeek[d]).join(', ')}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {alarm.sound_enabled && <Bell className="h-3 w-3 text-muted-foreground" />}
                  <Badge variant={alarm.is_active ? "default" : "secondary"}>
                    {alarm.is_active ? "Active" : "Paused"}
                  </Badge>
                  <Switch
                    checked={alarm.is_active}
                    onCheckedChange={(checked) => toggleAlarm(alarm.id, checked)}
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => triggerAlarm(alarm)}
                    className="text-xs"
                  >
                    Test
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteAlarm(alarm.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
    </>
  );
};