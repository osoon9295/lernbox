-- AlterTable
ALTER TABLE "Word" ADD COLUMN     "aiAnalysis" JSONB,
ADD COLUMN     "analyzedAt" TIMESTAMP(3);
