import { config } from "dotenv";
import { resolve } from "path";
import { connectToDatabase, disconnectFromDatabase } from "@/lib/db/connect";
import { BuildRequest } from "@/lib/db/models/BuildRequest";
import { FarcasterUser } from "@/lib/db/models/User";
import { EngagementScore } from "@/lib/db/models/EngagementScore";

// Load environment variables from .env file
config({ path: resolve(__dirname, "../.env") });

async function clearData() {
  try {
    // Verify required environment variables
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI environment variable is not set");
    }

    // Connect to MongoDB
    await connectToDatabase();
    console.log("Connected to MongoDB");

    // Clear all collections
    console.log("Clearing BuildRequest collection...");
    await BuildRequest.deleteMany({});

    console.log("Clearing FarcasterUser collection...");
    await FarcasterUser.deleteMany({});

    console.log("Clearing EngagementScore collection...");
    await EngagementScore.deleteMany({});

    console.log("All collections cleared successfully");

    // Disconnect from MongoDB
    await disconnectFromDatabase();
    process.exit(0);
  } catch (error) {
    console.error("Error clearing data:", error);
    process.exit(1);
  }
}

// Run the clear data script
clearData();
