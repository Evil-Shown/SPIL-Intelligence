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
import { CardSkeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { Section } from '../components/hud/Section';
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
      className={`min-h-[120px] border-t border-black/15 pt-3 ${isOver ? 'bg-black/[0.03]' : ''}`}
    >
      <h3 className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-black/45">{label}</h3>
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
      <div className="cursor-grab border-b border-black/10 py-4 active:cursor-grabbing">
        <div className="flex items-baseline justify-between gap-4">
          <h4 className="text-sm font-medium text-black">{task.title}</h4>
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-black/55">{task.priority}</span>
        </div>
        <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-black/40">
          {task.assignee ?? 'Unassigned'}
          {task.dueDate ? ` · ${formatDate(task.dueDate)}` : ''}
        </p>
      </div>
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
    <Section kicker="Work" title="TASKS">

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
    </Section>
  );
}
