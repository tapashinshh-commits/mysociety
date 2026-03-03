import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import AuthListener from "@/components/AuthListener";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MySociety — Your Society, Your Community",
  description:
    "Connect with neighbors, track vendors, manage complaints, organize events, and build a stronger community. By TechSystem Lab.",
  keywords: [
    "society management app",
    "neighbor community app",
    "housing society app India",
    "vendor tracking",
    "society complaints",
    "local community",
  ],
  authors: [{ name: "TechSystem Lab", url: "https://www.techsystemlab.com" }],
};

export const viewport: Viewport = {
  themeColor: "#6c63ff",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} antialiased`}>
        <AuthListener />
        {children}
      </body>
    </html>
  );
}
