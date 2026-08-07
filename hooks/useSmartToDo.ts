import { useMemo } from 'react';
import { Task } from '@/types/course';

export function useSmartToDo(tasks: Task[]) {
  const smartTasks = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return tasks.filter(task => {
      if (task.completed) return false; // In a real app, maybe show recently completed?

      const dueDate = new Date(task.dueDate);
      
      // Logic: Show if due today, overdue, or high priority due soon
      const isDueToday = dueDate >= today && dueDate < tomorrow;
      const isOverdue = dueDate < today;
      const isHighPrioritySoon = task.priority === 'high' && dueDate < new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000); // Due in 3 days

      return isDueToday || isOverdue || isHighPrioritySoon;
    }).sort((a, b) => {
      // Sort by due date, then priority
      const dateA = new Date(a.dueDate).getTime();
      const dateB = new Date(b.dueDate).getTime();
      if (dateA !== dateB) return dateA - dateB;
      
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return (priorityOrder[a.priority || 'low'] || 2) - (priorityOrder[b.priority || 'low'] || 2);
    });
  }, [tasks]);

  return smartTasks;
}
