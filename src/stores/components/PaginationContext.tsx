"use client";
import { createContext, useContext, useState, useCallback, type PropsWithChildren, useRef } from "react";

export type PaginationContextType = {
	page: number;
	totalPages: number;
	changeTotalPages: (total: number) => void;
	changePage: (page: number, fullReload?: boolean) => void;
	nextPage: (fullReload?: boolean) => void;
	prevPage: (fullReload?: boolean) => void;
	gotoFirst: (fullReload?: boolean) => void;
	gotoLast: (fullReload?: boolean) => void;
};

export const PaginationContext = createContext<PaginationContextType>(null!);

export function PaginationProvider({
  initialPage = 1,
  totalPages: totalPagesParent = 1,
	children,
}: PropsWithChildren<{ totalPages?: number; initialPage?: number }>) {

	const [page, pageSet] = useState(initialPage);
	const [totalPages, totalPagesSet] = useState(totalPagesParent);

	//---> Functionalities
	const updateUrlPageParam = useCallback(
		(newPage: number) => {
      const url = new URL(window.location.href);
      url.searchParams.set("page", String(newPage));
      window.history.pushState(document.title, document.title, url);
		},
		[],
	);

	const changePage = useCallback(
		(newPage: number, fullReload?: boolean) => {
			if (newPage < 1 || newPage > totalPages) return;
			pageSet(newPage);
			updateUrlPageParam(newPage);
			if (fullReload) {
				window.location.reload();
			}
		},
		[totalPages, pageSet],
	);

	const changeTotalPages = useCallback(
		(total: number) => {
			totalPagesSet(total);
		},
		[totalPagesSet],
	);

	const nextPage = useCallback((fullReload = false) => changePage(page + 1, fullReload), [page, changePage]);
	const prevPage = useCallback((fullReload = false) => changePage(page - 1, fullReload), [page, changePage]);
	const gotoFirst = useCallback((fullReload = false) => changePage(1, fullReload), [changePage]);
	const gotoLast = useCallback((fullReload = false) => changePage(totalPages, fullReload), [changePage, totalPages]);

	return (
		<PaginationContext.Provider
			value={{ page, totalPages, changePage, changeTotalPages, nextPage, prevPage, gotoFirst, gotoLast }}
		>
			{children}
		</PaginationContext.Provider>
	);
}

export const usePagination = () => useContext(PaginationContext);
