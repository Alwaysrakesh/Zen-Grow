import { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export function QuickMeditation() {
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60); // 1 minute in seconds
  const [selectedDuration, setSelectedDuration] = useState(60);
  const intervalRef = useRef<NodeJS.Timeout>();

  const durations = [
    { label: "1 min", value: 60 },
    { label: "3 min", value: 180 },
    { label: "5 min", value: 300 },
  ];

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 0.1) {
            setIsActive(false);
            // Play a gentle sound or notification
            return 0;
          }
          return prev - 0.1;
        });
      }, 100);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const reset = () => {
    setIsActive(false);
    setTimeLeft(selectedDuration);
  };

  const handleDurationChange = (value: number) => {
    setSelectedDuration(value);
    setTimeLeft(value);
    setIsActive(false);
  };

  const getMotivationalText = () => {
    const progress = ((selectedDuration - timeLeft) / selectedDuration) * 100;
    if (progress < 25) return "Focus on your breath...";
    if (progress < 50) return "Let thoughts pass like clouds...";
    if (progress < 75) return "Find your inner calm...";
    return "Almost there, stay present...";
  };

  return (
    <Card className="p-6 bg-gradient-mindful">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Quick Meditation
          </h3>
          <div className="flex gap-1">
            {durations.map((d) => (
              <Button
                key={d.value}
                size="sm"
                variant={selectedDuration === d.value ? "default" : "outline"}
                onClick={() => handleDurationChange(d.value)}
                disabled={isActive}
              >
                {d.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="text-center space-y-6">
          {/* Animated circle */}
          <div className="relative w-48 h-48 mx-auto">
            <div className={`absolute inset-0 rounded-full bg-primary/10 ${isActive ? 'animate-pulse' : ''}`} />
            <div className={`absolute inset-4 rounded-full bg-primary/20 ${isActive ? 'animate-pulse animation-delay-200' : ''}`} />
            <div className={`absolute inset-8 rounded-full bg-primary/30 ${isActive ? 'animate-pulse animation-delay-400' : ''}`} />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl font-light tabular-nums">
                  {formatTime(timeLeft)}
                </div>
                <div className="text-sm text-muted-foreground mt-2">
                  {isActive && getMotivationalText()}
                </div>
              </div>
            </div>
          </div>

          <Progress 
            value={((selectedDuration - timeLeft) / selectedDuration) * 100} 
            className="h-2"
          />
        </div>

        <div className="flex gap-2 justify-center">
          <Button
            onClick={() => setIsActive(!isActive)}
            variant={isActive ? "secondary" : "default"}
            className="min-w-[120px]"
            disabled={timeLeft === 0}
          >
            {isActive ? (
              <>
                <Pause className="w-4 h-4 mr-2" />
                Pause
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                {timeLeft === selectedDuration ? "Start" : "Resume"}
              </>
            )}
          </Button>
          <Button onClick={reset} variant="outline">
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
        </div>

        {/* Meditation tips */}
        {!isActive && (
          <div className="mt-4 p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Tip:</strong> Find a comfortable position, close your eyes, and focus on your natural breathing pattern. 
              When thoughts arise, acknowledge them and gently return to your breath.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}