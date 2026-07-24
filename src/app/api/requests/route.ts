import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Request from "@/models/Request";
import { auth } from "@/lib/auth";
import { requestSchema } from "@/lib/validators/content";

// Logged-in users: create a content request, and list their own requests.

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "You must be signed in to request content" }, { status: 401 });
    const body = await req.json();
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });

    await connectDB();
    const request = await Request.create({
      ...parsed.data,
      user: session.user.id,
    });
    return NextResponse.json({ request }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "You must be signed in" }, { status: 401 });
    await connectDB();
    const requests = await Request.find({ user: session.user.id }).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ requests });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
