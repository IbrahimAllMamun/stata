-- CreateTable
CREATE TABLE "gallery_photos" (
    "id" TEXT NOT NULL,
    "image_url" TEXT NOT NULL,
    "caption" TEXT,
    "moment_date" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gallery_photos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "gallery_photos_moment_date_idx" ON "gallery_photos"("moment_date");

-- CreateIndex
CREATE INDEX "gallery_photos_created_at_idx" ON "gallery_photos"("created_at");

-- AddForeignKey
ALTER TABLE "gallery_photos" ADD CONSTRAINT "gallery_photos_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "admins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
