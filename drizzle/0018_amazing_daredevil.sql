ALTER TABLE "sapphire_poker_session" ADD COLUMN "tournament_override_basic" jsonb;--> statement-breakpoint
ALTER TABLE "sapphire_poker_session" ADD COLUMN "tournament_override_blinds" jsonb;--> statement-breakpoint
ALTER TABLE "sapphire_poker_session" ADD COLUMN "tournament_override_prizes" jsonb;