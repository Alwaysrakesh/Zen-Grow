import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { Task } from "@/types";
import { TaskItem } from "./TaskItem";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { taskStore } from "@/lib/store";

export function TaskManager() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [priority, setPriority] = useState<Task['priority']>('medium');
  const [estimatedMinutes, setEstimatedMinutes] = useState("");

  useEffect(() => {
    setTasks(taskStore.getTasks());
    const unsubscribe = taskStore.subscribe(() => {
      setTasks(taskStore.getTasks());
    });
    return unsubscribe;
  }, []);

  const handleAddTask = () => {
    if (newTaskTitle.trim()) {
      taskStore.addTask({
        title: newTaskTitle,
        completed: false,
        priority,
        estimatedMinutes: estimatedMinutes ? parseInt(estimatedMinutes) : undefined
      });
      setNewTaskTitle("");
      setEstimatedMinutes("");
      setPriority('medium');
    }
  };

  const handleToggleTask = (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (task) {
      taskStore.updateTask(id, { completed: !task.completed });
    }
  };

  const handleDeleteTask = (id: string) => {
    taskStore.deleteTask(id);
  };

  const incompleteTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-calm p-6 rounded-xl shadow-soft">
        <h2 className="text-xl font-semibold text-foreground mb-4">Add New Task</h2>
        <div className="space-y-3">
          <Input
            placeholder="What needs to be done?"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}
            className="bg-background/50 border-primary/20"
          />
          <div className="flex gap-3">
            <Select value={priority} onValueChange={(value: Task['priority']) => setPriority(value)}>
              <SelectTrigger className="w-32 bg-background/50 border-primary/20">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="number"
              placeholder="Est. minutes"
              value={estimatedMinutes}
              onChange={(e) => setEstimatedMinutes(e.target.value)}
              className="w-32 bg-background/50 border-primary/20"
            />
            <Button onClick={handleAddTask} variant="focus" className="flex-1">
              <Plus className="w-4 h-4 mr-2" />
              Add Task
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {incompleteTasks.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Active Tasks</h3>
            <div className="space-y-2">
              {incompleteTasks.map(task => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggle={handleToggleTask}
                  onDelete={handleDeleteTask}
                />
              ))}
            </div>
          </div>
        )}

        {completedTasks.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Completed</h3>
            <div className="space-y-2 opacity-60">
              {completedTasks.map(task => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggle={handleToggleTask}
                  onDelete={handleDeleteTask}
                />
              ))}
            </div>
          </div>
        )}

        {tasks.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg">No tasks yet</p>
            <p className="text-sm mt-2">Add your first task to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}