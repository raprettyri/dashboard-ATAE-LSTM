DROP INDEX "aspect_name_idx";--> statement-breakpoint
DROP INDEX "platform_date_idx";--> statement-breakpoint
DROP INDEX "name_idx";--> statement-breakpoint
DROP INDEX "platform_version_idx";--> statement-breakpoint
ALTER TABLE "aspects" ADD CONSTRAINT "aspects_name_unique" UNIQUE("name");--> statement-breakpoint
ALTER TABLE "daily_summaries" ADD CONSTRAINT "platform_date_unq" UNIQUE("platform_id","date");--> statement-breakpoint
ALTER TABLE "platforms" ADD CONSTRAINT "platforms_name_unique" UNIQUE("name");--> statement-breakpoint
ALTER TABLE "sentiment_details" ADD CONSTRAINT "summary_aspect_unq" UNIQUE("summary_id","aspect_id");--> statement-breakpoint
ALTER TABLE "version_history" ADD CONSTRAINT "platform_version_unq" UNIQUE("platform_id","version_number");