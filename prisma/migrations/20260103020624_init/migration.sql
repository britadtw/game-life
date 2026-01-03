-- CreateEnum
CREATE TYPE "TaskType" AS ENUM ('DAILY', 'WEEKLY');

-- CreateEnum
CREATE TYPE "RewardType" AS ENUM ('POINT_THRESHOLD', 'GOAL_COMPLETE');

-- CreateTable
CREATE TABLE "Person" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Person_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Goal" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "assigneeId" TEXT NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "weeklyStartAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Goal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "TaskType" NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskCompletion" (
    "id" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskCompletion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reward" (
    "id" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "type" "RewardType" NOT NULL,
    "title" TEXT NOT NULL,
    "thresholdPoints" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reward_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Goal_assigneeId_idx" ON "Goal"("assigneeId");

-- CreateIndex
CREATE INDEX "Goal_startAt_idx" ON "Goal"("startAt");

-- CreateIndex
CREATE INDEX "Goal_endAt_idx" ON "Goal"("endAt");

-- CreateIndex
CREATE INDEX "Task_goalId_type_idx" ON "Task"("goalId", "type");

-- CreateIndex
CREATE INDEX "TaskCompletion_goalId_periodStart_idx" ON "TaskCompletion"("goalId", "periodStart");

-- CreateIndex
CREATE UNIQUE INDEX "TaskCompletion_taskId_periodStart_key" ON "TaskCompletion"("taskId", "periodStart");

-- CreateIndex
CREATE INDEX "Reward_goalId_type_idx" ON "Reward"("goalId", "type");

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskCompletion" ADD CONSTRAINT "TaskCompletion_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskCompletion" ADD CONSTRAINT "TaskCompletion_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reward" ADD CONSTRAINT "Reward_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
