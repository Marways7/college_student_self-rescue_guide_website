import { prisma } from "@/lib/prisma";
import clientPromise from "@/lib/mongodb";
import ResourceCard from "@/components/ResourceCard";

type HotResource = { id: string; title: string; coverImageUrl: string | null };

export default async function HomeHotResources() {
  const client = await clientPromise;
  const db = client.db();
  const topAgg = await db
    .collection("ResourceStat")
    .aggregate<HotResource>([
      { $sort: { clicks: -1 } },
      { $limit: 8 },
      { $lookup: { from: "Resource", localField: "resourceId", foreignField: "_id", as: "res" } },
      { $unwind: "$res" },
      { $match: { "res.isPublic": true } },
      { $project: { _id: 0, id: "$res._id", title: "$res.title", coverImageUrl: "$res.coverImageUrl" } },
    ])
    .toArray();

  let items: HotResource[];
  if (topAgg.length > 0) {
    items = topAgg.map((t) => ({ id: String((t as unknown as { id: unknown }).id), title: t.title, coverImageUrl: t.coverImageUrl ?? null }));
  } else {
    items = await prisma.resource.findMany({ where: { isPublic: true }, orderBy: { createdAt: "desc" }, take: 8, select: { id: true, title: true, coverImageUrl: true } });
  }

  if (items.length === 0) {
    return <p className="text-neutral-600">暂无公开资料</p>;
  }
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {items.map((r) => (
        <ResourceCard key={r.id} id={r.id} title={r.title} coverImageUrl={r.coverImageUrl} />
      ))}
    </div>
  );
}
