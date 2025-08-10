export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import ResourceCard from "@/components/ResourceCard";

export default async function ResourcesPage() {
  const resources = await prisma.resource.findMany({
    where: { isPublic: true },
    orderBy: { createdAt: "desc" },
    take: 24,
    select: { id: true, title: true, coverImageUrl: true },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="text-2xl font-semibold mb-6">学习资料</h1>
      {resources.length === 0 ? (
        <p className="text-neutral-600">暂无公开资料</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {resources.map((r) => (
            <ResourceCard key={r.id} id={r.id} title={r.title} coverImageUrl={r.coverImageUrl} />
          ))}
        </div>
      )}
    </div>
  );
}
