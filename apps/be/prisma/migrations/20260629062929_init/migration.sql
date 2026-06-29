-- CreateTable
CREATE TABLE `auth` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `pswd` VARCHAR(255) NOT NULL,
    `email` VARCHAR(100) NULL,
    `phone` VARCHAR(20) NULL,
    `unionid_qq` VARCHAR(255) NULL,
    `unionid_weixin` VARCHAR(255) NULL,
    `updated_at` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `auth_email_key`(`email`),
    UNIQUE INDEX `auth_phone_key`(`phone`),
    UNIQUE INDEX `auth_unionid_qq_key`(`unionid_qq`),
    UNIQUE INDEX `auth_unionid_weixin_key`(`unionid_weixin`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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

-- AddForeignKey
ALTER TABLE `user` ADD CONSTRAINT `user_auth_id_fkey` FOREIGN KEY (`auth_id`) REFERENCES `auth`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- 为 JSON 列添加默认值（Prisma 当前不会为 dbgenerated JSON 默认值生成 SQL，手动补充）
ALTER TABLE `user`
  MODIFY COLUMN `data` JSON NOT NULL DEFAULT (JSON_OBJECT()),
  MODIFY COLUMN `settings` JSON NOT NULL DEFAULT (JSON_OBJECT());
