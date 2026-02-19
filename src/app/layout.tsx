import type { Metadata } from "next";
import { auth } from "@/auth";
import "./globals.css";
import { CommandPalette } from "@/components/CommandPalette";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: "Task Logger",
  description: "Simple task logging system for development teams",
  icons: {
    icon: "/logo-sm.png",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <html lang="en">
      <body>
        <Providers session={session}>
          {children}
          <CommandPalette />
        </Providers>
      </body>
    </html>
  );
}
