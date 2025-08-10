export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import ResourceCard from "@/components/ResourceCard";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string; sort?: "new" | "hot"; page?: string; categoryId?: string }> }) {
  const sp = await searchParams;
  const q = sp.q?.trim() || "";
  const sort = sp.sort || "new";
  const page = Math.max(1, Number(sp.page || 1));
  const pageSize = 24;
  const skip = (page - 1) * pageSize;
  const categoryId = sp.categoryId?.trim();

  const where = {
    isPublic: true,
    ...(categoryId ? { categoryId } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q } },
            { description: { contains: q } },
            { tags: { has: q } },
          ],
        }
      : {}),
  } as const;

  const orderBy = sort === "hot" ? { updatedAt: "desc" as const } : { createdAt: "desc" as const };

  const [resources, total] = await Promise.all([
    prisma.resource.findMany({
      where,
      orderBy,
      skip,
      take: pageSize,
      select: { id: true, title: true, coverImageUrl: true },
    }),
    prisma.resource.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="text-2xl font-semibold mb-6">搜索</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 min-h-[200px]">
        {resources.map((r: { id: string; title: string; coverImageUrl: string | null }) => (
          <ResourceCard key={r.id} id={r.id} title={r.title} coverImageUrl={r.coverImageUrl} />
        ))}
      </div>
      <div className="mt-6 flex items-center justify-center gap-3">
        <a className={`px-3 py-1 rounded border ${page <= 1 ? "pointer-events-none opacity-50" : ""}`} href={`?q=${encodeURIComponent(q)}&sort=${sort}&page=${page - 1}${categoryId ? `&categoryId=${categoryId}` : ""}`}>上一页</a>
        <span className="text-sm text-neutral-600">第 {page} / {totalPages} 页</span>
        <a className={`px-3 py-1 rounded border ${page >= totalPages ? "pointer-events-none opacity-50" : ""}`} href={`?q=${encodeURIComponent(q)}&sort=${sort}&page=${page + 1}${categoryId ? `&categoryId=${categoryId}` : ""}`}>下一页</a>
      </div>
    </div>
  );
}
