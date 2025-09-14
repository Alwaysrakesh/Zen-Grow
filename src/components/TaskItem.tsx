import { Check, Trash2, Circle } from "lucide-react";
import { Task } from "@/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export function TaskItem({ task, onToggle, onDelete }: TaskItemProps) {
  return (
    <div className="group flex items-center gap-3 p-4 rounded-lg bg-card hover:bg-accent/5 transition-all duration-300">
      <button
        onClick={() => onToggle(task.id)}
        className={cn(
          "flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-300",
          task.completed 
            ? "bg-primary border-primary" 
            : "border-muted-foreground/30 hover:border-primary"
        )}
      >
        {task.completed && <Check className="w-3 h-3 text-primary-foreground" />}
      </button>
      
      <div className="flex-1">
        <p className={cn(
          "text-foreground transition-all duration-300",
          task.completed && "line-through opacity-60"
        )}>
          {task.title}
        </p>
        <div className="flex items-center gap-4 mt-1">
          <span className={cn(
            "text-xs px-2 py-0.5 rounded-full",
            task.priority === 'high' && "bg-destructive/10 text-destructive",
            task.priority === 'medium' && "bg-primary/10 text-primary",
            task.priority === 'low' && "bg-muted text-muted-foreground"
          )}>
            {task.priority}
          </span>
          {task.estimatedMinutes && (
            <span className="text-xs text-muted-foreground">
              {task.estimatedMinutes} min
            </span>
          )}
        </div>
      </div>
      
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onDelete(task.id)}
        className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
      >
        <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
      </Button>
    </div>
  );
}