-- CreateEnum
CREATE TYPE "WorkloadType" AS ENUM ('REGULAR', 'OVERTIME', 'SICK', 'VACATION');

-- CreateTable
CREATE TABLE "TeacherWorkload" (
    "id" SERIAL NOT NULL,
    "teacherId" INTEGER NOT NULL,
    "academicYear" TEXT NOT NULL,
    "standardHours" INTEGER NOT NULL DEFAULT 0,
    "actualHours" INTEGER NOT NULL DEFAULT 0,
    "overtimeHours" INTEGER NOT NULL DEFAULT 0,
    "vacationDays" INTEGER NOT NULL DEFAULT 0,
    "sickLeaveDays" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "TeacherWorkload_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonthlyWorkload" (
    "id" SERIAL NOT NULL,
    "teacherWorkloadId" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "standardHours" INTEGER NOT NULL DEFAULT 0,
    "actualHours" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MonthlyWorkload_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuarterlyWorkload" (
    "id" SERIAL NOT NULL,
    "teacherWorkloadId" INTEGER NOT NULL,
    "quarter" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "standardHours" INTEGER NOT NULL DEFAULT 0,
    "actualHours" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuarterlyWorkload_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyWorkload" (
    "id" SERIAL NOT NULL,
    "teacherWorkloadId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "hours" INTEGER NOT NULL,
    "type" "WorkloadType" NOT NULL DEFAULT 'REGULAR',
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyWorkload_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubjectWorkload" (
    "id" SERIAL NOT NULL,
    "teacherWorkloadId" INTEGER NOT NULL,
    "subjectName" TEXT NOT NULL,
    "hours" INTEGER NOT NULL,
    "studyPlanId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubjectWorkload_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdditionalActivity" (
    "id" SERIAL NOT NULL,
    "teacherWorkloadId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "hours" INTEGER NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdditionalActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TeacherWorkload_teacherId_academicYear_key" ON "TeacherWorkload"("teacherId", "academicYear");

-- CreateIndex
CREATE UNIQUE INDEX "MonthlyWorkload_teacherWorkloadId_month_year_key" ON "MonthlyWorkload"("teacherWorkloadId", "month", "year");

-- CreateIndex
CREATE UNIQUE INDEX "QuarterlyWorkload_teacherWorkloadId_quarter_year_key" ON "QuarterlyWorkload"("teacherWorkloadId", "quarter", "year");

-- CreateIndex
CREATE INDEX "DailyWorkload_teacherWorkloadId_date_idx" ON "DailyWorkload"("teacherWorkloadId", "date");

-- AddForeignKey
ALTER TABLE "TeacherWorkload" ADD CONSTRAINT "TeacherWorkload_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonthlyWorkload" ADD CONSTRAINT "MonthlyWorkload_teacherWorkloadId_fkey" FOREIGN KEY ("teacherWorkloadId") REFERENCES "TeacherWorkload"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuarterlyWorkload" ADD CONSTRAINT "QuarterlyWorkload_teacherWorkloadId_fkey" FOREIGN KEY ("teacherWorkloadId") REFERENCES "TeacherWorkload"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyWorkload" ADD CONSTRAINT "DailyWorkload_teacherWorkloadId_fkey" FOREIGN KEY ("teacherWorkloadId") REFERENCES "TeacherWorkload"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectWorkload" ADD CONSTRAINT "SubjectWorkload_teacherWorkloadId_fkey" FOREIGN KEY ("teacherWorkloadId") REFERENCES "TeacherWorkload"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectWorkload" ADD CONSTRAINT "SubjectWorkload_studyPlanId_fkey" FOREIGN KEY ("studyPlanId") REFERENCES "StudyPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdditionalActivity" ADD CONSTRAINT "AdditionalActivity_teacherWorkloadId_fkey" FOREIGN KEY ("teacherWorkloadId") REFERENCES "TeacherWorkload"("id") ON DELETE CASCADE ON UPDATE CASCADE;
