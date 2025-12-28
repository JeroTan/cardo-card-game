import { useContext, useMemo } from "react";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationPrevious } from "../ui/pagination";
import { PaginationContext } from "@/stores/components/PaginationContext";
import { Button } from "../ui/button";
import { ChevronLeft } from "lucide-react";

type Props = {
  pagesShown?: number;
	overflowThreshold?: number;
}

export default function PaginationList({
  pagesShown = 5,
  overflowThreshold = 2,
}: Props){
  const { page, totalPages, nextPage, prevPage, gotoFirst, gotoLast, changePage } = useContext(PaginationContext);
  const { leftPages, rightPages, leftSideOverflow, rightSideOverflow } = useMemo(() => {
		let left = Math.ceil((pagesShown - 1) / 2);
		let right = pagesShown - 1 - left;

		left = page - left < 1 ? page - 1 : left;
		right = page + right > totalPages ? totalPages - page : right;

		const leftPages = Array.from({ length: left }, (_, i) => page - (left - i));
		const rightPages = Array.from({ length: right }, (_, i) => page + (i + 1));

		if (leftPages.length > 0 && leftPages[0] === 2) {
			// if the first left page is 2, prepend page 1 since there is no need for ellipsis
			leftPages.unshift(1);
		}
		if (rightPages.length > 0 && rightPages[rightPages.length - 1] === totalPages - 1) {
			// if the last right page is totalPages - 1, append totalPages since there is no need for ellipsis
			rightPages.push(totalPages);
		}

		return {
			leftPages,
			rightPages,
			leftSideOverflow: left < page - overflowThreshold,
			rightSideOverflow: right <= totalPages - page - overflowThreshold,
		};
	}, [page, totalPages, pagesShown, overflowThreshold]); 


  return <>
    <Pagination>
      <PaginationContent>

        <PaginationItem>
          <Button
            onClick={() => prevPage()} 
            variant={"ghost"}
            disabled={page <= 1}
          >
            <ChevronLeft />&nbsp;Previous
          </Button>
        </PaginationItem>

        {leftSideOverflow && <>
          <PaginationItem>
            <Button 
              variant={"ghost"}
              onClick={() => gotoFirst()}
            >
              1
            </Button>
          </PaginationItem>
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
        </>}

        {leftPages.map((p, key)=>{
          return <PaginationItem key={key}>
            <Button
              variant={"ghost"}
              onClick={() => changePage(p)}
            >
              {p}
            </Button>
          </PaginationItem>
        })}

        <PaginationItem>
          <Button
            variant={"outline"}
            disabled
          >
            {page}
          </Button>
        </PaginationItem>

        {rightPages.map((p, key)=>{
          return <PaginationItem key={key}>
            <Button
              variant={"ghost"}
              onClick={() => changePage(p)}
            >
              {p}
            </Button>
          </PaginationItem>
        })}

        {rightSideOverflow && <>
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
          <PaginationItem>
            <Button 
              variant={"ghost"}
              onClick={() => gotoLast()}
            >
              {totalPages}
            </Button>
          </PaginationItem>
        </>}

        <PaginationItem>
          <Button
            onClick={() => nextPage()} 
            variant={"ghost"}
            disabled={page >= totalPages}
          >
            Next&nbsp;<ChevronLeft className="rotate-180" />
          </Button>
        </PaginationItem>

      </PaginationContent>
    </Pagination>
  </>
}