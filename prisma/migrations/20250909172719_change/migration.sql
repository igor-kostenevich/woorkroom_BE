-- CreateEnum
CREATE TYPE "public"."ProjectPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "public"."ProjectRole" AS ENUM ('OWNER', 'MEMBER', 'VIEWER');

-- CreateTable
CREATE TABLE "public"."Counter" (
    "id" TEXT NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Counter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Project" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "priority" "public"."ProjectPriority" DEFAULT 'MEDIUM',
    "deadline" TIMESTAMP(3),
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProjectMember" (
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "public"."ProjectRole" NOT NULL DEFAULT 'MEMBER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectMember_pkey" PRIMARY KEY ("projectId","userId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Project_code_key" ON "public"."Project"("code");

-- CreateIndex
CREATE INDEX "ProjectMember_userId_idx" ON "public"."ProjectMember"("userId");

-- AddForeignKey
ALTER TABLE "public"."Project" ADD CONSTRAINT "Project_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProjectMember" ADD CONSTRAINT "ProjectMember_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProjectMember" ADD CONSTRAINT "ProjectMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
