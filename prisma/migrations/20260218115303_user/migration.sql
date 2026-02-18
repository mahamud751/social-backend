-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('online', 'away', 'offline');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('text', 'image', 'file', 'audio');

-- CreateEnum
CREATE TYPE "CallType" AS ENUM ('audio', 'video');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'online',
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" "MessageType" NOT NULL DEFAULT 'text',
    "attachments" JSONB[] DEFAULT ARRAY[]::JSONB[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "avatarUrl" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupMember" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupMessage" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" "MessageType" NOT NULL DEFAULT 'text',
    "attachments" JSONB[] DEFAULT ARRAY[]::JSONB[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Meeting" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "isInstant" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Meeting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeetingMember" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'participant',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MeetingMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CallLog" (
    "id" TEXT NOT NULL,
    "callerId" TEXT NOT NULL,
    "calleeId" TEXT NOT NULL,
    "type" "CallType" NOT NULL DEFAULT 'audio',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "durationSec" INTEGER,

    CONSTRAINT "CallLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "Message_senderId_idx" ON "Message"("senderId");

-- CreateIndex
CREATE INDEX "Message_receiverId_idx" ON "Message"("receiverId");

-- CreateIndex
CREATE INDEX "Message_createdAt_idx" ON "Message"("createdAt");

-- CreateIndex
CREATE INDEX "ChatGroup_createdBy_idx" ON "ChatGroup"("createdBy");

-- CreateIndex
CREATE INDEX "GroupMember_userId_idx" ON "GroupMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "GroupMember_groupId_userId_key" ON "GroupMember"("groupId", "userId");

-- CreateIndex
CREATE INDEX "GroupMessage_groupId_idx" ON "GroupMessage"("groupId");

-- CreateIndex
CREATE INDEX "GroupMessage_senderId_idx" ON "GroupMessage"("senderId");

-- CreateIndex
CREATE INDEX "GroupMessage_createdAt_idx" ON "GroupMessage"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Meeting_code_key" ON "Meeting"("code");

-- CreateIndex
CREATE INDEX "Meeting_code_idx" ON "Meeting"("code");

-- CreateIndex
CREATE INDEX "MeetingMember_userId_idx" ON "MeetingMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MeetingMember_meetingId_userId_key" ON "MeetingMember"("meetingId", "userId");

-- CreateIndex
CREATE INDEX "CallLog_callerId_idx" ON "CallLog"("callerId");

-- CreateIndex
CREATE INDEX "CallLog_calleeId_idx" ON "CallLog"("calleeId");

-- CreateIndex
CREATE INDEX "CallLog_startedAt_idx" ON "CallLog"("startedAt");

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatGroup" ADD CONSTRAINT "ChatGroup_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupMember" ADD CONSTRAINT "GroupMember_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "ChatGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupMember" ADD CONSTRAINT "GroupMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupMessage" ADD CONSTRAINT "GroupMessage_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "ChatGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupMessage" ADD CONSTRAINT "GroupMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingMember" ADD CONSTRAINT "MeetingMember_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingMember" ADD CONSTRAINT "MeetingMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallLog" ADD CONSTRAINT "CallLog_callerId_fkey" FOREIGN KEY ("callerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallLog" ADD CONSTRAINT "CallLog_calleeId_fkey" FOREIGN KEY ("calleeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
