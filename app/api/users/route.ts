import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/connect";
import { FarcasterUser } from "@/lib/db/models/User";

export async function GET() {
  try {
    await connectToDatabase();
    const users = await FarcasterUser.find({});
    return NextResponse.json(users);
  } catch (error) {
    console.error("Error retrieving user data:", error);
    return NextResponse.json(
      { error: "Failed to retrieve user data" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const userData = await request.json();

    if (!userData.fid || !userData.username) {
      return NextResponse.json(
        { error: "Missing required user data" },
        { status: 400 },
      );
    }

    await connectToDatabase();

    const user = await FarcasterUser.findOneAndUpdate(
      { fid: userData.fid },
      {
        fid: userData.fid,
        username: userData.username,
        displayName: userData.displayName || userData.username,
        pfp: {
          url: userData.pfpUrl || "",
          verified: true,
        },
        lastUpdated: new Date(),
      },
      { upsert: true, new: true },
    );

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error storing user data:", error);
    return NextResponse.json(
      { error: "Failed to store user data" },
      { status: 500 },
    );
  }
}
