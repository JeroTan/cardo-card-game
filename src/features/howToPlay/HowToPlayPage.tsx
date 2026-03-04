import { useState, useEffect, useRef } from 'react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel';
import { Card, CardContent } from '@/components/ui/card';
import { guideContents } from './contents';
import MarkdownContent from './components/MarkdownContent';
import CarouselArrow from './components/CarouselArrow';
import PageIndicator from './components/PageIndicator';
import ScrollIndicator from './components/ScrollIndicator';

export default function HowToPlayPage() {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const [showScrollIndicator, setShowScrollIndicator] = useState<Record<number, boolean>>({});
  const scrollRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (!api) return;

    const updateScrollState = () => {
      setCurrent(api.selectedScrollSnap());
      setCanScrollPrev(api.canScrollPrev());
      setCanScrollNext(api.canScrollNext());
    };

    updateScrollState();
    api.on('select', updateScrollState);
    api.on('reInit', updateScrollState);

    return () => {
      api.off('select', updateScrollState);
      api.off('reInit', updateScrollState);
    };
  }, [api]);

  // Check scroll state for each content card
  const checkScrollState = (index: number) => {
    const element = scrollRefs.current[index];
    if (!element) return;

    const isScrollable = element.scrollHeight > element.clientHeight;
    const isAtBottom = Math.abs(element.scrollHeight - element.clientHeight - element.scrollTop) < 5;
    const shouldShow = isScrollable && !isAtBottom;

    setShowScrollIndicator((prev) => ({
      ...prev,
      [index]: shouldShow,
    }));
  };

  // Initialize scroll state for all cards
  useEffect(() => {
    guideContents.forEach((_, index) => {
      checkScrollState(index);
    });
  }, []);

  // Re-check on current page change
  useEffect(() => {
    checkScrollState(current);
  }, [current]);

  const scrollToPage = (index: number) => {
    api?.scrollTo(index);
  };

  const scrollPrev = () => {
    api?.scrollPrev();
  };

  const scrollNext = () => {
    api?.scrollNext();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 md:p-8">
      <div className="w-full max-w-5xl">
        {/* Carousel Container */}
        <div className="relative">
          <Carousel
            setApi={setApi}
            opts={{
              align: 'start',
              loop: false,
            }}
            className="w-full"
          >
            <CarouselContent>
              {guideContents.map((content, index) => (
                <CarouselItem key={content.id}>
                  <Card className="rounded-xl border shadow-lg bg-card relative">
                    <CardContent
                      ref={(el) => { scrollRefs.current[index] = el; }}
                      onScroll={() => checkScrollState(index)}
                      className="p-8 md:p-12 min-h-[600px] max-h-[75vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                    >
                      <MarkdownContent content={content.content} />
                    </CardContent>
                    <ScrollIndicator show={showScrollIndicator[index] ?? false} />
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>

            {/* Navigation Arrows */}
            <CarouselArrow
              direction="left"
              onClick={scrollPrev}
              disabled={!canScrollPrev}
            />
            <CarouselArrow
              direction="right"
              onClick={scrollNext}
              disabled={!canScrollNext}
            />
          </Carousel>

          {/* Page Indicator Dots */}
          <div className="mt-8">
            <PageIndicator
              totalPages={guideContents.length}
              currentPage={current}
              onPageClick={scrollToPage}
            />
          </div>
        </div>

        {/* Page Counter */}
        <div className="text-center mt-4 text-sm text-muted-foreground">
          Page {current + 1} of {guideContents.length}
        </div>
      </div>
    </div>
  );
}