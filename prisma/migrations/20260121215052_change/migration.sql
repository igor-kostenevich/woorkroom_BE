-- CreateEnum
CREATE TYPE "public"."VacationType" AS ENUM ('VACATION', 'SICK', 'REMOTE');

-- CreateEnum
CREATE TYPE "public"."VacationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "birthday" TIMESTAMP(3),
ADD COLUMN     "currentCompany" TEXT,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "position" TEXT,
ADD COLUMN     "telegram" TEXT;

-- CreateTable
CREATE TABLE "public"."VacationRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "public"."VacationType" NOT NULL,
    "status" "public"."VacationStatus" NOT NULL DEFAULT 'PENDING',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "durationDays" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VacationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VacationRequest_userId_idx" ON "public"."VacationRequest"("userId");

-- AddForeignKey
ALTER TABLE "public"."VacationRequest" ADD CONSTRAINT "VacationRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
