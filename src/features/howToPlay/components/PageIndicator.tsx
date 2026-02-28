import { cn } from '@/lib/utils';

interface PageIndicatorProps {
  totalPages: number;
  currentPage: number;
  onPageClick: (page: number) => void;
  className?: string;
}

export default function PageIndicator({ 
  totalPages, 
  currentPage, 
  onPageClick,
  className 
}: PageIndicatorProps) {
  return (
    <div className={cn("flex gap-2 justify-center items-center", className)}>
      {Array.from({ length: totalPages }, (_, index) => (
        <button
          key={index}
          onClick={() => onPageClick(index)}
          className={cn(
            "w-2.5 h-2.5 rounded-full transition-all duration-200",
            "hover:scale-125",
            currentPage === index 
              ? "bg-primary scale-110 w-8" 
              : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
          )}
          aria-label={`Go to page ${index + 1}`}
          aria-current={currentPage === index ? 'page' : undefined}
        />
      ))}
    </div>
  );
}
