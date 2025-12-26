ALTER TABLE "sapphire_tournament_prize_level" ADD COLUMN "prize_type" varchar(20) DEFAULT 'percentage' NOT NULL;--> statement-breakpoint
ALTER TABLE "sapphire_tournament_prize_level" ADD COLUMN "custom_prize_label" text;--> statement-breakpoint
ALTER TABLE "sapphire_tournament_prize_level" ADD COLUMN "custom_prize_value" integer;