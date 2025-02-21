import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/connect";
import { BuildClaim } from "@/lib/db/models/BuildClaim";
import { BuildRequest } from "@/lib/db/models/BuildRequest";
import { randomBytes } from "crypto";

export async function GET(
  request: Request,
  { params }: { params: { hash: string } },
) {
  try {
    await connectToDatabase();
    const claims = await BuildClaim.find({
      buildRequestHash: params.hash,
    }).sort({ publishedAt: -1 });

    return NextResponse.json({ claims });
  } catch (error) {
    console.error("Error fetching claims:", error);
    return NextResponse.json(
      { error: "Failed to fetch claims" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { hash: string } },
) {
  try {
    const body = await request.json();
    const { description, projectUrl, author } = body;

    if (!description || !projectUrl || !author) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    await connectToDatabase();

    // Verify build request exists
    const buildRequest = await BuildRequest.findOne({ hash: params.hash });
    if (!buildRequest) {
      return NextResponse.json(
        { error: "Build request not found" },
        { status: 404 },
      );
    }

    // Generate a temporary castHash since we don't have the actual one yet
    const tempCastHash = randomBytes(32).toString("hex");

    // Create the claim
    const claim = await BuildClaim.create({
      castHash: tempCastHash,
      buildRequestHash: params.hash,
      type: "quote", // We'll use quote type for manual claims
      author: {
        fid: author.fid,
        username: author.username,
        displayName: author.displayName,
        pfpUrl: author.pfpUrl,
      },
      text: `🏗️ I built this!\n\n${description}\n\nProject: ${projectUrl}`,
      publishedAt: new Date(),
      engagement: {
        likes: 0,
        recasts: 0,
        replies: 0,
      },
      isTagged: true,
      isHighlighted: false,
      lastUpdated: new Date(),
    });

    // Increment the claimsCount on the build request
    await BuildRequest.findOneAndUpdate(
      { hash: params.hash },
      { $inc: { claimsCount: 1 } }
    );

    return NextResponse.json({ claim });
  } catch (error) {
    console.error("Error creating claim:", error);
    return NextResponse.json(
      { error: "Failed to create claim" },
      { status: 500 },
    );
  }
}
