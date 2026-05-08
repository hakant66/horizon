-- AlterEnum
ALTER TYPE "EmissionScope" ADD VALUE 'SCOPE_3';

-- AlterTable
ALTER TABLE "EmissionCalculation" ADD COLUMN     "scope3Category" TEXT;
