import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/app/providers";
import NavbarWrapper from "@/components/NavbarWrapper";
import PageTransition from "@/components/PageTransition";
import RouteProgress from "@/components/RouteProgress";
import clientPromise from "@/lib/mongodb";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

async function getSystemSettings() {
  try {
    const client = await clientPromise;
    const db = client.db();
    const settings = await db.collection("settings").findOne({ type: "system" });
    
    return {
      siteName: settings?.config?.siteName || "大学生自救指南",
      siteDescription: settings?.config?.siteDescription || "高质量学习资料分享与检索平台",
    };
  } catch (error) {
    console.error("Failed to load settings:", error);
    return {
      siteName: "大学生自救指南",
      siteDescription: "高质量学习资料分享与检索平台",
    };
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSystemSettings();
  
  return {
    title: settings.siteName,
    description: settings.siteDescription,
  };
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>
          <RouteProgress />
          <NavbarWrapper />
          <PageTransition>{children}</PageTransition>
        </Providers>
      </body>
    </html>
  );
}
