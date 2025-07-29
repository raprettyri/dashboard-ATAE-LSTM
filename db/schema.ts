// noinspection JSUnusedGlobalSymbols

import {
  serial,
  varchar,
  integer,
  date,
  decimal,
  pgTable,
  unique,
} from "drizzle-orm/pg-core";
import {relations} from "drizzle-orm";

export const platforms = pgTable("platforms", {
  id: serial("id").primaryKey(),
  name: varchar("name", {length: 50}).notNull().unique(),
});

export const aspects = pgTable("aspects", {
  id: serial("id").primaryKey(),
  name: varchar("name", {length: 50}).notNull().unique(),
});

export const dailySummaries = pgTable("daily_summaries", {
  id: serial("id").primaryKey(),
  platformId: integer("platform_id")
    .notNull()
    .references(() => platforms.id, {onDelete: "cascade"}),
  date: date("date").notNull(),
  totalReviews: integer("total_reviews").notNull(),
  totalAspectedReviews: integer("total_aspected_reviews").notNull(),
}, (table) => [
  unique("platform_date_unq").on(table.platformId, table.date),
]);

export const sentimentDetails = pgTable("sentiment_details", {
  id: serial("id").primaryKey(),
  summaryId: integer("summary_id")
    .notNull()
    .references(() => dailySummaries.id, {onDelete: "cascade"}),
  aspectId: integer("aspect_id")
    .notNull()
    .references(() => aspects.id, {onDelete: "cascade"}),
  totalAspectReviews: integer("total_aspect_reviews").notNull(),
  positiveCount: integer("positive_count").notNull(),
  neutralCount: integer("neutral_count").notNull(),
  negativeCount: integer("negative_count").notNull(),
  positiveProportion: decimal("positive_proportion", {
    precision: 5,
    scale: 2,
  }).notNull(),
  neutralProportion: decimal("neutral_proportion", {
    precision: 5,
    scale: 2,
  }).notNull(),
  negativeProportion: decimal("negative_proportion", {
    precision: 5,
    scale: 2,
  }).notNull(),
}, (table) => [
  unique("summary_aspect_unq").on(table.summaryId, table.aspectId),
]);

export const versionHistory = pgTable("version_history", {
  id: serial("id").primaryKey(),
  platformId: integer("platform_id")
    .notNull()
    .references(() => platforms.id, {onDelete: "cascade"}),
  versionNumber: varchar("version_number", {length: 100}).notNull(),
  releaseDate: date("release_date").notNull(),
}, (table) => [
  unique("platform_version_unq").on(table.platformId, table.versionNumber),
]);

export const platformRelations = relations(platforms, ({many}) => ({
  dailySummaries: many(dailySummaries),
}));

export const aspectRelations = relations(aspects, ({many}) => ({
  sentimentDetails: many(sentimentDetails),
}));

export const dailySummaryRelations = relations(dailySummaries, ({one, many}) => ({
  platform: one(platforms, {
    fields: [dailySummaries.platformId],
    references: [platforms.id],
  }),
  sentiments: many(sentimentDetails),
}));

export const sentimentDetailRelations = relations(sentimentDetails, ({one}) => ({
  summary: one(dailySummaries, {
    fields: [sentimentDetails.summaryId],
    references: [dailySummaries.id],
  }),
  aspect: one(aspects, {
    fields: [sentimentDetails.aspectId],
    references: [aspects.id],
  }),
}));

export const versionHistoryRelations = relations(versionHistory, ({one}) => ({
  platform: one(platforms, {
    fields: [versionHistory.platformId],
    references: [platforms.id],
  }),
}));