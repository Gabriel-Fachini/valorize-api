-- CreateTable
CREATE TABLE "public"."user_onboarding" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "email_sent_at" TIMESTAMP(3),
    "email_clicked_at" TIMESTAMP(3),
    "password_defined_at" TIMESTAMP(3),
    "first_login_at" TIMESTAMP(3),
    "email_send_count" INTEGER NOT NULL DEFAULT 0,
    "last_email_sent_at" TIMESTAMP(3),
    "is_confirmed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_onboarding_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_onboarding_user_id_key" ON "public"."user_onboarding"("user_id");

-- CreateIndex
CREATE INDEX "user_onboarding_user_id_idx" ON "public"."user_onboarding"("user_id");

-- CreateIndex
CREATE INDEX "user_onboarding_is_confirmed_idx" ON "public"."user_onboarding"("is_confirmed");

-- CreateIndex
CREATE INDEX "user_onboarding_email_sent_at_idx" ON "public"."user_onboarding"("email_sent_at");

-- CreateIndex
CREATE INDEX "user_onboarding_email_send_count_idx" ON "public"."user_onboarding"("email_send_count");

-- AddForeignKey
ALTER TABLE "public"."user_onboarding" ADD CONSTRAINT "user_onboarding_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
