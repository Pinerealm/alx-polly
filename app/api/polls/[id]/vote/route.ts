
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { validateVote, getUserVote } from "@/app/lib/vote-utils";
import { z } from "zod";

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
    // Require authentication upfront
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Authentication required to vote" }, 
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Get the poll first to determine maximum option index
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

    // Create dynamic schema with poll-specific max bound
    const dynamicVoteSchema = z.object({
      optionIndex: z.number().int().min(0).max(poll.options.length - 1)
    });

    // Validate the request body with the dynamic schema
    const validationResult = dynamicVoteSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: `Invalid request: optionIndex must be between 0 and ${poll.options.length - 1}` }, 
        { status: 400 }
      );
    }
    
    const { optionIndex } = validationResult.data;

    // Check if user has already voted (now guaranteed to be authenticated)
    const { data: existingVotes } = await supabase
      .from("votes")
      .select("option_index")
      .eq("poll_id", id)
      .eq("user_id", user.id);

    const userVote = getUserVote(
      existingVotes?.map(v => ({ user_id: user.id, option_index: v.option_index })) || [],
      user.id
    );

    // Validate the vote
    const validation = validateVote(optionIndex, poll, userVote);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error }, 
        { status: 400 }
      );
    }

    // Insert the vote (now guaranteed to be authenticated)
    const { error } = await supabase.from("votes").insert([
      {
        poll_id: id,
        user_id: user.id,
        option_index: optionIndex,
      },
    ]);

    if (error) {
      // Handle unique constraint violation (duplicate vote)
      if (error.code === '23505' || error.message.includes('duplicate key')) {
        return NextResponse.json({ error: "Already voted" }, { status: 409 });
      }
      
      // Handle other database errors
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
