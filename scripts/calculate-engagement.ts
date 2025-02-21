import { config } from "dotenv";
import { resolve } from "path";
import { connectToDatabase, disconnectFromDatabase } from "@/lib/db/connect";
import { BuildRequest } from "@/lib/db/models/BuildRequest";
import { EngagementScore, TimeRange } from "@/lib/db/models/EngagementScore";

config({ path: resolve(__dirname, "../.env") });

const WEIGHTS = {
  LIKE: 2,
  RECAST: 3,
  REPLY: 1,
  WATCH: 0.5,
};

async function calculateEngagementScores() {
  try {
    await connectToDatabase();
    console.log("Connected to MongoDB");

    // Get all build requests
    const buildRequests = await BuildRequest.find({}).sort({ publishedAt: -1 });
    console.log(`Processing ${buildRequests.length} build requests...`);

    // Clear existing engagement scores
    await EngagementScore.deleteMany({});

    const now = new Date();
    const periodStart = new Date(now);
    periodStart.setDate(periodStart.getDate() - 30); // Last 30 days

    // Calculate scores for each build request
    const engagementScores = buildRequests.map((buildRequest) => {
      const metrics = {
        likes: buildRequest.engagement?.likes || 0,
        recasts: buildRequest.engagement?.recasts || 0,
        replies: buildRequest.engagement?.replies || 0,
        watches: buildRequest.engagement?.watches || 0,
      };

      const score =
        metrics.likes * WEIGHTS.LIKE +
        metrics.recasts * WEIGHTS.RECAST +
        metrics.replies * WEIGHTS.REPLY +
        metrics.watches * WEIGHTS.WATCH;

      return {
        buildRequestHash: buildRequest.hash,
        timeRange: "month" as TimeRange,
        score: Math.round(score * 100) / 100, // Round to 2 decimal places
        periodStart,
        periodEnd: now,
        metrics,
        lastCalculated: now,
      };
    });

    await EngagementScore.insertMany(engagementScores);
    console.log(`Stored ${engagementScores.length} engagement scores`);

    // Log top 10 engagement scores
    const topScores = await EngagementScore.find()
      .sort({ score: -1 })
      .limit(10);

    console.log("\nTop 10 Engagement Scores:");
    topScores.forEach((score, index) => {
      console.log(
        `${index + 1}. Hash: ${score.buildRequestHash}, Score: ${score.score}`,
      );
      console.log(`   Metrics: ${JSON.stringify(score.metrics)}\n`);
    });
  } catch (error) {
    console.error("Error calculating engagement scores:", error);
  } finally {
    await disconnectFromDatabase();
    process.exit(0);
  }
}

calculateEngagementScores();
