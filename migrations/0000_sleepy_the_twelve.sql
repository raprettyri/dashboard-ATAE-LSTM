CREATE TABLE "aspects" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_summaries" (
	"id" serial PRIMARY KEY NOT NULL,
	"platform_id" integer NOT NULL,
	"date" date NOT NULL,
	"total_reviews" integer NOT NULL,
	"total_aspected_reviews" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platforms" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sentiment_details" (
	"id" serial PRIMARY KEY NOT NULL,
	"summary_id" integer NOT NULL,
	"aspect_id" integer NOT NULL,
	"total_aspect_reviews" integer NOT NULL,
	"positive_count" integer NOT NULL,
	"neutral_count" integer NOT NULL,
	"negative_count" integer NOT NULL,
	"positive_proportion" numeric(5, 2) NOT NULL,
	"neutral_proportion" numeric(5, 2) NOT NULL,
	"negative_proportion" numeric(5, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "version_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"platform_id" integer NOT NULL,
	"version_number" varchar(100) NOT NULL,
	"release_date" date NOT NULL
);
--> statement-breakpoint
ALTER TABLE "daily_summaries" ADD CONSTRAINT "daily_summaries_platform_id_platforms_id_fk" FOREIGN KEY ("platform_id") REFERENCES "public"."platforms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sentiment_details" ADD CONSTRAINT "sentiment_details_summary_id_daily_summaries_id_fk" FOREIGN KEY ("summary_id") REFERENCES "public"."daily_summaries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sentiment_details" ADD CONSTRAINT "sentiment_details_aspect_id_aspects_id_fk" FOREIGN KEY ("aspect_id") REFERENCES "public"."aspects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "version_history" ADD CONSTRAINT "version_history_platform_id_platforms_id_fk" FOREIGN KEY ("platform_id") REFERENCES "public"."platforms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "aspect_name_idx" ON "aspects" USING btree ("name");--> statement-breakpoint
CREATE INDEX "platform_date_idx" ON "daily_summaries" USING btree ("platform_id","date");--> statement-breakpoint
CREATE INDEX "name_idx" ON "platforms" USING btree ("name");--> statement-breakpoint
CREATE INDEX "platform_version_idx" ON "version_history" USING btree ("platform_id","version_number");