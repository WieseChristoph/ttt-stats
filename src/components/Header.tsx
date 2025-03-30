"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Header() {
	const pathname = usePathname();

	const navItems = [
		{
			name: "Home",
			url: "/",
		},
		{
			name: "Maps",
			url: "/maps",
		},
		{
			name: "Players",
			url: "/players",
		},
	];

	return (
		<header className="py-2 px-5 border-b border-zinc-800">
			<div className="container flex items-center justify-between mx-auto">
				<div className="flex items-center gap-3">
					<div className="p-2">
						<Image
							src="/ttt.png"
							className="h-8 w-8"
							alt="TTT Logo"
							width={24}
							height={24}
						/>
					</div>
					<div>
						<h1 className="text-2xl font-bold bg-gradient-to-r from-red-400 to-amber-400 bg-clip-text text-transparent">
							TTT Stats
						</h1>
						<p className="text-xs text-zinc-400">
							Trouble in Terrorist Town Statistics
						</p>
					</div>
				</div>
				<nav className="hidden space-x-6 md:flex">
					{navItems.map((navItem) => (
						<Link
							key={navItem.url}
							href={navItem.url}
							className={`text-zinc-100 font-medium pb-1 ${pathname === navItem.url && "border-b-2 border-red-500"}`}
						>
							{navItem.name}
						</Link>
					))}
				</nav>
			</div>
		</header>
	);
}
