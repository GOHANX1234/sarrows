import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import Series from "@/models/Series";
import "@/models/Genre";
import { auth } from "@/lib/auth";
import { generateSlug } from "@/lib/utils";
import { seriesSchema } from "@/lib/validators/content";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if ((session?.user as any)?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const body = await req.json();
    const parsed = seriesSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const data = parsed.data;
    await connectDB();

    let slug = generateSlug(data.title);
    const existing = await Series.findOne({ slug });
    if (existing) slug = generateSlug(data.title, Date.now().toString());

    const series = await Series.create({ ...data, slug });
    const populated = await Series.findById(series._id).populate("genres", "name").lean();
    revalidatePath("/");
    revalidatePath("/home");
    revalidatePath("/anime");
    return NextResponse.json({ series: populated }, { status: 201 });
  } catch (err: any) {
    if (err.code === 11000) {
      return NextResponse.json({ error: "Series with this title already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
