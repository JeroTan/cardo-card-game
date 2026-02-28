import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CarouselArrowProps {
  direction: 'left' | 'right';
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}

export default function CarouselArrow({ 
  direction, 
  onClick, 
  disabled = false,
  className 
}: CarouselArrowProps) {
  const Icon = direction === 'left' ? ChevronLeft : ChevronRight;
  
  if (disabled) {
    return null;
  }
  
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      className={cn(
        "absolute top-1/2 -translate-y-1/2 z-10",
        "h-12 w-12 rounded-full",
        "bg-background/80 hover:bg-background",
        "border border-border shadow-lg",
        "transition-all duration-200",
        "hover:scale-110",
        direction === 'left' ? 'left-4' : 'right-4',
        className
      )}
    >
      <Icon className="h-6 w-6" />
    </Button>
  );
}
