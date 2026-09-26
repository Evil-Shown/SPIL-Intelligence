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

function Column({
  status,
  label,
  code,
  count,
  children,
}: {
  status: TaskStatus;
  label: string;
  code: string;
  count: number;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={`border border-black/80 bg-white transition-colors duration-150 ${
        isOver ? 'bg-black/[0.04] ring-2 ring-black' : ''
      }`}
    >
      {/* Tactical Column Header */}
      <div className="flex items-center justify-between border-b border-black/80 bg-[#f4f4f4] px-3 py-2 text-black">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] font-bold text-[#e10600]">
            {code}
          </span>
          <span className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-black">
            {label}
          </span>
        </div>
        <span className="border border-black/40 bg-white px-1.5 py-0.5 font-mono text-[9px] font-bold text-black">
          {count}
        </span>
      </div>

      {/* Column Body / Drop Zone */}
      <div className="min-h-[480px] p-2.5 space-y-2.5 bg-[#fafafa]/50">
        {children}
        {count === 0 && (
          <div className="flex h-32 items-center justify-center border border-dashed border-black/20 text-center">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-black/30">
              [ NO DIRECTIVES ACTIVE ]
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

const priorityBadgeStyles: Record<string, string> = {
  CRITICAL: 'border-[#e10600] text-[#e10600] bg-[#e10600]/5',
  HIGH: 'border-[#e10600]/80 text-[#e10600] bg-[#e10600]/5',
  MEDIUM: 'border-black/50 text-black/80 bg-black/5',
  LOW: 'border-black/30 text-black/50 bg-black/5',
};

function TaskCard({ task, isDragging }: { task: Task; isDragging?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: task.id,
    data: { task },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  };

  const priorityStyle =
    priorityBadgeStyles[task.priority] || 'border-black/40 text-black/70';

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`group relative cursor-grab border border-black/80 bg-white p-3 shadow-none transition-all hover:border-black active:cursor-grabbing hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
        isDragging ? 'ring-2 ring-[#e10600] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' : ''
      }`}
    >
      {/* Corner crosshair ticks */}
      <span className="absolute -top-[3px] -left-[3px] font-mono text-[8px] leading-none text-black/40 select-none">
        +
      </span>
      <span className="absolute -top-[3px] -right-[3px] font-mono text-[8px] leading-none text-black/40 select-none">
        +
      </span>

      {/* Header: ID & Priority */}
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-black/45">
          TASK-{task.id.slice(0, 6).toUpperCase()}
        </span>
        <span
          className={`border px-1.5 py-0.2 font-mono text-[9px] font-bold uppercase tracking-[0.12em] ${priorityStyle}`}
        >
          {task.priority}
        </span>
      </div>

      {/* Task Title */}
      <h4 className="mt-2 text-xs font-semibold leading-snug text-black font-sans group-hover:text-[#e10600] transition-colors">
        {task.title}
      </h4>

      {/* Meta Footer */}
      <div className="mt-3 flex items-center justify-between border-t border-black/10 pt-2 font-mono text-[9px] uppercase tracking-[0.12em] text-black/60">
        <span className="flex items-center gap-1 text-black/75">
          <span className="text-[#e10600]">▸</span> {task.assignee ?? 'UNASSIGNED'}
        </span>
        {task.dueDate && (
          <span className="text-black/50">
            {formatDate(task.dueDate)}
          </span>
        )}
      </div>
    </div>
  );
}

const columns: { status: TaskStatus; label: string; code: string }[] = [
  { status: 'TODO', label: 'PENDING DISPATCH', code: '01 //' },
  { status: 'IN_PROGRESS', label: 'ACTIVE OPERATION', code: '02 //' },
  { status: 'DONE', label: 'RESOLVED DIRECTIVE', code: '03 //' },
];

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

  const totalCount = tasks?.length ?? 0;
  const doneCount = tasks?.filter((t) => t.status === 'DONE').length ?? 0;
  const progressPercent = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  return (
    <Section
      kicker="Directive Tracking"
      title="TASKS MATRIX"
      action={
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 border border-black/20 bg-white px-2.5 py-1 font-mono text-[10px] text-black">
            <span className="text-[#e10600]">STATUS:</span>
            <span>{doneCount}/{totalCount} RESOLVED ({progressPercent}%)</span>
          </div>
          <button
            type="button"
            className="border border-black bg-black px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-white hover:bg-[#e10600] hover:border-[#e10600] transition-colors"
          >
            + DISPATCH TASK
          </button>
        </div>
      }
    >
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
            {columns.map((col) => {
              const colTasks = tasks?.filter((t) => t.status === col.status) ?? [];
              return (
                <Column
                  key={col.status}
                  status={col.status}
                  label={col.label}
                  code={col.code}
                  count={colTasks.length}
                >
                  {colTasks.map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </Column>
              );
            })}
          </div>
          <DragOverlay>
            {activeTask ? <TaskCard task={activeTask} isDragging /> : null}
          </DragOverlay>
        </DndContext>
      )}
    </Section>
  );
}
