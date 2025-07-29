import { db } from "@/db/drizzle";
import {and, desc, eq, gt, gte, lte, sql, sum} from "drizzle-orm";
import { dailySummaries, sentimentDetails, platforms, aspects, versionHistory } from "./schema";

export type SentimentChartData = {
  date: string;
  platformName: string;
  aspectName: string;
  positiveCount: number;
  neutralCount: number;
  negativeCount: number;
};

export async function getSentimentDataForChart(
  platformId?: number,
  aspectId?: number,
  startDate?: string,
  endDate?: string
): Promise<SentimentChartData[]> {
  const whereConditions = [];

  if (platformId) {
    whereConditions.push(eq(dailySummaries.platformId, platformId));
  }
  if (aspectId) {
    whereConditions.push(eq(sentimentDetails.aspectId, aspectId));
  }
  if (startDate) {
    whereConditions.push(gte(dailySummaries.date, startDate));
  }
  if (endDate) {
    whereConditions.push(lte(dailySummaries.date, endDate));
  }

  const result = await db
    .select({
      date: dailySummaries.date,
      platformName: platforms.name,
      aspectName: aspects.name,
      positiveCount: sentimentDetails.positiveCount,
      neutralCount: sentimentDetails.neutralCount,
      negativeCount: sentimentDetails.negativeCount,
    })
    .from(sentimentDetails)
    .innerJoin(dailySummaries, eq(sentimentDetails.summaryId, dailySummaries.id))
    .innerJoin(platforms, eq(dailySummaries.platformId, platforms.id))
    .innerJoin(aspects, eq(sentimentDetails.aspectId, aspects.id))
    .where(and(...whereConditions))
    .orderBy(dailySummaries.date, platforms.name, aspects.name);

  return result;
}

export async function getAllPlatforms() {
  return db.select().from(platforms).orderBy(platforms.name);
}

export async function getAllAspects() {
  return db.select().from(aspects).orderBy(aspects.name);
}

export type AggregatedSentimentData = {
  platformId: number;
  platformName: string;
  positive: number;
  neutral: number;
  negative: number;
};

export async function getAggregatedSentimentCounts(
  aspectId?: number,
  startDate?: string,
  endDate?: string
): Promise<AggregatedSentimentData[]> {
  const whereConditions = [];

  if (startDate) {
    whereConditions.push(gte(dailySummaries.date, startDate));
  }
  if (endDate) {
    whereConditions.push(lte(dailySummaries.date, endDate));
  }
  if (aspectId) {
    whereConditions.push(eq(sentimentDetails.aspectId, aspectId));
  }

  const result = await db
    .select({
      platformId: platforms.id,
      platformName: platforms.name,
      positive: sql<number>`sum(${sentimentDetails.positiveCount})`.mapWith(Number),
      neutral: sql<number>`sum(${sentimentDetails.neutralCount})`.mapWith(Number),
      negative: sql<number>`sum(${sentimentDetails.negativeCount})`.mapWith(Number),
    })
    .from(sentimentDetails)
    .innerJoin(dailySummaries, eq(sentimentDetails.summaryId, dailySummaries.id))
    .innerJoin(platforms, eq(dailySummaries.platformId, platforms.id))
    .innerJoin(aspects, eq(sentimentDetails.aspectId, aspects.id))
    .where(and(...whereConditions))
    .groupBy(platforms.id, platforms.name)
    .orderBy(platforms.name);

  return result;
}

export type SentimentType = "positive" | "neutral" | "negative";

export type AspectDistributionData = {
  platformId: number;
  platformName: string;
  aspectId: number;
  aspectName: string;
  totalReviews: number;
};

export async function getAspectDistribution(
  sentimentType: SentimentType,
  startDate?: string,
  endDate?: string
): Promise<AspectDistributionData[]> {
  const whereConditions = [];

  if (startDate) {
    whereConditions.push(gte(dailySummaries.date, startDate));
  }
  if (endDate) {
    whereConditions.push(lte(dailySummaries.date, endDate));
  }

  let columnToSum;
  switch (sentimentType) {
    case "positive":
      columnToSum = sentimentDetails.positiveCount;
      break;
    case "neutral":
      columnToSum = sentimentDetails.neutralCount;
      break;
    case "negative":
      columnToSum = sentimentDetails.negativeCount;
      break;
    default:
      columnToSum = sentimentDetails.positiveCount;
  }
  const totalReviewsAggregate = sum(columnToSum);

  const result = await db
    .select({
      platformId: platforms.id,
      platformName: platforms.name,
      aspectId: aspects.id,
      aspectName: aspects.name,
      totalReviews: totalReviewsAggregate,
    })
    .from(sentimentDetails)
    .innerJoin(dailySummaries, eq(sentimentDetails.summaryId, dailySummaries.id))
    .innerJoin(platforms, eq(dailySummaries.platformId, platforms.id))
    .innerJoin(aspects, eq(sentimentDetails.aspectId, aspects.id))
    .where(and(...whereConditions))
    .groupBy(platforms.id, platforms.name, aspects.id, aspects.name)
    .having(gt(totalReviewsAggregate, 0))
    .orderBy(platforms.name, desc(totalReviewsAggregate));
  return result.map(row => ({
    ...row,
    totalReviews: Number(row.totalReviews)
  }));
}

export type VersionHistoryData = {
  platformName: string;
  versionNumber: string;
  releaseDate: string;
};

export async function getVersionHistoryForPlatform(
  platformId: number,
  startDate?: string,
  endDate?: string
): Promise<VersionHistoryData[]> {
  const whereConditions = [eq(versionHistory.platformId, platformId)];

  if (startDate) {
    whereConditions.push(gte(versionHistory.releaseDate, startDate));
  }
  if (endDate) {
    whereConditions.push(lte(versionHistory.releaseDate, endDate));
  }

  const result = await db
    .select({
      platformName: platforms.name,
      versionNumber: versionHistory.versionNumber,
      releaseDate: versionHistory.releaseDate,
    })
    .from(versionHistory)
    .innerJoin(platforms, eq(versionHistory.platformId, platforms.id))
    .where(and(...whereConditions))
    .orderBy(versionHistory.releaseDate);

  return result;
}