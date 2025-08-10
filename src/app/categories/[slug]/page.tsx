export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import ResourceCard from "@/components/ResourceCard";

export default async function CategoryDetailPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string }> }) {
  const { slug } = await params;
  const sp = await searchParams;

  const category = await prisma.category.findUnique({ where: { slug } });
  if (!category) {
    return <div className="mx-auto max-w-7xl px-4 py-10"><p className="text-neutral-600">分类不存在</p></div>;
  }

  const page = Math.max(1, Number(sp.page || 1));
  const pageSize = 24;
  const skip = (page - 1) * pageSize;

  const [resources, total] = await Promise.all([
    prisma.resource.findMany({
      where: { isPublic: true, categoryId: category.id },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      select: { id: true, title: true, coverImageUrl: true },
    }),
    prisma.resource.count({ where: { isPublic: true, categoryId: category.id } }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="text-2xl font-semibold mb-6">{category.name}</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 min-h-[200px]">
        {resources.map((r: { id: string; title: string; coverImageUrl: string | null }) => (
          <ResourceCard key={r.id} id={r.id} title={r.title} coverImageUrl={r.coverImageUrl} />
        ))}
      </div>
      <div className="mt-6 flex items-center justify-center gap-3">
        <a className={`px-3 py-1 rounded border ${page <= 1 ? "pointer-events-none opacity-50" : ""}`} href={`?page=${page - 1}`}>上一页</a>
        <span className="text-sm text-neutral-600">第 {page} / {totalPages} 页</span>
        <a className={`px-3 py-1 rounded border ${page >= totalPages ? "pointer-events-none opacity-50" : ""}`} href={`?page=${page + 1}`}>下一页</a>
      </div>
    </div>
  );
}
