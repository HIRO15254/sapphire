CREATE TABLE "sapphire_player_note" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"player_id" varchar(255) NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"note_date" date NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "sapphire_player_tag_assignment" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"player_id" varchar(255) NOT NULL,
	"tag_id" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "player_tag_assignment_unique" UNIQUE("player_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "sapphire_player_tag" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"name" varchar(100) NOT NULL,
	"color" varchar(7),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "sapphire_player" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"general_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "sapphire_player_note" ADD CONSTRAINT "sapphire_player_note_player_id_sapphire_player_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."sapphire_player"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sapphire_player_note" ADD CONSTRAINT "sapphire_player_note_user_id_sapphire_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."sapphire_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sapphire_player_tag_assignment" ADD CONSTRAINT "sapphire_player_tag_assignment_player_id_sapphire_player_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."sapphire_player"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sapphire_player_tag_assignment" ADD CONSTRAINT "sapphire_player_tag_assignment_tag_id_sapphire_player_tag_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."sapphire_player_tag"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sapphire_player_tag" ADD CONSTRAINT "sapphire_player_tag_user_id_sapphire_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."sapphire_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sapphire_player" ADD CONSTRAINT "sapphire_player_user_id_sapphire_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."sapphire_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "player_note_player_id_idx" ON "sapphire_player_note" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "player_note_note_date_idx" ON "sapphire_player_note" USING btree ("note_date");--> statement-breakpoint
CREATE INDEX "player_tag_assignment_player_id_idx" ON "sapphire_player_tag_assignment" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "player_tag_assignment_tag_id_idx" ON "sapphire_player_tag_assignment" USING btree ("tag_id");--> statement-breakpoint
CREATE INDEX "player_tag_user_id_idx" ON "sapphire_player_tag" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "player_user_id_idx" ON "sapphire_player" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "player_name_idx" ON "sapphire_player" USING btree ("name");