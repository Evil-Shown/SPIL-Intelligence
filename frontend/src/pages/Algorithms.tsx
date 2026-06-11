import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BookOpen } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { CardSkeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { algorithmsApi } from '../services/endpoints';
import { cn } from '../lib/utils';
import type { Algorithm } from '../types';

const categoryTree: Record<string, string[]> = {
  Geometry: ['Polygon Offset', 'Boolean Operations', 'Convex Hull', 'Ear Clipping', 'Arc Fitting', 'Bezier'],
  Spatial: ['KD Tree', 'QuadTree', 'R-Tree', 'Sweep Line', 'BSP Tree'],
  Optimization: ['Nesting / Packing', 'Bin Packing', 'Genetic Algorithm'],
  Collision: ['SAT', 'GJK'],
};

export function Algorithms() {
  const [selectedCategory, setSelectedCategory] = useState('Geometry');
  const [selected, setSelected] = useState<Algorithm | null>(null);

  const { data: algorithms, isLoading, error, refetch } = useQuery({
    queryKey: ['algorithms'],
    queryFn: algorithmsApi.list,
  });

  const categoryItems = algorithms?.filter((a) => a.category === selectedCategory) ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-primary">Algorithms Library</h1>

      <div className="flex gap-6">
        <aside className="hidden w-56 shrink-0 lg:block">
          <nav className="space-y-4">
            {Object.entries(categoryTree).map(([category, subcats]) => (
              <div key={category}>
                <button
                  onClick={() => {
                    setSelectedCategory(category);
                    setSelected(null);
                  }}
                  className={cn(
                    'mb-1 w-full text-left text-sm font-medium transition-colors',
                    selectedCategory === category ? 'text-neural' : 'text-secondary hover:text-primary'
                  )}
                >
                  {category}
                </button>
                <ul className="ml-3 space-y-0.5 border-l border-subtle pl-3">
                  {subcats.map((sub) => (
                    <li key={sub} className="text-xs text-muted">{sub}</li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </aside>

        <div className="flex-1">
          {error ? (
            <EmptyState title="Failed to load" description={error.message} actionLabel="Retry" onAction={() => refetch()} />
          ) : isLoading ? (
            <CardSkeleton />
          ) : selected ? (
            <Card>
              <button onClick={() => setSelected(null)} className="mb-4 text-xs text-neural hover:underline">
                ← Back to {selectedCategory}
              </button>
              <h2 className="mb-4 text-xl font-bold text-primary">{selected.name}</h2>
              <dl className="mb-6 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-xs uppercase text-muted">Complexity</dt>
                  <dd className="font-mono text-neural">{selected.complexity}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase text-muted">Used in</dt>
                  <dd className="text-secondary">{selected.usedIn.join(', ')}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase text-muted">Status</dt>
                  <dd><Badge variant="active">Implemented</Badge></dd>
                </div>
              </dl>
              {selected.description && (
                <section className="mb-4">
                  <h3 className="mb-2 font-semibold text-primary">What it does</h3>
                  <p className="text-sm text-secondary">{selected.description}</p>
                </section>
              )}
              {selected.implementation && (
                <section className="mb-4">
                  <h3 className="mb-2 font-semibold text-primary">Implementation notes</h3>
                  <p className="text-sm text-secondary">{selected.implementation}</p>
                </section>
              )}
              {selected.alternatives && (
                <section className="mb-4">
                  <h3 className="mb-2 font-semibold text-primary">Alternatives considered</h3>
                  <p className="text-sm text-secondary">{selected.alternatives}</p>
                </section>
              )}
              {selected.codeRef && (
                <section>
                  <h3 className="mb-2 font-semibold text-primary">Code reference</h3>
                  <code className="font-mono text-sm text-neural">{selected.codeRef}</code>
                </section>
              )}
            </Card>
          ) : (
            <div className="grid gap-3">
              {categoryItems.length === 0 ? (
                <EmptyState
                  icon={<BookOpen size={24} />}
                  title={`No algorithms in ${selectedCategory}`}
                  description="Algorithms will appear here as they are documented."
                />
              ) : (
                categoryItems.map((algo) => (
                  <Card key={algo.id} hover className="cursor-pointer !py-4" onClick={() => setSelected(algo)}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-primary">{algo.name}</h3>
                        <p className="text-xs text-muted">{algo.complexity}</p>
                      </div>
                      <Badge variant="active">Implemented</Badge>
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
