'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function SiteHeader() {
    const pathname = usePathname();
    if (pathname === '/loading') {
        return null;
    }

    return (
        <header className="sticky top-0 z-40 border-white/8 border-b bg-[#080c13]/90 backdrop-blur-xl">
            <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-6 px-5 py-3 sm:px-8">
                <Link
                    className="flex items-center gap-3 font-bold text-white"
                    href="/"
                >
                    <Image
                        src="/ttt.png"
                        alt="TTT Stats"
                        width={36}
                        height={36}
                        priority
                    />
                    <span>
                        <strong className="text-rose-400">TTT</strong> Stats
                    </span>
                </Link>
                <nav
                    className="flex items-center gap-1 rounded-xl border border-white/8 bg-white/2.5 p-1 font-semibold text-slate-400 text-sm"
                    aria-label="Primary navigation"
                >
                    <Link
                        className="rounded-lg px-3 py-2 transition hover:bg-white/5 hover:text-white"
                        href="/"
                    >
                        Overview
                    </Link>
                    <Link
                        className="rounded-lg px-3 py-2 transition hover:bg-white/5 hover:text-white"
                        href="/maps"
                    >
                        Maps
                    </Link>
                    <Link
                        className="rounded-lg px-3 py-2 transition hover:bg-white/5 hover:text-white"
                        href="/players"
                    >
                        Players
                    </Link>
                    <Link
                        className="rounded-lg px-3 py-2 transition hover:bg-white/5 hover:text-white"
                        href="/loading"
                    >
                        Loading screen
                    </Link>
                </nav>
            </div>
        </header>
    );
}
