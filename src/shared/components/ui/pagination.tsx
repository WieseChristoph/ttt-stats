import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

type PaginationPropsType = {
    basePath: string;
    page: number;
    totalPages: number;
};

type PaginationEllipsisType = { key: string };
type PaginationItemType = number | PaginationEllipsisType;

function getPageHref(basePath: string, page: number) {
    return page === 1 ? basePath : `${basePath}?page=${page}`;
}

function getPaginationItems(page: number, totalPages: number): PaginationItemType[] {
    const pageNumbers = [...new Set([1, totalPages, page - 1, page, page + 1])]
        .filter((pageNumber) => pageNumber >= 1 && pageNumber <= totalPages)
        .toSorted((left, right) => left - right);
    const items: PaginationItemType[] = [];

    for (const pageNumber of pageNumbers) {
        const previousItem = items.at(-1);
        const previousPage = typeof previousItem === 'number' ? previousItem : undefined;

        if (typeof previousPage === 'number' && pageNumber - previousPage === 2) {
            items.push(previousPage + 1);
        } else if (typeof previousPage === 'number' && pageNumber - previousPage > 2) {
            items.push({ key: `ellipsis-${previousPage}-${pageNumber}` });
        }

        items.push(pageNumber);
    }

    return items;
}

export function Pagination({ basePath, page, totalPages }: PaginationPropsType) {
    if (totalPages <= 1) {
        return null;
    }

    return (
        <nav
            aria-label="Map history pages"
            className="mt-5 flex items-center justify-center gap-1"
        >
            <PaginationDirection
                basePath={basePath}
                direction="previous"
                enabled={page > 1}
                targetPage={page - 1}
            />
            {getPaginationItems(page, totalPages).map((item) => (
                <PaginationItem
                    basePath={basePath}
                    currentPage={page}
                    item={item}
                    key={typeof item === 'number' ? item : item.key}
                />
            ))}
            <PaginationDirection
                basePath={basePath}
                direction="next"
                enabled={page < totalPages}
                targetPage={page + 1}
            />
        </nav>
    );
}

function PaginationDirection({
    basePath,
    direction,
    enabled,
    targetPage,
}: {
    basePath: string;
    direction: 'previous' | 'next';
    enabled: boolean;
    targetPage: number;
}) {
    const content =
        direction === 'previous' ? (
            <>
                <ChevronLeft /> Previous
            </>
        ) : (
            <>
                Next <ChevronRight />
            </>
        );

    return enabled ? (
        <Link
            className="inline-flex min-h-8.5 items-center justify-center gap-1.25 rounded-[9px] border border-(--line) px-2.5 font-bold text-(--muted) text-[11px] hover:border-[rgba(157,140,255,0.5)] hover:bg-[rgba(157,140,255,0.12)] hover:text-(--text) [&_svg]:w-3.25"
            href={getPageHref(basePath, targetPage)}
        >
            {content}
        </Link>
    ) : (
        <span className="inline-flex min-h-8.5 cursor-not-allowed items-center justify-center gap-1.25 rounded-[9px] border border-(--line) px-2.5 font-bold text-(--muted) text-[11px] opacity-40 [&_svg]:w-3.25">
            {content}
        </span>
    );
}

function PaginationItem({
    basePath,
    currentPage,
    item,
}: {
    basePath: string;
    currentPage: number;
    item: PaginationItemType;
}) {
    if (typeof item !== 'number') {
        return <span className="inline-flex w-6 items-center justify-center text-center text-(--muted)">…</span>;
    }

    return (
        <Link
            aria-current={item === currentPage ? 'page' : undefined}
            className="inline-flex size-8.5 items-center justify-center gap-1.25 rounded-[9px] border border-(--line) font-bold text-(--muted) text-[11px] hover:border-[rgba(157,140,255,0.5)] hover:bg-[rgba(157,140,255,0.12)] hover:text-(--text) aria-[current=page]:border-[rgba(157,140,255,0.5)] aria-[current=page]:bg-[rgba(157,140,255,0.12)] aria-[current=page]:text-(--text)"
            href={getPageHref(basePath, item)}
        >
            {item}
        </Link>
    );
}
