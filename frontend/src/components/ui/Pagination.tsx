import { ChevronLeft, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 mt-4">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className={clsx(
          'p-1.5 rounded border',
          page === 1 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-gray-50'
        )}
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <span className="text-sm text-gray-600">
        Page {page} of {totalPages}
      </span>

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className={clsx(
          'p-1.5 rounded border',
          page === totalPages ? 'opacity-40 cursor-not-allowed' : 'hover:bg-gray-50'
        )}
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
