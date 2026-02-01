-- CreateEnum
CREATE TYPE "UnansweredQuestionStatus" AS ENUM ('new', 'contacted', 'resolved');

-- CreateEnum
CREATE TYPE "RatingType" AS ENUM ('positive', 'negative');

-- AlterTable
ALTER TABLE "sites" ADD COLUMN     "allow_general_knowledge" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "max_messages_per_session" INTEGER NOT NULL DEFAULT 15,
ADD COLUMN     "similarity_threshold" DECIMAL(3,2) NOT NULL DEFAULT 0.70;

-- CreateTable
CREATE TABLE "chat_ratings" (
    "id" TEXT NOT NULL,
    "chat_message_id" TEXT NOT NULL,
    "site_id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "rating" "RatingType" NOT NULL,
    "feedback" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_ratings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "unanswered_questions" (
    "id" TEXT NOT NULL,
    "site_id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "user_email" TEXT,
    "question" TEXT NOT NULL,
    "best_match_score" DECIMAL(4,3) NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "status" "UnansweredQuestionStatus" NOT NULL DEFAULT 'new',
    "contacted_at" TIMESTAMP(3),
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "unanswered_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "widget_sessions" (
    "id" TEXT NOT NULL,
    "site_id" TEXT NOT NULL,
    "ip_address_hash" TEXT NOT NULL,
    "user_email" TEXT,
    "messages_count" INTEGER NOT NULL DEFAULT 0,
    "first_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "widget_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "chat_ratings_chat_message_id_key" ON "chat_ratings"("chat_message_id");

-- CreateIndex
CREATE INDEX "chat_ratings_site_id_idx" ON "chat_ratings"("site_id");

-- CreateIndex
CREATE INDEX "unanswered_questions_site_id_status_idx" ON "unanswered_questions"("site_id", "status");

-- CreateIndex
CREATE INDEX "unanswered_questions_created_at_idx" ON "unanswered_questions"("created_at" DESC);

-- CreateIndex
CREATE INDEX "widget_sessions_site_id_idx" ON "widget_sessions"("site_id");

-- CreateIndex
CREATE INDEX "widget_sessions_last_seen_at_idx" ON "widget_sessions"("last_seen_at" DESC);

-- AddForeignKey
ALTER TABLE "chat_ratings" ADD CONSTRAINT "chat_ratings_chat_message_id_fkey" FOREIGN KEY ("chat_message_id") REFERENCES "chat_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_ratings" ADD CONSTRAINT "chat_ratings_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unanswered_questions" ADD CONSTRAINT "unanswered_questions_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "widget_sessions" ADD CONSTRAINT "widget_sessions_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;
