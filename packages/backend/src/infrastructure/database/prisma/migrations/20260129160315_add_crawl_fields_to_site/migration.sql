-- AlterTable
ALTER TABLE "sites" ADD COLUMN     "additional_urls" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "error_message" TEXT,
ADD COLUMN     "last_crawled_at" TIMESTAMP(3);
