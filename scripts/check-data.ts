import { config } from "dotenv";
import { resolve } from "path";
import { connectToDatabase, disconnectFromDatabase } from "@/lib/db/connect";
import { BuildRequest } from "@/lib/db/models/BuildRequest";
import { FarcasterUser } from "@/lib/db/models/User";
import { EngagementScore } from "@/lib/db/models/EngagementScore";

// Load environment variables from .env file
config({ path: resolve(__dirname, "../.env") });

async function checkData() {
  try {
    // Connect to MongoDB
    await connectToDatabase();
    console.log("Connected to MongoDB\n");

    // Check BuildRequest collection
    const buildRequestCount = await BuildRequest.countDocuments();
    const latestBuildRequests = await BuildRequest.find()
      .sort({ publishedAt: -1 })
      .limit(3)
      .lean();

    console.log("BuildRequest Collection:");
    console.log(`Total documents: ${buildRequestCount}`);
    console.log("Latest 3 build requests:");
    latestBuildRequests.forEach((req) => {
      console.log(`- Hash: ${req.hash}`);
      console.log(`  Author: @${req.author.username}`);
      console.log(`  Published: ${new Date(req.publishedAt).toLocaleString()}`);
      console.log(
        `  Engagement: ${req.engagement.likes} likes, ${req.engagement.recasts} recasts\n`,
      );
    });

    // Check FarcasterUser collection
    const userCount = await FarcasterUser.countDocuments();
    const recentUsers = await FarcasterUser.find()
      .sort({ lastUpdated: -1 })
      .limit(3)
      .lean();

    console.log("\nFarcasterUser Collection:");
    console.log(`Total documents: ${userCount}`);
    console.log("Latest 3 users:");
    recentUsers.forEach((user) => {
      console.log(`- FID: ${user.fid}`);
      console.log(`  Username: @${user.username}`);
      console.log(`  Display Name: ${user.displayName}`);
      console.log(
        `  Last Updated: ${new Date(user.lastUpdated).toLocaleString()}\n`,
      );
    });

    // Check EngagementScore collection
    const scoreCount = await EngagementScore.countDocuments();
    const topScores = await EngagementScore.find()
      .sort({ score: -1 })
      .limit(3)
      .lean();

    console.log("\nEngagementScore Collection:");
    console.log(`Total documents: ${scoreCount}`);
    console.log("Top 3 engagement scores:");
    topScores.forEach((score) => {
      console.log(`- Build Request: ${score.buildRequestHash}`);
      console.log(`  Time Range: ${score.timeRange}`);
      console.log(`  Score: ${score.score}`);
      console.log(
        `  Metrics: ${score.metrics.likes} likes, ${score.metrics.recasts} recasts, ${score.metrics.replies} replies\n`,
      );
    });

    // Disconnect from MongoDB
    await disconnectFromDatabase();
    process.exit(0);
  } catch (error) {
    console.error("Error checking data:", error);
    process.exit(1);
  }
}

// Run the check data script
checkData();
