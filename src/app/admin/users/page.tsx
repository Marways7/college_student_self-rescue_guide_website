export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { redirect } from "next/navigation";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import UsersManager from "@/components/admin/UsersManager";

interface User {
  _id: string;
  email: string;
  name?: string;
  role: "USER" | "ADMIN";
  emailVerified?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
  isActive?: boolean;
}

async function getUsers(): Promise<User[]> {
  const client = await clientPromise;
  const db = client.db();
  
  const users = await db.collection("users").find({})
    .sort({ createdAt: -1 })
    .toArray();
    
  // Convert ObjectIds to strings for client components
  return users.map(user => ({
    _id: user._id.toString(),
    email: user.email,
    name: user.name,
    role: user.role,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt || new Date(),
    updatedAt: user.updatedAt || new Date(),
    isActive: user.isActive !== false
  })) as User[];
}

async function getUserStats() {
  const client = await clientPromise;
  const db = client.db();
  
  const [totalUsers, adminCount, userCount, activeUsers] = await Promise.all([
    db.collection("users").countDocuments({}),
    db.collection("users").countDocuments({ role: "ADMIN" }),
    db.collection("users").countDocuments({ role: "USER" }),
    db.collection("users").countDocuments({ isActive: { $ne: false } })
  ]);
  
  return { totalUsers, adminCount, userCount, activeUsers };
}

export default async function UsersPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const [users, stats] = await Promise.all([
    getUsers(),
    getUserStats()
  ]);

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">用户管理</h1>
        <p className="text-muted-foreground">管理系统用户和权限</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-card rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">总用户数</p>
              <p className="text-2xl font-bold">{stats.totalUsers}</p>
            </div>
            <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">管理员</p>
              <p className="text-2xl font-bold">{stats.adminCount}</p>
            </div>
            <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
              <svg className="h-4 w-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">普通用户</p>
              <p className="text-2xl font-bold">{stats.userCount}</p>
            </div>
            <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">活跃用户</p>
              <p className="text-2xl font-bold">{stats.activeUsers}</p>
            </div>
            <div className="h-8 w-8 bg-emerald-100 rounded-full flex items-center justify-center">
              <svg className="h-4 w-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* 用户列表 */}
      <div className="bg-card rounded-lg border">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">用户列表</h2>
          <p className="text-sm text-muted-foreground">管理用户角色和状态</p>
        </div>
        <UsersManager initialUsers={users} />
      </div>
    </div>
  );
}
