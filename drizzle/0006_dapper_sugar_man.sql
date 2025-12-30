ALTER TABLE "sapphire_tournament_prize_level" RENAME COLUMN "position" TO "min_position";--> statement-breakpoint
DROP INDEX "tournament_prize_level_position_idx";--> statement-breakpoint
ALTER TABLE "sapphire_tournament_blind_level" ALTER COLUMN "small_blind" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "sapphire_tournament_blind_level" ALTER COLUMN "big_blind" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "sapphire_tournament_blind_level" ADD COLUMN "is_break" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "sapphire_tournament_prize_level" ADD COLUMN "min_entrants" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "sapphire_tournament_prize_level" ADD COLUMN "max_entrants" integer;--> statement-breakpoint
ALTER TABLE "sapphire_tournament_prize_level" ADD COLUMN "max_position" integer NOT NULL;--> statement-breakpoint
CREATE INDEX "tournament_prize_level_min_entrants_idx" ON "sapphire_tournament_prize_level" USING btree ("min_entrants");