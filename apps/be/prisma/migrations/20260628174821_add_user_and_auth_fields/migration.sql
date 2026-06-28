/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `auth` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[phone]` on the table `auth` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `auth` ADD COLUMN `email` VARCHAR(100) NULL,
    ADD COLUMN `phone` VARCHAR(20) NULL,
    MODIFY `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- CreateTable
CREATE TABLE `user` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `auth_id` INTEGER UNSIGNED NOT NULL,
    `name` VARCHAR(50) NOT NULL,
    `avatar` VARCHAR(500) NULL,
    `data` JSON NOT NULL,
    `settings` JSON NOT NULL,
    `updated_at` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `user_name_key`(`name`),
    INDEX `user_auth_id_idx`(`auth_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `auth_email_key` ON `auth`(`email`);

-- CreateIndex
CREATE UNIQUE INDEX `auth_phone_key` ON `auth`(`phone`);

-- AddForeignKey
ALTER TABLE `user` ADD CONSTRAINT `user_auth_id_fkey` FOREIGN KEY (`auth_id`) REFERENCES `auth`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
