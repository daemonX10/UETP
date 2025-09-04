import type { Metadata } from "next";
import './style/global.css';
import { AuthProvider } from '@/hooks/useAuth';

export const metadata: Metadata = {
  title: "UETP - Unified Equity Trading Platform",
  description: "Advanced trading platform with real-time data and analytics",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
