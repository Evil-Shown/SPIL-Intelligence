import { Star } from 'lucide-react';
import { cn } from '../../lib/utils';

interface StarRatingProps {
  rating: number;
  onChange?: (rating: number) => void;
  size?: number;
}

export function StarRating({ rating, onChange, size = 16 }: StarRatingProps) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(star)}
          className={cn(
            'transition-colors',
            onChange && 'cursor-pointer hover:scale-110',
            !onChange && 'cursor-default'
          )}
        >
          <Star
            size={size}
            className={star <= rating ? 'fill-status-warning text-status-warning' : 'text-muted'}
          />
        </button>
      ))}
    </div>
  );
}
