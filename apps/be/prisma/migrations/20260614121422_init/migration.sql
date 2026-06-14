-- CreateTable
CREATE TABLE `auth` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `pswd` VARCHAR(255) NOT NULL,
    `unionid_qq` VARCHAR(191) NULL,
    `unionid_weixin` VARCHAR(191) NULL,
    `updated_at` DATETIME(3) NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `auth_unionid_qq_key`(`unionid_qq`),
    UNIQUE INDEX `auth_unionid_weixin_key`(`unionid_weixin`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
