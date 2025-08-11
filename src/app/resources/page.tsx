export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import ResourceCard from "@/components/ResourceCard";
import { Skeleton } from "@/components/Skeleton";

async function ResourceList() {
  // 获取资源数据
  const resources = await prisma.resource.findMany({
    where: { isPublic: true },
    select: {
      id: true,
      title: true,
      description: true,
      coverImageUrl: true,
      tags: true,
      isPublic: true,
      updatedAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // 获取点击统计数据
  const client = await clientPromise;
  const db = client.db();
  const resourceIds = resources.map(r => new ObjectId(r.id));
  const resourceStats = await db.collection("ResourceStat").find({
    resourceId: { $in: resourceIds }
  }).toArray();
  
  // 创建点击统计映射
  const clicksMap = new Map();
  resourceStats.forEach((stat: any) => {
    clicksMap.set(stat.resourceId.toString(), stat.clicks || 0);
  });

  if (resources.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-foreground-muted">暂无公开资料</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {resources.map((resource, index) => (
        <ResourceCard 
          key={resource.id} 
          resource={{
            ...resource,
            updatedAt: resource.updatedAt.toISOString(),
            _count: { clicks: clicksMap.get(resource.id) || 0 },
          }} 
          index={index} 
        />
      ))}
    </div>
  );
}

function ResourceListSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="h-[320px] rounded-2xl" />
      ))}
    </div>
  );
}

export default function ResourcesPage() {
  return (
    <div className="container-fluid py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-3">学习资料库</h1>
        <p className="text-foreground-muted">探索高质量的学习资源</p>
      </div>
      
      <Suspense fallback={<ResourceListSkeleton />}>
        <ResourceList />
      </Suspense>
    </div>
  );
}
