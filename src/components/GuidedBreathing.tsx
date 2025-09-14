import { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Wind } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface BreathingPattern {
  inhale: number;
  hold1: number;
  exhale: number;
  hold2: number;
  name: string;
}

const breathingPatterns: BreathingPattern[] = [
  { name: "4-7-8 Breathing", inhale: 4, hold1: 7, exhale: 8, hold2: 0 },
  { name: "Box Breathing", inhale: 4, hold1: 4, exhale: 4, hold2: 4 },
  { name: "Deep Calm", inhale: 5, hold1: 5, exhale: 7, hold2: 3 },
];

export function GuidedBreathing() {
  const [isActive, setIsActive] = useState(false);
  const [currentPattern, setCurrentPattern] = useState(breathingPatterns[0]);
  const [phase, setPhase] = useState<"inhale" | "hold1" | "exhale" | "hold2">("inhale");
  const [timeLeft, setTimeLeft] = useState(currentPattern.inhale);
  const [cycles, setCycles] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 0.1) {
            // Move to next phase
            switch (phase) {
              case "inhale":
                if (currentPattern.hold1 > 0) {
                  setPhase("hold1");
                  return currentPattern.hold1;
                } else {
                  setPhase("exhale");
                  return currentPattern.exhale;
                }
              case "hold1":
                setPhase("exhale");
                return currentPattern.exhale;
              case "exhale":
                if (currentPattern.hold2 > 0) {
                  setPhase("hold2");
                  return currentPattern.hold2;
                } else {
                  setPhase("inhale");
                  setCycles(c => c + 1);
                  return currentPattern.inhale;
                }
              case "hold2":
                setPhase("inhale");
                setCycles(c => c + 1);
                return currentPattern.inhale;
            }
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
  }, [isActive, phase, currentPattern]);

  const getPhaseText = () => {
    switch (phase) {
      case "inhale": return "Breathe In";
      case "hold1": return "Hold";
      case "exhale": return "Breathe Out";
      case "hold2": return "Hold";
    }
  };

  const getPhaseColor = () => {
    switch (phase) {
      case "inhale": return "text-blue-500";
      case "hold1": 
      case "hold2": return "text-amber-500";
      case "exhale": return "text-green-500";
    }
  };

  const getTotalTime = () => {
    return currentPattern.inhale + currentPattern.hold1 + currentPattern.exhale + currentPattern.hold2;
  };

  const getCurrentProgress = () => {
    let elapsed = 0;
    switch (phase) {
      case "inhale":
        elapsed = currentPattern.inhale - timeLeft;
        break;
      case "hold1":
        elapsed = currentPattern.inhale + (currentPattern.hold1 - timeLeft);
        break;
      case "exhale":
        elapsed = currentPattern.inhale + currentPattern.hold1 + (currentPattern.exhale - timeLeft);
        break;
      case "hold2":
        elapsed = currentPattern.inhale + currentPattern.hold1 + currentPattern.exhale + (currentPattern.hold2 - timeLeft);
        break;
    }
    return (elapsed / getTotalTime()) * 100;
  };

  const reset = () => {
    setIsActive(false);
    setPhase("inhale");
    setTimeLeft(currentPattern.inhale);
    setCycles(0);
  };

  return (
    <Card className="p-6 bg-gradient-mindful">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Wind className="w-5 h-5" />
            Guided Breathing
          </h3>
          <select
            className="px-3 py-1 rounded-lg bg-background border border-input text-sm"
            value={currentPattern.name}
            onChange={(e) => {
              const pattern = breathingPatterns.find(p => p.name === e.target.value)!;
              setCurrentPattern(pattern);
              reset();
            }}
            disabled={isActive}
          >
            {breathingPatterns.map(p => (
              <option key={p.name} value={p.name}>{p.name}</option>
            ))}
          </select>
        </div>

        <div className="text-center space-y-4">
          <div className={`text-4xl font-bold ${getPhaseColor()} animate-pulse`}>
            {getPhaseText()}
          </div>
          <div className="text-6xl font-light tabular-nums">
            {Math.ceil(timeLeft)}
          </div>
          <Progress value={getCurrentProgress()} className="h-2" />
          <div className="text-sm text-muted-foreground">
            Cycles completed: {cycles}
          </div>
        </div>

        <div className="flex gap-2 justify-center">
          <Button
            onClick={() => setIsActive(!isActive)}
            variant={isActive ? "secondary" : "default"}
            className="min-w-[120px]"
          >
            {isActive ? (
              <>
                <Pause className="w-4 h-4 mr-2" />
                Pause
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Start
              </>
            )}
          </Button>
          <Button onClick={reset} variant="outline">
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
        </div>
      </div>
    </Card>
  );
}