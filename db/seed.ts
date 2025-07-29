import {db} from "./drizzle";
import * as schema from "./schema";
import {promises as fs} from "fs";
import path from "path";

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

type VersionHistoryData = {
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

async function seed() {
  console.log("🌱 Starting the seeding process...");
  try {
    const jsonDirPath = path.join(process.cwd(), 'db', 'json');
    const files = await fs.readdir(jsonDirPath);
    const jsonFiles = files.filter(f => f.endsWith('.json'));

    if (jsonFiles.length === 0) {
      console.log("No JSON files found in db/json. Exiting.");
      return;
    }

    let allSentimentData: SentimentData[] = [];
    let allVersionData: VersionHistoryData[] = [];

    for (const file of jsonFiles) {
      const filePath = path.join(jsonDirPath, file);
      const fileContent = await fs.readFile(filePath, "utf-8");
      const data = JSON.parse(fileContent);
      const type = identifyJsonStructure(data);

      if (type === 'sentiment') allSentimentData.push(...data);
      else if (type === 'version') allVersionData.push(...data);
    }

    console.log("Seeding platforms and aspects...");
    const platformNames = new Set([...allSentimentData.map(d => d.platform), ...allVersionData.map(d => d.platform)]);
    await db.insert(schema.platforms).values([...platformNames].map(name => ({name}))).onConflictDoNothing();
    const allPlatforms = await db.select().from(schema.platforms);
    const platformMap = new Map(allPlatforms.map(p => [p.name, p.id]));

    const aspectNames = new Set<string>();
    allSentimentData.forEach(d => Object.keys(d.analisis_aspek).forEach(aspect => aspectNames.add(aspect)));
    await db.insert(schema.aspects).values([...aspectNames].map(name => ({name}))).onConflictDoNothing();
    const allAspects = await db.select().from(schema.aspects);
    const aspectMap = new Map(allAspects.map(a => [a.name, a.id]));
    console.log("✅ Platforms and aspects seeded.");

    console.log("Seeding version history...");
    if (allVersionData.length > 0) {
      const versionValues = allVersionData
        .map(v => ({
          platformId: platformMap.get(v.platform),
          versionNumber: v.versi_baru,
          releaseDate: v.tanggal_perubahan
        }))
        .filter(v => v.platformId);

      if (versionValues.length > 0) {
        await db.insert(schema.versionHistory).values(versionValues as any).onConflictDoNothing();
      }
    }
    console.log("✅ Version history seeded.");

    console.log("Seeding daily summaries and sentiment details...");
    for (const summary of allSentimentData) {
      const platformId = platformMap.get(summary.platform);
      if (!platformId) continue;

      const summaryToUpsert = {
        platformId,
        date: summary.tanggal,
        totalReviews: summary.total_ulasan_harian,
        totalAspectedReviews: summary.total_semua_ulasan_beraspek,
      };

      const [upsertedSummary] = await db.insert(schema.dailySummaries)
        .values(summaryToUpsert)
        .onConflictDoUpdate({
          target: [schema.dailySummaries.platformId, schema.dailySummaries.date],
          set: {
            totalReviews: summary.total_ulasan_harian,
            totalAspectedReviews: summary.total_semua_ulasan_beraspek,
          }
        })
        .returning({id: schema.dailySummaries.id});

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
        await db.insert(schema.sentimentDetails)
          .values(detailsToUpsert as any)
          .onConflictDoUpdate({
            target: [schema.sentimentDetails.summaryId, schema.sentimentDetails.aspectId],
            set: {
              totalAspectReviews: 1,
            }
          });
      }
    }
    console.log("✅ Daily summaries and sentiment details seeded.");

    console.log("\n🎉 Seeding process completed successfully!");
  } catch (error) {
    console.error("\n❌ An error occurred during the seeding process:", error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

seed();