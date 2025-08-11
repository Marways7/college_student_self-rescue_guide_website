export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { redirect } from "next/navigation";
import clientPromise from "@/lib/mongodb";
import { prisma } from "@/lib/prisma";
import { Db } from "mongodb";

interface AnalyticsData {
  resourceStats: {
    total: number;
    public: number;
    private: number;
    totalClicks: number;
    weeklyGrowth: number;
  };
  userStats: {
    total: number;
    admins: number;
    users: number;
    newThisMonth: number;
    monthlyGrowth: number;
  };
  categoryStats: {
    total: number;
    active: number;
  };
  topResources: Array<{
    id: string;
    title: string;
    clicks: number;
  }>;
  recentActivity: Array<{
    type: string;
    description: string;
    timestamp: Date;
  }>;
  trends: {
    dailyClicks: Array<{ date: string; clicks: number }>;
    weeklyUsers: Array<{ week: string; users: number }>;
    categoryGrowth: Array<{ name: string; resourceCount: number; growthRate: number }>;
  };
}

async function getAnalyticsData(): Promise<AnalyticsData> {
  const client = await clientPromise;
  const db = client.db();
  
  // 资源统计
  const resourceStats = {
    total: await prisma.resource.count(),
    publicCount: await prisma.resource.count({ where: { isPublic: true } }),
    weeklyGrowth: 0 // 需要历史数据计算增长率
  };

  // 获取总点击次数
  const clickStatsResult = await db.collection("ResourceStat").aggregate([
    {
      $group: {
        _id: null,
        totalClicks: { $sum: "$clicks" }
      }
    }
  ]).toArray();

  const clickStats = {
    total: clickStatsResult[0]?.totalClicks || 0,
    publicResourceCount: resourceStats.publicCount
  };

  // 一周前的资源数量（模拟计算增长率）
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const resourcesLastWeek = await prisma.resource.count({
    where: { createdAt: { lt: oneWeekAgo } }
  });
  const weeklyGrowth = resourcesLastWeek > 0 ? 
    Math.round(((resourceStats.total - resourcesLastWeek) / resourcesLastWeek) * 100) : 0;

  // 用户统计
  const [userTotal, adminCount, userCount] = await Promise.all([
    db.collection("users").countDocuments({}),
    db.collection("users").countDocuments({ role: "ADMIN" }),
    db.collection("users").countDocuments({ role: "USER" })
  ]);

  // 本月新用户
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const newThisMonth = await db.collection("users").countDocuments({
    createdAt: { $gte: startOfMonth }
  });

  // 上月用户数量（模拟计算增长率）
  const startOfLastMonth = new Date();
  startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1);
  startOfLastMonth.setDate(1);
  startOfLastMonth.setHours(0, 0, 0, 0);
  const usersLastMonth = await db.collection("users").countDocuments({
    createdAt: { $lt: startOfMonth }
  });
  const monthlyGrowth = usersLastMonth > 0 ? 
    Math.round(((newThisMonth) / usersLastMonth) * 100) : 0;

  // 分类统计
  const [categoryTotal, activeCategories] = await Promise.all([
    prisma.category.count(),
    prisma.category.count()
  ]);

  // 热门资源（与仪表盘逻辑一致）
  const topResources = await db.collection("ResourceStat").aggregate([
    { $sort: { clicks: -1 } },
    { $limit: 5 },
    { $lookup: { from: "Resource", localField: "resourceId", foreignField: "_id", as: "res" } },
    { $unwind: "$res" },
    { $project: { _id: 0, title: "$res.title", clicks: 1 } },
  ]).toArray() as Array<{ title: string; clicks: number; }>;

  // 最近活动
  const recentResources = await prisma.resource.findMany({
    take: 3,
    orderBy: { createdAt: "desc" },
    select: { title: true, createdAt: true }
  });

  const recentUsers = await db.collection("users").find({})
    .sort({ createdAt: -1 })
    .limit(2)
    .toArray();

  const recentActivity = [
    ...recentResources.map(r => ({
      type: "resource",
      description: `新增资源：${r.title}`,
      timestamp: r.createdAt
    })),
    ...recentUsers.map(u => ({
      type: "user",
      description: `新用户注册：${u.name || u.email}`,
      timestamp: u.createdAt || new Date()
    }))
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5);

  // 分类增长率  
  const categories = await prisma.category.findMany({
    select: { id: true, name: true }
  });
  
  const categoryGrowth = await Promise.all(
    categories.map(async (cat) => {
      const resourceCount = await prisma.resource.count({
        where: { categoryId: cat.id }
      });
      return {
        name: cat.name,
        resourceCount,
        growthRate: 0 // 实际增长率需要历史数据计算，这里暂时设为0
      };
    })
  );

  // 趋势数据
  const trends = {
    // 真实每日点击趋势（最近7天）
    dailyClicks: await getDailyClicksTrend(db),
    
    // 真实每周用户增长（最近4周）
    weeklyUsers: await getWeeklyUserGrowth(db),
    
    categoryGrowth
  };

  return {
    resourceStats: {
      total: resourceStats.total,
      public: resourceStats.publicCount,
      private: resourceStats.total - resourceStats.publicCount,
      totalClicks: clickStats.total,
      weeklyGrowth
    },
    userStats: {
      total: userTotal,
      admins: adminCount,
      users: userCount,
      newThisMonth,
      monthlyGrowth
    },
    categoryStats: {
      total: categoryTotal,
      active: activeCategories
    },
    topResources: topResources as Array<{
      id: string;
      title: string;
      clicks: number;
    }>,
    recentActivity,
    trends
  };
}

// 获取每日点击趋势
async function getDailyClicksTrend(db: Db) {
  const dailyClicks = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);
    
    // 查询当天的点击统计
    const result = await db.collection("ResourceStat").aggregate([
      {
        $match: {
          updatedAt: {
            $gte: date,
            $lt: nextDate
          }
        }
      },
      {
        $group: {
          _id: null,
          totalClicks: { $sum: "$clicks" }
        }
      }
    ]).toArray();
    
    dailyClicks.push({
      date: date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }),
      clicks: result[0]?.totalClicks || 0
    });
  }
  return dailyClicks;
}

// 获取每周用户增长
async function getWeeklyUserGrowth(db: Db) {
  const weeklyUsers = [];
  for (let i = 3; i >= 0; i--) {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() - (i * 7));
    endDate.setHours(23, 59, 59, 999);
    
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 6);
    startDate.setHours(0, 0, 0, 0);
    
    // 查询当周新注册用户数
    const userCount = await db.collection("users").countDocuments({
      createdAt: {
        $gte: startDate,
        $lte: endDate
      }
    });
    
    weeklyUsers.push({
      week: `第${4-i}周`,
      users: userCount
    });
  }
  return weeklyUsers;
}

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const analytics = await getAnalyticsData();

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">数据分析</h1>
        <p className="text-muted-foreground">系统使用情况和数据统计</p>
      </div>

      {/* 核心指标 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-card rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">总资源数</p>
              <p className="text-2xl font-bold">{analytics.resourceStats.total}</p>
              <p className="text-xs text-green-600">
                周增长: +{analytics.resourceStats.weeklyGrowth}%
              </p>
            </div>
            <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">总下载次数</p>
              <p className="text-2xl font-bold">{analytics.resourceStats.totalClicks}</p>
              <p className="text-xs text-blue-600">
                公开资源: {analytics.resourceStats.public}
              </p>
            </div>
            <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">注册用户</p>
              <p className="text-2xl font-bold">{analytics.userStats.total}</p>
              <p className="text-xs text-green-600">
                月增长: +{analytics.userStats.monthlyGrowth}%
              </p>
            </div>
            <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
              <svg className="h-4 w-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">本月新用户</p>
              <p className="text-2xl font-bold">{analytics.userStats.newThisMonth}</p>
              <p className="text-xs text-orange-600">
                管理员: {analytics.userStats.admins}
              </p>
            </div>
            <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
              <svg className="h-4 w-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* 数据趋势 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* 每日点击趋势 */}
        <div className="bg-card rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-4">每日点击趋势</h2>
          <div className="space-y-3">
            {analytics.trends.dailyClicks.map((day, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{day.date}</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${(day.clicks / 70) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium w-8">{day.clicks}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 每周用户增长 */}
        <div className="bg-card rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-4">每周用户增长</h2>
          <div className="space-y-3">
            {analytics.trends.weeklyUsers.map((week, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{week.week}</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${(week.users / 20) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium w-8">{week.users}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 分类增长统计 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-card rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-4">分类资源分布</h2>
          <div className="space-y-3">
            {analytics.trends.categoryGrowth.map((category, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{category.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-green-600">+{category.growthRate}%</span>
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min((category.resourceCount / 10) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium w-6">{category.resourceCount}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 热门资源排行 */}
        <div className="bg-card rounded-lg border">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold">热门资源排行</h2>
            <p className="text-sm text-muted-foreground">按下载次数排序</p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {analytics.topResources.slice(0, 8).map((resource, index) => (
                <div key={resource.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                      index < 3 ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {index + 1}
                    </div>
                    <span className="font-medium truncate">{resource.title}</span>
                  </div>
                  <span className="text-sm text-muted-foreground font-medium">
                    {resource.clicks} 次
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 最近活动 */}
        <div className="bg-card rounded-lg border">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold">最近活动</h2>
            <p className="text-sm text-muted-foreground">系统最新动态</p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {analytics.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{activity.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(activity.timestamp).toLocaleString('zh-CN')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
