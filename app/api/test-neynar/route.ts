import { NextResponse } from "next/server";
import { neynarClient } from "@/lib/api/neynar";

export async function GET() {
  try {
    // Test fetching build requests
    const buildRequests = await neynarClient.fetchBuildRequests(undefined, 5);

    if (buildRequests.casts.length > 0) {
      const firstCast = buildRequests.casts[0];

      // Test fetching user profile
      const userProfile = await neynarClient.fetchUserProfile(
        firstCast.author.fid,
      );

      // Test fetching cast engagement
      const castEngagement = await neynarClient.fetchCastEngagement(
        firstCast.hash,
      );

      return NextResponse.json({
        success: true,
        buildRequests: buildRequests.casts.slice(0, 2), // Return first 2 for brevity
        userProfile,
        castEngagement,
      });
    } else {
      return NextResponse.json({
        success: false,
        error: "No build requests found",
      });
    }
  } catch (error) {
    console.error("Error testing Neynar API:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
