CREATE TABLE "sapphire_bonus_transaction" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"currency_id" varchar(255) NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"amount" integer NOT NULL,
	"source" varchar(255),
	"transaction_date" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "sapphire_currency" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"initial_balance" integer DEFAULT 0 NOT NULL,
	"is_archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "sapphire_purchase_transaction" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"currency_id" varchar(255) NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"amount" integer NOT NULL,
	"note" text,
	"transaction_date" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "sapphire_bonus_transaction" ADD CONSTRAINT "sapphire_bonus_transaction_currency_id_sapphire_currency_id_fk" FOREIGN KEY ("currency_id") REFERENCES "public"."sapphire_currency"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sapphire_bonus_transaction" ADD CONSTRAINT "sapphire_bonus_transaction_user_id_sapphire_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."sapphire_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sapphire_currency" ADD CONSTRAINT "sapphire_currency_user_id_sapphire_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."sapphire_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sapphire_purchase_transaction" ADD CONSTRAINT "sapphire_purchase_transaction_currency_id_sapphire_currency_id_fk" FOREIGN KEY ("currency_id") REFERENCES "public"."sapphire_currency"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sapphire_purchase_transaction" ADD CONSTRAINT "sapphire_purchase_transaction_user_id_sapphire_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."sapphire_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "bonus_transaction_currency_id_idx" ON "sapphire_bonus_transaction" USING btree ("currency_id");--> statement-breakpoint
CREATE INDEX "bonus_transaction_user_id_idx" ON "sapphire_bonus_transaction" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "bonus_transaction_date_idx" ON "sapphire_bonus_transaction" USING btree ("transaction_date");--> statement-breakpoint
CREATE INDEX "currency_user_id_idx" ON "sapphire_currency" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "currency_is_archived_idx" ON "sapphire_currency" USING btree ("is_archived");--> statement-breakpoint
CREATE INDEX "purchase_transaction_currency_id_idx" ON "sapphire_purchase_transaction" USING btree ("currency_id");--> statement-breakpoint
CREATE INDEX "purchase_transaction_user_id_idx" ON "sapphire_purchase_transaction" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "purchase_transaction_date_idx" ON "sapphire_purchase_transaction" USING btree ("transaction_date");