import { prisma } from "@/lib/prisma";
import AdminLayout from "../../components/AdminLayout";
import { createPointReward, deleteReward, updateReward } from "../actions";
import RewardsPageClient from "./RewardsPageClient";

export const dynamic = "force-dynamic";

export default async function RewardsPage() {
  const goals = await prisma.goal.findMany({ 
    orderBy: { startAt: "desc" },
    include: { assignee: true }
  });
  
  const rewards = await prisma.reward.findMany({
    orderBy: { createdAt: "desc" },
    include: { goal: { include: { assignee: true } } }
  });

  return (
    <AdminLayout>
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">獎勵管理</h1>
          <p className="text-gray-600 dark:text-gray-400">建立和管理點數獎勵</p>
        </div>

        <RewardsPageClient
          goals={goals}
          rewards={rewards}
          createPointReward={createPointReward}
          updateReward={updateReward}
          deleteReward={deleteReward}
        />
      </div>
    </AdminLayout>
  );
}
