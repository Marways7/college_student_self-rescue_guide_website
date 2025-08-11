import clientPromise from "@/lib/mongodb";
import HomeHero from "./HomeHero";

interface SystemSettings {
  siteName: string;
  siteDescription: string;
  allowRegistration: boolean;
  maintenanceMode: boolean;
}

async function getSystemSettings(): Promise<SystemSettings> {
  try {
    const client = await clientPromise;
    const db = client.db();
    const settings = await db.collection("settings").findOne({ type: "system" });
    
    return {
      siteName: settings?.config?.siteName || "大学生自救指南",
      siteDescription: settings?.config?.siteDescription || "高质量学习资料分享与检索平台",
      allowRegistration: settings?.config?.allowRegistration ?? true,
      maintenanceMode: settings?.config?.maintenanceMode ?? false
    };
  } catch (error) {
    console.error("Failed to load settings:", error);
    return {
      siteName: "大学生自救指南",
      siteDescription: "高质量学习资料分享与检索平台",
      allowRegistration: true,
      maintenanceMode: false
    };
  }
}

export default async function HomeHeroWrapper() {
  const settings = await getSystemSettings();
  return <HomeHero siteName={settings.siteName} siteDescription={settings.siteDescription} />;
}
