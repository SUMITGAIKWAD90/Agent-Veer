import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import InterviewCard from "@/components/InterviewCard";

import { getCurrentUser } from "@/lib/actions/auth.action";
import {
  getInterviewsByUserId,
  getLatestInterviews,
} from "@/lib/actions/general.actions";

async function Home() {
  const user = await getCurrentUser();

  // User must be authenticated to access the dashboard.
  if (!user) {
    redirect("/sign-in");
  }

  const [userInterviews, allInterviews] = await Promise.all([
    getInterviewsByUserId(user.id),
    getLatestInterviews({
      userId: user.id,
    }),
  ]);

  const hasPastInterviews = userInterviews.length > 0;
  const hasAvailableInterviews = allInterviews.length > 0;

  return (
    <main>
      {/* CTA */}
      <section className="card-cta">
        <div className="flex max-w-lg flex-col gap-6">
          <h2>Get Interview-Ready with AI-Powered Practice & Feedback</h2>

          <p className="text-lg">
            Practice real interview questions & get instant feedback
          </p>

          <Button className="btn-primary max-sm:w-full">
            <Link href="/interview">Start an Interview</Link>
          </Button>
        </div>

        <Image
          src="/robot_2.png"
          alt="AI interview assistant"
          width={400}
          height={400}
          priority
          className="max-sm:hidden"
        />
      </section>

      {/* User Interviews */}
      <section className="mt-8 flex flex-col gap-6">
        <h2>Your Interviews</h2>

        <div className="interviews-section">
          {hasPastInterviews ? (
            userInterviews.map((interview) => (
              <InterviewCard
                key={interview.id}
                userId={user.id}
                interviewId={interview.id}
                role={interview.role}
                type={interview.type}
                techstack={interview.techstack}
                createdAt={interview.createdAt}
              />
            ))
          ) : (
            <p>You haven&apos;t taken any interviews yet.</p>
          )}
        </div>
      </section>

      {/* Available Interviews */}
      <section className="mt-8 flex flex-col gap-6">
        <h2>Take Interviews</h2>

        <div className="interviews-section">
          {hasAvailableInterviews ? (
            allInterviews.map((interview) => (
              <InterviewCard
                key={interview.id}
                userId={user.id}
                interviewId={interview.id}
                role={interview.role}
                type={interview.type}
                techstack={interview.techstack}
                createdAt={interview.createdAt}
              />
            ))
          ) : (
            <p>There are no interviews available.</p>
          )}
        </div>
      </section>
    </main>
  );
}

export default Home;