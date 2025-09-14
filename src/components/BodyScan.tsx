import { useState, useEffect, useRef } from "react";
import { Play, Pause, SkipForward, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const bodyParts = [
  { name: "Toes", duration: 15, instruction: "Notice the sensations in your toes. Feel any tension and let it go." },
  { name: "Feet", duration: 15, instruction: "Bring awareness to your feet. Feel them connected to the ground." },
  { name: "Ankles & Calves", duration: 20, instruction: "Move your attention up to your ankles and calves. Release any tightness." },
  { name: "Knees & Thighs", duration: 20, instruction: "Notice your knees and thighs. Let them feel heavy and relaxed." },
  { name: "Hips & Pelvis", duration: 20, instruction: "Scan your hips and pelvis area. Allow them to soften and release." },
  { name: "Lower Back", duration: 20, instruction: "Bring awareness to your lower back. Let any tension melt away." },
  { name: "Abdomen", duration: 20, instruction: "Notice your belly rising and falling with each breath." },
  { name: "Chest", duration: 20, instruction: "Feel your chest expanding and contracting. Notice your heartbeat." },
  { name: "Shoulders", duration: 20, instruction: "Let your shoulders drop and relax. Release the weight you carry." },
  { name: "Arms & Hands", duration: 20, instruction: "Scan down your arms to your fingertips. Let them feel warm and heavy." },
  { name: "Neck", duration: 15, instruction: "Notice any tension in your neck. Gently release it." },
  { name: "Face & Head", duration: 20, instruction: "Relax your jaw, eyes, and forehead. Let your entire face soften." },
  { name: "Whole Body", duration: 30, instruction: "Feel your entire body as one. Notice the calm and peace within." },
];

export function BodyScan() {
  const [isActive, setIsActive] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(bodyParts[0].duration);
  const [totalElapsed, setTotalElapsed] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout>();

  const totalDuration = bodyParts.reduce((sum, part) => sum + part.duration, 0);
  const currentPart = bodyParts[currentIndex];

  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 0.1) {
            // Move to next body part
            if (currentIndex < bodyParts.length - 1) {
              setCurrentIndex(i => i + 1);
              return bodyParts[currentIndex + 1].duration;
            } else {
              // Completed
              setIsActive(false);
              return 0;
            }
          }
          return prev - 0.1;
        });
        setTotalElapsed(e => e + 0.1);
      }, 100);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, currentIndex]);

  const skipToNext = () => {
    if (currentIndex < bodyParts.length - 1) {
      setCurrentIndex(i => i + 1);
      setTimeLeft(bodyParts[currentIndex + 1].duration);
    }
  };

  const reset = () => {
    setIsActive(false);
    setCurrentIndex(0);
    setTimeLeft(bodyParts[0].duration);
    setTotalElapsed(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="p-6 bg-gradient-calm">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Volume2 className="w-5 h-5" />
            Body Scan Meditation
          </h3>
          <span className="text-sm text-muted-foreground">
            {formatTime(totalElapsed)} / {formatTime(totalDuration)}
          </span>
        </div>

        <div className="space-y-4">
          <div className="text-center">
            <div className="text-2xl font-semibold text-primary mb-2">
              {currentPart.name}
            </div>
            <p className="text-foreground/80 leading-relaxed">
              {currentPart.instruction}
            </p>
          </div>

          <div className="space-y-2">
            <Progress 
              value={(totalElapsed / totalDuration) * 100} 
              className="h-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Part {currentIndex + 1} of {bodyParts.length}</span>
              <span>{Math.ceil(timeLeft)}s remaining</span>
            </div>
          </div>

          {/* Visual body indicator */}
          <div className="flex justify-center">
            <div className="relative w-32 h-48 bg-muted/20 rounded-lg p-2">
              <div className="grid grid-rows-6 gap-1 h-full">
                {["head", "shoulders", "chest", "abdomen", "hips", "legs"].map((part, idx) => (
                  <div
                    key={part}
                    className={`rounded transition-all duration-500 ${
                      idx <= Math.floor(currentIndex / 2) 
                        ? "bg-primary/50 animate-pulse" 
                        : "bg-muted/30"
                    }`}
                  />
                ))}
              </div>
            </div>
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
                {currentIndex === 0 ? "Start" : "Resume"}
              </>
            )}
          </Button>
          {isActive && currentIndex < bodyParts.length - 1 && (
            <Button onClick={skipToNext} variant="outline">
              <SkipForward className="w-4 h-4 mr-2" />
              Next
            </Button>
          )}
          {(currentIndex > 0 || totalElapsed > 0) && (
            <Button onClick={reset} variant="outline">
              Reset
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}