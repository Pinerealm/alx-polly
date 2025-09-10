import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createPollResults } from "@/app/lib/vote-utils";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const cookieStore = cookies();
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
    // Get the poll (select only non-PII fields)
    const { data: poll, error: pollError } = await supabase
      .from("polls")
      .select("id, question, options, created_at")
      .eq("id", id)
      .single();

    if (pollError || !poll) {
      return NextResponse.json(
        { error: "Poll not found" }, 
        { status: 404 }
      );
    }

    // Get all votes for this poll
    const { data: votes, error: votesError } = await supabase
      .from("votes")
      .select("user_id, option_index")
      .eq("poll_id", id);

    if (votesError) {
      return NextResponse.json(
        { error: "Failed to fetch votes" }, 
        { status: 500 }
      );
    }

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Create poll results
    const results = createPollResults(poll, votes || [], user?.id || null);

    // Return only the necessary data, excluding any PII
    return NextResponse.json({ 
      results: {
        poll: {
          id: results.poll.id,
          question: results.poll.question,
          options: results.poll.options,
          created_at: results.poll.created_at,
          total_votes: results.poll.total_votes,
          vote_counts: results.poll.vote_counts
        },
        results: results.results,
        total_votes: results.total_votes,
        has_user_voted: results.has_user_voted,
        user_vote: results.user_vote
      }, 
      error: null 
    }, { status: 200 });
  } catch (error) {
    console.error("Error fetching poll results:", error);
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    );
  }
}
