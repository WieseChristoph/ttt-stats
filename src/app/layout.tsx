import type { Metadata } from 'next';
import './globals.css';
import { SiteHeader } from '@/shared/components/layout/site-header';

export const metadata: Metadata = {
    title: 'TTT Stats',
    description: 'Round, map, and player statistics for the TTT server.',
    icons: { icon: '/ttt.png' },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="en">
            <body>
                <SiteHeader />
                <main>{children}</main>
            </body>
        </html>
    );
}
