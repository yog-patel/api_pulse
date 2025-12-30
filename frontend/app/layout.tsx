import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "API Schedulr - Schedule Your API Calls",
  description: "Simple web application to schedule automated HTTP requests to your API endpoints",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="antialiased">{children}</body>
    </html>
  );
}
