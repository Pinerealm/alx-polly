
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { validateVote, getUserVote } from "@/app/lib/vote-utils";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  try {
    const { optionIndex } = await request.json();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Get the poll to validate the vote
    const { data: poll, error: pollError } = await supabase
      .from("polls")
      .select("*")
      .eq("id", id)
      .single();

    if (pollError || !poll) {
      return NextResponse.json(
        { error: "Poll not found" }, 
        { status: 404 }
      );
    }

    // Check if user has already voted
    const { data: existingVotes } = await supabase
      .from("votes")
      .select("option_index")
      .eq("poll_id", id)
      .eq("user_id", user?.id || null);

    const userVote = getUserVote(
      existingVotes?.map(v => ({ user_id: user?.id || null, option_index: v.option_index })) || [],
      user?.id || null
    );

    // Validate the vote
    const validation = validateVote(optionIndex, poll, userVote);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error }, 
        { status: 400 }
      );
    }

    // Insert the vote
    const { error } = await supabase.from("votes").insert([
      {
        poll_id: id,
        user_id: user?.id ?? null,
        option_index: optionIndex,
      },
    ]);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ error: null }, { status: 201 });
  } catch (error) {
    console.error("Error submitting vote:", error);
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    );
  }
}
