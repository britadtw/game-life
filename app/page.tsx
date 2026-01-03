import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function Home() {
  // 重定向到第一個用戶的頁面，或顯示用戶選擇頁面
  const people = await prisma.person.findMany({ 
    orderBy: { createdAt: "asc" },
    take: 1,
  });

  if (people.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 cyber-grid flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-5xl font-black mb-6 neon-text bg-gradient-to-r from-cyan-400 to-purple-600 bg-clip-text text-transparent">
            GAME LIFE
          </h1>
          <p className="text-gray-400 mb-8">系統尚未初始化</p>
          <p className="text-sm text-gray-500">
            管理者請前往 <code className="px-3 py-1 bg-slate-800/50 rounded border border-cyan-500/30">/admin</code>
          </p>
        </div>
      </div>
    );
  }

  // 自動重定向到第一個用戶
  const firstPerson = people[0];
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 cyber-grid flex items-center justify-center">
      <div className="text-center">
        <div className="animate-pulse mb-4">
          <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
        <p className="text-cyan-300">正在載入 {firstPerson.name} 的目標...</p>
        <meta httpEquiv="refresh" content={`0;url=/${firstPerson.id}`} />
      </div>
    </div>
  );
}

