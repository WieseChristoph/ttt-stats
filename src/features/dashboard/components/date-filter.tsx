import { CalendarDays } from 'lucide-react';
import Link from 'next/link';

type DateFilterPropsType = { from: string; to: string };

export function DateFilter({ from, to }: DateFilterPropsType) {
    return (
        <form
            action="/"
            className="flex flex-wrap items-end gap-2 rounded-2xl border border-white/10 bg-[#121824] p-3"
            key={`${from}:${to}`}
            method="get"
        >
            <CalendarDays className="mb-2.5 size-4 text-violet-400" />
            <label className="grid gap-1 font-semibold text-[0.68rem] text-slate-400 uppercase tracking-[0.14em]">
                From
                <input
                    className="rounded-lg border border-white/10 bg-[#0b1019] px-3 py-2 font-medium text-slate-100 text-sm normal-case tracking-normal outline-none transition focus:border-violet-400"
                    defaultValue={from}
                    name="from"
                    type="date"
                />
            </label>
            <label className="grid gap-1 font-semibold text-[0.68rem] text-slate-400 uppercase tracking-[0.14em]">
                To
                <input
                    className="rounded-lg border border-white/10 bg-[#0b1019] px-3 py-2 font-medium text-slate-100 text-sm normal-case tracking-normal outline-none transition focus:border-violet-400"
                    defaultValue={to}
                    name="to"
                    type="date"
                />
            </label>
            <button
                className="rounded-lg bg-violet-500 px-4 py-2 font-bold text-sm text-white transition hover:bg-violet-400"
                type="submit"
            >
                Apply
            </button>
            <Link
                className="rounded-lg px-3 py-2 font-semibold text-slate-400 text-sm transition hover:bg-white/5 hover:text-white"
                href="/"
            >
                Reset
            </Link>
        </form>
    );
}
