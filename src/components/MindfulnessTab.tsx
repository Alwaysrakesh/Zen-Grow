import { useState } from "react";
import { Heart, Sparkles, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { reflectionPrompts, motivationalQuotes } from "@/lib/mindfulness-data";
import { MindfulExercise } from "@/types";
import { GuidedBreathing } from "./GuidedBreathing";
import { BodyScan } from "./BodyScan";
import { QuickMeditation } from "./QuickMeditation";

export function MindfulnessTab() {
  const [currentReflection, setCurrentReflection] = useState(reflectionPrompts[0]);
  const [currentQuote, setCurrentQuote] = useState(motivationalQuotes[0]);

  const getRandomExercise = (exercises: MindfulExercise[], current: MindfulExercise) => {
    const filtered = exercises.filter(e => e.id !== current.id);
    return filtered[Math.floor(Math.random() * filtered.length)];
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="breathing" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="breathing">Guided Breathing</TabsTrigger>
          <TabsTrigger value="meditation">Meditation</TabsTrigger>
          <TabsTrigger value="bodyscan">Body Scan</TabsTrigger>
        </TabsList>
        
        <TabsContent value="breathing" className="mt-6">
          <GuidedBreathing />
        </TabsContent>
        
        <TabsContent value="meditation" className="mt-6">
          <QuickMeditation />
        </TabsContent>
        
        <TabsContent value="bodyscan" className="mt-6">
          <BodyScan />
        </TabsContent>
      </Tabs>

      {/* Reflection Prompt */}
      <Card className="p-6 bg-card">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <Heart className="w-6 h-6 text-lavender" />
            <h3 className="text-lg font-semibold">Reflection Prompt</h3>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentReflection(getRandomExercise(reflectionPrompts, currentReflection))}
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-foreground leading-relaxed italic">{currentReflection.content}</p>
        <div className="mt-4">
          <textarea
            className="w-full p-3 rounded-lg bg-background border border-input resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            rows={4}
            placeholder="Take a moment to reflect and write your thoughts..."
          />
        </div>
      </Card>

      {/* Motivational Quote */}
      <Card className="p-8 text-center bg-gradient-calm">
        <div className="flex justify-center mb-4">
          <Sparkles className="w-8 h-8 text-primary" />
        </div>
        <blockquote className="text-lg text-foreground font-medium leading-relaxed">
          {currentQuote.content}
        </blockquote>
        <Button
          variant="ghost"
          size="sm"
          className="mt-6"
          onClick={() => setCurrentQuote(getRandomExercise(motivationalQuotes, currentQuote))}
        >
          <RefreshCw className="w-3 h-3 mr-2" />
          New Quote
        </Button>
      </Card>
    </div>
  );
}