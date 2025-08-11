import HomeHeroWrapper from "@/components/HomeHeroWrapper";
import HomeHotResources from "@/components/HomeHotResources";

export default function Home() {
  return (
    <main className="min-h-screen">
      <HomeHeroWrapper />
      <section id="home-hot" className="relative">
        <div className="absolute inset-0 -z-10">
          <div className="w-full h-full" style={{
            background: "radial-gradient(1200px 600px at 20% 0%, rgba(12,16,32,0.85), rgba(12,16,32,0.6) 40%, transparent 70%)"
          }} />
        </div>
        <div className="container-fluid pb-24 pt-16">
          <h2 className="text-2xl md:text-3xl font-bold mb-2 brand-text-gradient">热门资料</h2>
          <div className="h-[2px] w-20 brand-gradient rounded-full mb-6 opacity-80" />
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 shadow-xl">
            <HomeHotResources />
          </div>
        </div>
      </section>
    </main>
  );
}
