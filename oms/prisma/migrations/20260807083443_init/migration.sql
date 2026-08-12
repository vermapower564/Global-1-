/*
  Warnings:

  - You are about to drop the column `createdAt` on the `dailyworkupdate` table. All the data in the column will be lost.
  - You are about to alter the column `status` on the `dailyworkupdate` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(2))`.
  - Added the required column `projectName` to the `DailyWorkUpdate` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `dailyworkupdate` DROP COLUMN `createdAt`,
    ADD COLUMN `clientName` VARCHAR(191) NULL,
    ADD COLUMN `driveLinks` TEXT NULL,
    ADD COLUMN `endTime` VARCHAR(191) NULL,
    ADD COLUMN `gitCommits` TEXT NULL,
    ADD COLUMN `priority` ENUM('HIGH', 'MEDIUM', 'LOW') NOT NULL DEFAULT 'MEDIUM',
    ADD COLUMN `projectName` VARCHAR(191) NOT NULL,
    ADD COLUMN `screenshots` TEXT NULL,
    ADD COLUMN `startTime` VARCHAR(191) NULL,
    ADD COLUMN `submittedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    MODIFY `status` ENUM('PENDING', 'APPROVED', 'REJECTED', 'CHANGES_REQUESTED') NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE `department` ADD COLUMN `budget` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `headName` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `user` ADD COLUMN `avatarUrl` VARCHAR(191) NULL,
    ADD COLUMN `documentsVerified` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `emergencyContact` VARCHAR(191) NULL,
    ADD COLUMN `isProfileCompleted` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `salary` DOUBLE NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE `Attendance` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `checkInTime` DATETIME(3) NOT NULL,
    `checkOutTime` DATETIME(3) NULL,
    `hoursWorked` DOUBLE NOT NULL DEFAULT 0,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PRESENT',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LeaveRequest` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `leaveType` VARCHAR(191) NOT NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,
    `totalDays` INTEGER NOT NULL,
    `reason` TEXT NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'Pending',
    `hrRemarks` TEXT NULL,
    `appliedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `InternStudent` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `university` VARCHAR(191) NOT NULL,
    `degree` VARCHAR(191) NOT NULL,
    `department` VARCHAR(191) NOT NULL,
    `mentorName` VARCHAR(191) NOT NULL,
    `stipend` DOUBLE NOT NULL DEFAULT 20000,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,
    `daysCompleted` INTEGER NOT NULL DEFAULT 0,
    `totalDays` INTEGER NOT NULL DEFAULT 90,
    `performanceScore` DOUBLE NOT NULL DEFAULT 5.0,
    `completedTasks` INTEGER NOT NULL DEFAULT 0,
    `totalTasks` INTEGER NOT NULL DEFAULT 12,
    `status` VARCHAR(191) NOT NULL DEFAULT 'Active Intern',
    `assignedProject` VARCHAR(191) NOT NULL,
    `githubRepo` VARCHAR(191) NULL,
    `offeredFullTimeSalary` DOUBLE NOT NULL DEFAULT 750000,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `InternAssignment` (
    `id` VARCHAR(191) NOT NULL,
    `internStudentId` VARCHAR(191) NOT NULL,
    `taskTitle` VARCHAR(191) NOT NULL,
    `assignedDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `dueDate` DATETIME(3) NOT NULL,
    `githubRepo` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'In Review',
    `grade` VARCHAR(191) NULL,
    `mentorFeedback` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ITAsset` (
    `id` VARCHAR(191) NOT NULL,
    `assetName` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `serialNumber` VARCHAR(191) NOT NULL,
    `allocatedToUserId` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'Assigned',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `ITAsset_serialNumber_key`(`serialNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Project` (
    `id` VARCHAR(191) NOT NULL,
    `projectTitle` VARCHAR(191) NOT NULL,
    `clientCompany` VARCHAR(191) NOT NULL,
    `clientContactPerson` VARCHAR(191) NOT NULL,
    `clientEmail` VARCHAR(191) NOT NULL,
    `clientPhone` VARCHAR(191) NOT NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,
    `contractValue` DOUBLE NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'IN_PROGRESS',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CompletedProjectHistory` (
    `id` VARCHAR(191) NOT NULL,
    `projectId` VARCHAR(191) NOT NULL,
    `completionDate` DATETIME(3) NOT NULL,
    `rating` INTEGER NOT NULL DEFAULT 5,
    `lastContactedNote` TEXT NULL,
    `codeSnippet` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `CompletedProjectHistory_projectId_key`(`projectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DevCommitTracker` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `commitHash` VARCHAR(191) NOT NULL,
    `repository` VARCHAR(191) NOT NULL,
    `branch` VARCHAR(191) NOT NULL DEFAULT 'main',
    `linesAdded` INTEGER NOT NULL,
    `linesDeleted` INTEGER NOT NULL,
    `commitMessage` TEXT NOT NULL,
    `committedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `DevCommitTracker_commitHash_key`(`commitHash`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SalesDeal` (
    `id` VARCHAR(191) NOT NULL,
    `dealTitle` VARCHAR(191) NOT NULL,
    `clientName` VARCHAR(191) NOT NULL,
    `dealValue` DOUBLE NOT NULL,
    `pipelineStage` VARCHAR(191) NOT NULL DEFAULT 'PROSPECT',
    `probability` INTEGER NOT NULL DEFAULT 50,
    `closeDate` DATETIME(3) NOT NULL,
    `assignedExec` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Client` (
    `id` VARCHAR(191) NOT NULL,
    `companyName` VARCHAR(191) NOT NULL,
    `contactPerson` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `industry` VARCHAR(191) NOT NULL,
    `totalBilled` DOUBLE NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Client_companyName_key`(`companyName`),
    UNIQUE INDEX `Client_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AdCampaign` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `platform` VARCHAR(191) NOT NULL,
    `budget` DOUBLE NOT NULL,
    `adSpend` DOUBLE NOT NULL,
    `leadsGenerated` INTEGER NOT NULL,
    `cpl` DOUBLE NOT NULL,
    `roas` DOUBLE NOT NULL,
    `ctr` VARCHAR(191) NOT NULL,
    `impressions` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'Active',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SeoKeyword` (
    `id` VARCHAR(191) NOT NULL,
    `keyword` VARCHAR(191) NOT NULL,
    `searchVolume` VARCHAR(191) NOT NULL,
    `currentRank` INTEGER NOT NULL,
    `previousRank` INTEGER NOT NULL,
    `targetUrl` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'Improving',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `SeoKeyword_keyword_key`(`keyword`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DesignAsset` (
    `id` VARCHAR(191) NOT NULL,
    `assetTitle` VARCHAR(191) NOT NULL,
    `platform` VARCHAR(191) NOT NULL,
    `format` VARCHAR(191) NOT NULL,
    `designerName` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'APPROVED',
    `assetUrl` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VideoProductionItem` (
    `id` VARCHAR(191) NOT NULL,
    `projectTitle` VARCHAR(191) NOT NULL,
    `shootLocation` VARCHAR(191) NOT NULL,
    `cameraLead` VARCHAR(191) NOT NULL,
    `editorName` VARCHAR(191) NOT NULL,
    `renderStage` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'FINAL_APPROVED',
    `versionUrl` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FinanceTransaction` (
    `id` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `amount` DOUBLE NOT NULL,
    `description` TEXT NOT NULL,
    `referenceNo` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `FinanceTransaction_referenceNo_key`(`referenceNo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PayrollApproval` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `employeeName` VARCHAR(191) NOT NULL,
    `monthYear` VARCHAR(191) NOT NULL,
    `baseSalary` DOUBLE NOT NULL,
    `bonus` DOUBLE NOT NULL DEFAULT 0,
    `deductions` DOUBLE NOT NULL DEFAULT 0,
    `netPayable` DOUBLE NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'APPROVED',
    `bankRefNo` VARCHAR(191) NULL,
    `approvedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AuditLog` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `action` VARCHAR(191) NOT NULL,
    `details` TEXT NOT NULL,
    `ipAddress` VARCHAR(191) NULL,
    `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_AssignedStaffProjects` (
    `A` VARCHAR(191) NOT NULL,
    `B` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `_AssignedStaffProjects_AB_unique`(`A`, `B`),
    INDEX `_AssignedStaffProjects_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Attendance` ADD CONSTRAINT `Attendance_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LeaveRequest` ADD CONSTRAINT `LeaveRequest_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InternAssignment` ADD CONSTRAINT `InternAssignment_internStudentId_fkey` FOREIGN KEY (`internStudentId`) REFERENCES `InternStudent`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ITAsset` ADD CONSTRAINT `ITAsset_allocatedToUserId_fkey` FOREIGN KEY (`allocatedToUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CompletedProjectHistory` ADD CONSTRAINT `CompletedProjectHistory_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DevCommitTracker` ADD CONSTRAINT `DevCommitTracker_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PayrollApproval` ADD CONSTRAINT `PayrollApproval_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AuditLog` ADD CONSTRAINT `AuditLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_AssignedStaffProjects` ADD CONSTRAINT `_AssignedStaffProjects_A_fkey` FOREIGN KEY (`A`) REFERENCES `Project`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_AssignedStaffProjects` ADD CONSTRAINT `_AssignedStaffProjects_B_fkey` FOREIGN KEY (`B`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
