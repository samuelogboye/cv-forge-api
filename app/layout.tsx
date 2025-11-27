import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'CVForge API',
  description: 'Backend API for CVForge - AI-powered resume builder',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
