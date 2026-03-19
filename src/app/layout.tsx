import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist, Cinzel } from "next/font/google";

import { TRPCReactProvider } from "~/trpc/react";

export const metadata: Metadata = {
  title: "Attack on Todos",
  description: "Conquer your tasks. No one is safe from the titans of procrastination.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["400", "600", "700", "900"],
  variable: "--font-cinzel",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable} ${cinzel.variable}`}>
      <body className="bg-aot-void text-aot-bone font-sans antialiased">
        <TRPCReactProvider>{children}</TRPCReactProvider>
      </body>
    </html>
  );
}
