ALTER TABLE "sapphire_poker_session" DROP CONSTRAINT "sapphire_poker_session_currency_id_sapphire_currency_id_fk";
--> statement-breakpoint
ALTER TABLE "sapphire_all_in_record" ADD COLUMN "run_it_times" integer;--> statement-breakpoint
ALTER TABLE "sapphire_all_in_record" ADD COLUMN "wins_in_runout" integer;--> statement-breakpoint
ALTER TABLE "sapphire_poker_session" DROP COLUMN "currency_id";