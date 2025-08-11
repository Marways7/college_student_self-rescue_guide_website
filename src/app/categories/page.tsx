export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import Link from "next/link";

type CategoryItem = { id: string; name: string; slug: string; description: string | null };

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: [{ order: "asc" }, { name: "asc" }],
    select: { id: true, name: true, slug: true, description: true },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 pt-24 md:pt-28 pb-12">
      <h1 className="text-2xl font-semibold mb-6">分类</h1>
      {categories.length === 0 ? (
        <p className="text-neutral-600">暂无分类</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {categories.map((c: CategoryItem) => (
            <Link key={c.id} href={`/categories/${c.slug}`} className="rounded-lg border p-4 hover:bg-neutral-50">
              <div className="font-medium">{c.name}</div>
              {c.description ? (
                <div className="mt-1 text-sm text-neutral-600 line-clamp-2">{c.description}</div>
              ) : null}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
