-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "company" JSONB,
ADD COLUMN     "invitesDraft" JSONB,
ADD COLUMN     "onboarding" JSONB;
