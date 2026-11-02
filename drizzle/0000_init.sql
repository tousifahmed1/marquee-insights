CREATE TYPE "public"."age_group" AS ENUM('18-24', '25-34', '35-44', '45-54', '55+');--> statement-breakpoint
CREATE TYPE "public"."gender" AS ENUM('female', 'male', 'non-binary', 'undisclosed');--> statement-breakpoint
CREATE TYPE "public"."genre" AS ENUM('drama', 'comedy', 'thriller', 'sci-fi', 'crime', 'documentary', 'reality', 'animation');--> statement-breakpoint
CREATE TYPE "public"."platform" AS ENUM('lumen-plus', 'tidewell', 'corvid-tv', 'quaystream', 'harbourline', 'parcel-play');--> statement-breakpoint
CREATE TYPE "public"."region" AS ENUM('northeast', 'midwest', 'south', 'west');--> statement-breakpoint
CREATE TABLE "responses" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "responses_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"show_id" integer NOT NULL,
	"platform" "platform" NOT NULL,
	"region" "region" NOT NULL,
	"age_group" "age_group" NOT NULL,
	"gender" "gender" NOT NULL,
	"wave" date NOT NULL,
	"awareness" smallint NOT NULL,
	"intent" smallint NOT NULL,
	"satisfaction" smallint NOT NULL,
	"would_recommend" boolean NOT NULL,
	CONSTRAINT "responses_wave_first_of_month" CHECK (extract(day from "responses"."wave") = 1),
	CONSTRAINT "responses_awareness_range" CHECK ("responses"."awareness" between 0 and 100),
	CONSTRAINT "responses_intent_range" CHECK ("responses"."intent" between 0 and 100),
	CONSTRAINT "responses_satisfaction_range" CHECK ("responses"."satisfaction" between 1 and 10)
);
--> statement-breakpoint
CREATE TABLE "shows" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "shows_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"title" text NOT NULL,
	"genre" "genre" NOT NULL,
	"platform" "platform" NOT NULL,
	"release_year" smallint NOT NULL,
	CONSTRAINT "shows_title_unique" UNIQUE("title"),
	CONSTRAINT "shows_release_year_range" CHECK ("shows"."release_year" between 1950 and 2100)
);
--> statement-breakpoint
ALTER TABLE "responses" ADD CONSTRAINT "responses_show_id_shows_id_fk" FOREIGN KEY ("show_id") REFERENCES "public"."shows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "responses_region_idx" ON "responses" USING btree ("region");--> statement-breakpoint
CREATE INDEX "responses_age_group_idx" ON "responses" USING btree ("age_group");--> statement-breakpoint
CREATE INDEX "responses_wave_id_idx" ON "responses" USING btree ("wave","id");--> statement-breakpoint
CREATE INDEX "responses_awareness_idx" ON "responses" USING btree ("awareness");--> statement-breakpoint
CREATE INDEX "responses_intent_idx" ON "responses" USING btree ("intent");--> statement-breakpoint
CREATE INDEX "responses_satisfaction_idx" ON "responses" USING btree ("satisfaction");--> statement-breakpoint
CREATE INDEX "responses_show_wave_idx" ON "responses" USING btree ("show_id","wave");--> statement-breakpoint
CREATE INDEX "responses_platform_wave_idx" ON "responses" USING btree ("platform","wave");--> statement-breakpoint
CREATE INDEX "responses_region_age_group_idx" ON "responses" USING btree ("region","age_group");--> statement-breakpoint
CREATE INDEX "shows_genre_idx" ON "shows" USING btree ("genre");--> statement-breakpoint
CREATE INDEX "shows_platform_idx" ON "shows" USING btree ("platform");