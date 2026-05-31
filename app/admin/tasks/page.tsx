import { prisma } from "@/lib/prisma";
import AdminLayout from "../../components/AdminLayout";
import { createTask, deleteTask, updateTask } from "../actions";
import TasksPageClient from "./TasksPageClient";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const goals = await prisma.goal.findMany({ 
    orderBy: { startAt: "desc" },
    include: { assignee: true }
  });
  
  const tasks = await prisma.task.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
    include: { goal: { include: { assignee: true } } }
  });

  return (
    <AdminLayout>
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">任務管理</h1>
          <p className="text-gray-600 dark:text-gray-400">建立和管理每日與每週任務</p>
        </div>

        <TasksPageClient
          goals={goals}
          tasks={tasks}
          createTask={createTask}
          updateTask={updateTask}
          deleteTask={deleteTask}
        />
      </div>
    </AdminLayout>
  );
}
