import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen">
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 py-16 md:py-24">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight">大学生自救指南</h1>
          <p className="mt-4 text-neutral-600 max-w-2xl">
            高质量学习资料分享与检索平台：更快找到、更可信、更便捷。
          </p>
          <div className="mt-8 flex gap-3">
            <Link href="/search" className="px-4 py-2 rounded-md border bg-black text-white hover:bg-neutral-800">立即搜索</Link>
            <Link href="/categories" className="px-4 py-2 rounded-md border hover:bg-neutral-100">浏览分类</Link>
            <Link href="/resources" className="px-4 py-2 rounded-md border hover:bg-neutral-100">所有资料</Link>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 pb-24">
        <h2 className="text-xl font-semibold mb-4">热门资料</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-[4/3] rounded-lg border bg-neutral-50" />
          ))}
        </div>
      </section>
    </main>
  );
}
