import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ScrollIndicatorProps {
  show: boolean;
  className?: string;
}

export default function ScrollIndicator({ show, className }: ScrollIndicatorProps) {
  if (!show) return null;

  return (
    <div
      className={cn(
        "absolute bottom-4 left-1/2 -translate-x-1/2 z-10",
        "pointer-events-none",
        "animate-bounce",
        className
      )}
    >
      <div className="bg-primary/90 text-primary-foreground rounded-full p-2 shadow-lg">
        <ChevronDown className="h-5 w-5" />
      </div>
    </div>
  );
}
