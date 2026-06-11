import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { CardSkeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { tasksApi } from '../services/endpoints';
import { formatDate } from '../lib/utils';
import type { Task, TaskStatus } from '../types';

const columns: { status: TaskStatus; label: string }[] = [
  { status: 'TODO', label: 'Todo' },
  { status: 'IN_PROGRESS', label: 'In Progress' },
  { status: 'DONE', label: 'Done' },
];

function Column({ status, label, children }: { status: TaskStatus; label: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[200px] rounded-xl p-3 transition-colors ${isOver ? 'bg-neural-trace' : 'bg-elevated/50'}`}
    >
      <h3 className="mb-3 text-sm font-medium text-primary">{label}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function TaskCard({ task, isDragging }: { task: Task; isDragging?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: task.id,
    data: { task },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card className="cursor-grab !p-4 active:cursor-grabbing">
        <h4 className="mb-2 text-sm font-medium text-primary">{task.title}</h4>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
          <Badge variant={task.priority === 'HIGH' || task.priority === 'CRITICAL' ? 'risk' : 'warning'}>
            {task.priority}
          </Badge>
          {task.module && <span className="font-mono">{task.module}</span>}
        </div>
        <div className="mt-2 text-xs text-muted">
          {task.assignee && <span>{task.assignee}</span>}
          {task.dueDate && <span> · Due {formatDate(task.dueDate)}</span>}
        </div>
      </Card>
    </div>
  );
}

export function Tasks() {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const queryClient = useQueryClient();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const { data: tasks, isLoading, error, refetch } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => tasksApi.list(),
  });

  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) =>
      tasksApi.updateStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks?.find((t) => t.id === event.active.id);
    if (task) setActiveTask(task);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as TaskStatus;
    const task = tasks?.find((t) => t.id === taskId);
    if (task && task.status !== newStatus && columns.some((c) => c.status === newStatus)) {
      mutation.mutate({ id: taskId, status: newStatus });
    }
  };

  if (error) {
    return <EmptyState title="Failed to load tasks" description={error.message} actionLabel="Retry" onAction={() => refetch()} />;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-primary">Tasks</h1>

      {isLoading ? (
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {columns.map((col) => (
              <Column key={col.status} status={col.status} label={col.label}>
                {tasks
                  ?.filter((t) => t.status === col.status)
                  .map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))}
              </Column>
            ))}
          </div>
          <DragOverlay>
            {activeTask ? <TaskCard task={activeTask} isDragging /> : null}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
}
