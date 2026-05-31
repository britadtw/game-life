"use client";

import { FormEvent, useState } from "react";
import { TaskType } from "@prisma/client";

type Goal = {
  id: string;
  title: string;
  startAt: Date;
  endAt: Date;
  assignee: { name: string };
};

type Task = {
  id: string;
  title: string;
  type: TaskType;
  points: number;
  goal: {
    id: string;
    title: string;
    assignee: { name: string };
  };
};

type Props = {
  goals: Goal[];
  tasks: Task[];
  createTask: (formData: FormData) => Promise<void>;
  updateTask: (formData: FormData) => Promise<void>;
  deleteTask: (formData: FormData) => Promise<void>;
};

type TaskDraft = {
  goalId: string;
  title: string;
  type: TaskType;
  points: number;
};

type SectionConfig = {
  type: TaskType;
  title: string;
  subtitle: string;
  emptyText: string;
  cardClassName: string;
  badgeClassName: string;
  iconClassName: string;
  iconPath: string;
};

const sectionConfigs: SectionConfig[] = [
  {
    type: TaskType.DAILY,
    title: "每日任務",
    subtitle: "每天重置",
    emptyText: "此目標尚無每日任務",
    cardClassName:
      "p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 border border-blue-200 dark:border-blue-800",
    badgeClassName:
      "px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-semibold rounded-full",
    iconClassName: "w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center",
    iconPath:
      "M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z",
  },
  {
    type: TaskType.WEEKLY,
    title: "每週任務",
    subtitle: "每 7 天重置",
    emptyText: "此目標尚無每週任務",
    cardClassName:
      "p-4 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10 border border-purple-200 dark:border-purple-800",
    badgeClassName:
      "px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-semibold rounded-full",
    iconClassName: "w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center",
    iconPath: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
  },
  {
    type: TaskType.ONE_TIME,
    title: "單次任務",
    subtitle: "目標期間只能完成一次",
    emptyText: "此目標尚無單次任務",
    cardClassName:
      "p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 border border-amber-200 dark:border-amber-800",
    badgeClassName:
      "px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs font-semibold rounded-full",
    iconClassName: "w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center",
    iconPath: "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z",
  },
];

function getTypeLabel(type: TaskType): string {
  if (type === TaskType.DAILY) return "每日";
  if (type === TaskType.WEEKLY) return "每週";
  return "單次";
}

export default function TasksPageClient({ goals, tasks, createTask, updateTask, deleteTask }: Props) {
  const now = new Date();

  // Filter out expired goals for the dropdown
  const activeGoals = goals
    .filter((g) => new Date(g.endAt) >= now)
    .sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime());

  // Use a function to get initial value to ensure it's valid
  const getInitialGoalId = () => {
    return activeGoals[0]?.id ?? "";
  };

  const [selectedGoalId, setSelectedGoalId] = useState<string>(getInitialGoalId);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState<TaskDraft>({
    goalId: "",
    title: "",
    type: TaskType.DAILY,
    points: 0,
  });

  // Check if selected goal is still valid, if not reset to first active goal
  const effectiveSelectedGoalId = activeGoals.some((g) => g.id === selectedGoalId)
    ? selectedGoalId
    : (activeGoals[0]?.id ?? "");

  // Get tasks for the selected goal only
  const filteredTasks = tasks.filter((t) => t.goal.id === effectiveSelectedGoalId);

  const handleSubmit = async (formData: FormData) => {
    await createTask(formData);
  };

  const handleGoalChange = (newGoalId: string) => {
    setSelectedGoalId(newGoalId);
  };

  const handleDeleteConfirm = (event: FormEvent<HTMLFormElement>) => {
    const ok = window.confirm("確定要刪除此任務嗎？刪除後將不會出現在任務清單中。");
    if (!ok) {
      event.preventDefault();
    }
  };

  const startEditing = (task: Task) => {
    setEditingTaskId(task.id);
    setEditingDraft({
      goalId: task.goal.id,
      title: task.title,
      type: task.type,
      points: task.points,
    });
  };

  const cancelEditing = () => {
    setEditingTaskId(null);
  };

  const handleUpdateSubmit = async (formData: FormData) => {
    await updateTask(formData);
    setEditingTaskId(null);
  };

  const renderTaskCard = (task: Task, config: SectionConfig) => {
    const isEditing = editingTaskId === task.id;

    if (isEditing) {
      return (
        <form
          key={task.id}
          action={handleUpdateSubmit}
          className={`${config.cardClassName} space-y-3`}
        >
          <input type="hidden" name="taskId" value={task.id} />
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">任務名稱</label>
            <input
              name="title"
              value={editingDraft.title}
              onChange={(e) => setEditingDraft((prev) => ({ ...prev, title: e.target.value }))}
              required
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">目標</label>
              <select
                name="goalId"
                value={editingDraft.goalId}
                onChange={(e) => setEditingDraft((prev) => ({ ...prev, goalId: e.target.value }))}
                required
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {activeGoals.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.title} ({g.assignee.name})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">類型</label>
              <select
                name="type"
                value={editingDraft.type}
                onChange={(e) => setEditingDraft((prev) => ({ ...prev, type: e.target.value as TaskType }))}
                required
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value={TaskType.DAILY}>每日</option>
                <option value={TaskType.WEEKLY}>每週</option>
                <option value={TaskType.ONE_TIME}>單次</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">點數</label>
              <input
                name="points"
                type="number"
                min={0}
                value={editingDraft.points}
                onChange={(e) =>
                  setEditingDraft((prev) => ({
                    ...prev,
                    points: Number.parseInt(e.target.value || "0", 10),
                  }))
                }
                required
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={cancelEditing}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
            >
              儲存
            </button>
          </div>
        </form>
      );
    }

    return (
      <div key={task.id} className={config.cardClassName}>
        <div className="flex items-start justify-between mb-2 gap-3">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">{task.title}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{getTypeLabel(task.type)}任務</p>
          </div>
          <span className={config.badgeClassName}>{task.points} pts</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-3">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
            />
          </svg>
          {task.goal.title}
          <span className="text-gray-400">·</span>
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
              clipRule="evenodd"
            />
          </svg>
          {task.goal.assignee.name}
        </div>

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => startEditing(task)}
            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 text-sm"
          >
            編輯
          </button>
          <form action={deleteTask} onSubmit={handleDeleteConfirm}>
            <input type="hidden" name="taskId" value={task.id} />
            <button
              type="submit"
              className="px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm"
            >
              刪除
            </button>
          </form>
        </div>
      </div>
    );
  };

  const renderTaskSection = (config: SectionConfig) => {
    const sectionTasks = filteredTasks.filter((t) => t.type === config.type);

    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6" key={config.type}>
        <div className="flex items-center gap-3 mb-6">
          <div className={config.iconClassName}>
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={config.iconPath} />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{config.title}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{config.subtitle}</p>
          </div>
        </div>

        {sectionTasks.length === 0 ? (
          <div className="text-center py-8 text-gray-400 dark:text-gray-500">
            <p>{effectiveSelectedGoalId ? config.emptyText : "請先選擇一個目標"}</p>
          </div>
        ) : (
          <div className="space-y-3">{sectionTasks.map((task) => renderTaskCard(task, config))}</div>
        )}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
      {/* Tasks List */}
      <div className="space-y-6">
        {/* Goal Filter */}
        {activeGoals.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              選擇目標以查看任務
            </label>
            <select
              value={effectiveSelectedGoalId}
              onChange={(e) => handleGoalChange(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            >
              {activeGoals.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.title} ({g.assignee.name})
                </option>
              ))}
            </select>
          </div>
        )}

        {sectionConfigs.map((config) => renderTaskSection(config))}
      </div>

      {/* Create Form */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 h-fit">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">建立新任務</h2>
        
        <form action={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="goalId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              選擇目標 <span className="text-red-500">*</span>
            </label>
            <select
              id="goalId"
              name="goalId"
              value={effectiveSelectedGoalId}
              onChange={(e) => handleGoalChange(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            >
              {activeGoals.length === 0 ? <option value="">(沒有可用的目標)</option> : null}
              {activeGoals.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.title} ({g.assignee.name})
                </option>
              ))}
            </select>
            {goals.length > 0 && activeGoals.length === 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">所有目標都已過期，請先建立新目標</p>
            )}
          </div>

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              任務名稱 <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              name="title"
              placeholder="例如：閱讀 30 分鐘"
              required
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            />
          </div>

          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              任務類型 <span className="text-red-500">*</span>
            </label>
            <select
              id="type"
              name="type"
              defaultValue="DAILY"
              required
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            >
              <option value="DAILY">每日任務 (每天重置)</option>
              <option value="WEEKLY">每週任務 (7 天重置)</option>
              <option value="ONE_TIME">單次任務 (只能完成一次)</option>
            </select>
          </div>

          <div>
            <label htmlFor="points" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              獎勵點數 <span className="text-red-500">*</span>
            </label>
            <input
              id="points"
              name="points"
              type="number"
              min={0}
              defaultValue={1}
              required
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">完成任務可獲得的點數</p>
          </div>
          
          <button
            type="submit"
            disabled={activeGoals.length === 0}
            className="w-full px-4 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            建立任務
          </button>
        </form>

        <div className="mt-6 p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl">
          <div className="flex gap-2">
            <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className="text-sm text-indigo-900 dark:text-indigo-200">
              <p className="font-medium mb-1">任務類型說明</p>
              <ul className="space-y-1 text-xs">
                <li><strong>每日：</strong>每天午夜重置</li>
                <li><strong>每週：</strong>根據目標的每週起始日重置</li>
                <li><strong>單次：</strong>整個目標期間僅能完成一次</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
