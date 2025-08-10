import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const now = new Date();
  const samples = Array.from({ length: 8 }).map((_, i) => ({
    title: `示例资料 ${i + 1}`,
    slug: `sample-${i + 1}`,
    description: "这是一个用于演示的学习资料，包含示例描述与标签。",
    coverImageUrl: null,
    quarkLink: "https://pan.quark.cn/",
    tags: ["示例", "学习"],
    isPublic: true,
    createdAt: now,
    updatedAt: now,
  }));

  await prisma.resource.createMany({ data: samples });
  return NextResponse.json({ ok: true });
}
