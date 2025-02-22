-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "placeId" TEXT;

-- CreateIndex
CREATE INDEX "Post_placeId_idx" ON "Post"("placeId");
