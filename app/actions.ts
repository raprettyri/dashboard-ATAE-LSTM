"use server"

import { db } from "@/db/drizzle";
import {AggregatedSentimentData,
  AspectDistributionData,
  getAggregatedSentimentCounts, getAllAspects, getAllPlatforms,
  getAspectDistribution, getSentimentDataForChart, getVersionHistoryForPlatform, SentimentChartData,
  SentimentType,
  VersionHistoryData} from "@/db/queries";
import * as schema from "@/db/schema";

export async function fetchSentimentData(
  platformId?: number,
  aspectId?: number,
  startDate?: string,
  endDate?: string
): Promise<SentimentChartData[]> {
  return getSentimentDataForChart(platformId, aspectId, startDate, endDate);
}

export async function fetchPlatforms() {
  return getAllPlatforms();
}

export async function fetchAspects() {
  return getAllAspects();
}

export async function fetchAggregatedSentiment(
  aspectId?: number,
  startDate?: string,
  endDate?: string
): Promise<AggregatedSentimentData[]> {
  return getAggregatedSentimentCounts(aspectId, startDate, endDate);
}

export async function fetchAspectDistribution(
  sentimentType: SentimentType,
  startDate?: string,
  endDate?: string
): Promise<AspectDistributionData[]> {
  return getAspectDistribution(sentimentType, startDate, endDate);
}

type SentimentData = {
  platform: string;
  tanggal: string;
  total_ulasan_harian: number;
  total_semua_ulasan_beraspek: number;
  analisis_aspek: {
    [key: string]: {
      total_ulasan_aspek: number;
      detail_sentimen: { Positif: number; Netral: number; Negatif: number; };
      proporsi: { Positif: number; Netral: number; Negatif: number; };
    };
  };
};

type RawVersionHistoryData = { // Ubah nama di sini
  platform: string;
  tanggal_perubahan: string;
  versi_baru: string;
};

function identifyJsonStructure(data: any[]): 'sentiment' | 'version' | 'unknown' {
  if (!Array.isArray(data) || data.length === 0) return 'unknown';
  const firstItem = data[0];
  if (typeof firstItem !== 'object' || firstItem === null) return 'unknown';
  const keys = new Set(Object.keys(firstItem));
  if (keys.has('platform') && keys.has('tanggal') && keys.has('analisis_aspek')) return 'sentiment';
  if (keys.has('platform') && keys.has('tanggal_perubahan') && keys.has('versi_baru')) return 'version';
  return 'unknown';
}

export async function seedDatabaseFromJson(formData: FormData) {
  const files = formData.getAll("jsonFiles") as File[];

  if (!files || files.length === 0) {
    return { success: false, message: "Tidak ada file yang dipilih." };
  }

  let successCount = 0;
  let errorCount = 0;
  const processLog: string[] = [];

  for (const file of files) {
    try {
      if (file.size === 0) {
        throw new Error("File kosong.");
      }

      const fileContent = await file.text();
      const data = JSON.parse(fileContent);
      const type = identifyJsonStructure(data);

      console.log(`🌱 Processing ${file.name} (type: ${type})`);

      if (type === 'unknown') {
        throw new Error("Struktur JSON tidak dikenali.");
      }

      if (type === 'sentiment') {
        const sentimentData = data as SentimentData[];
        const platformNames = new Set(sentimentData.map(d => d.platform));
        await db.insert(schema.platforms).values([...platformNames].map(name => ({ name }))).onConflictDoNothing();
        const allPlatforms = await db.select().from(schema.platforms);
        const platformMap = new Map(allPlatforms.map(p => [p.name, p.id]));

        const aspectNames = new Set<string>();
        sentimentData.forEach(d => Object.keys(d.analisis_aspek).forEach(aspect => aspectNames.add(aspect)));
        await db.insert(schema.aspects).values([...aspectNames].map(name => ({ name }))).onConflictDoNothing();
        const allAspects = await db.select().from(schema.aspects);
        const aspectMap = new Map(allAspects.map(a => [a.name, a.id]));

        for (const summary of sentimentData) {
          const platformId = platformMap.get(summary.platform);
          if (!platformId) continue;

          const [upsertedSummary] = await db.insert(schema.dailySummaries)
            .values({
              platformId,
              date: summary.tanggal,
              totalReviews: summary.total_ulasan_harian,
              totalAspectedReviews: summary.total_semua_ulasan_beraspek,
            })
            .onConflictDoUpdate({
              target: [schema.dailySummaries.platformId, schema.dailySummaries.date],
              set: {
                totalReviews: summary.total_ulasan_harian,
                totalAspectedReviews: summary.total_semua_ulasan_beraspek,
              }
            })
            .returning({ id: schema.dailySummaries.id });

          const detailsToUpsert = Object.entries(summary.analisis_aspek).map(([aspectName, details]) => {
            const aspectId = aspectMap.get(aspectName);
            if (!aspectId) return null;
            return {
              summaryId: upsertedSummary.id,
              aspectId: aspectId,
              totalAspectReviews: details.total_ulasan_aspek,
              positiveCount: details.detail_sentimen.Positif,
              neutralCount: details.detail_sentimen.Netral,
              negativeCount: details.detail_sentimen.Negatif,
              positiveProportion: String(details.proporsi.Positif),
              neutralProportion: String(details.proporsi.Netral),
              negativeProportion: String(details.proporsi.Negatif),
            };
          }).filter(Boolean);

          if (detailsToUpsert.length > 0) {
            for (const detail of detailsToUpsert) {
              if (!detail) continue;

              await db.insert(schema.sentimentDetails)
                .values(detail)
                .onConflictDoUpdate({
                  target: [schema.sentimentDetails.summaryId, schema.sentimentDetails.aspectId],
                  set: {
                    totalAspectReviews: detail.totalAspectReviews,
                    positiveCount: detail.positiveCount,
                    neutralCount: detail.neutralCount,
                    negativeCount: detail.negativeCount,
                    positiveProportion: detail.positiveProportion,
                    neutralProportion: detail.neutralProportion,
                    negativeProportion: detail.negativeProportion,
                  }
                });
            }
          }
        }
      } else if (type === 'version') {
        const versionData = data as RawVersionHistoryData[];
        const platformNames = new Set(versionData.map(d => d.platform));
        await db.insert(schema.platforms).values([...platformNames].map(name => ({name}))).onConflictDoNothing();
        const allPlatforms = await db.select().from(schema.platforms);
        const platformMap = new Map(allPlatforms.map(p => [p.name, p.id]));

        const versionValues = versionData.map(v => ({
          platformId: platformMap.get(v.platform),
          versionNumber: v.versi_baru,
          releaseDate: v.tanggal_perubahan
        })).filter(v => v.platformId);

        if (versionValues.length > 0) {
          await db.insert(schema.versionHistory).values(versionValues as any).onConflictDoNothing();
        }
      }

      successCount++;
      processLog.push(`✅ ${file.name}: Sukses.`);
    } catch (error: any) {
      errorCount++;
      processLog.push(`❌ ${file.name}: Gagal - ${error.message}`);
      console.error(`Error processing ${file.name}:`, error);
    }
  }

  const finalMessage = `Proses selesai. ${successCount} file berhasil, ${errorCount} file gagal.\nLog:\n${processLog.join("\n")}`;
  console.log(`\n🎉 On-demand seeding process completed!`);
  console.log(finalMessage);

  return {
    success: errorCount === 0,
    message: finalMessage,
  };
}

export async function fetchVersionHistory(
  platformId: number,
  startDate?: string,
  endDate?: string
): Promise<VersionHistoryData[]> {
  return getVersionHistoryForPlatform(platformId, startDate, endDate);
}