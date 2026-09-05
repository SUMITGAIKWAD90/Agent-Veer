import Image from "next/image";
import { redirect } from "next/navigation";

import Agent from "@/components/Agent";
import DisplayTechIcons from "@/components/DisplayTechIcons";

import { getRandomInterviewCover } from "@/lib/utils";

import {
  getFeedbackByInterviewId,
  getInterviewById,
} from "@/lib/actions/general.actions";

import { getCurrentUser } from "@/lib/actions/auth.action";

interface InterviewDetailsProps {
  params: Promise<{
    id: string;
  }>;
}

const InterviewDetails = async ({
  params,
}: InterviewDetailsProps) => {
  // Next.js 16: params is a Promise
  const { id } = await params;

  // Prevent an invalid Firestore document path
  if (!id || id.trim() === "") {
    redirect("/");
  }

  // Check authentication first
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Fetch interview first because feedback depends on the interview ID
  const interview = await getInterviewById(id);

  if (!interview) {
    redirect("/");
  }

  // Fetch existing feedback
  const feedback = await getFeedbackByInterviewId({
    interviewId: id,
    userId: user.id,
  });

  return (
    <main className="flex flex-col gap-8">
      {/* Interview Header */}
      <section className="flex flex-row justify-between gap-4 max-sm:flex-col">
        <div className="flex flex-row items-center gap-4 max-sm:flex-col max-sm:items-start">
          {/* Interview Title */}
          <div className="flex flex-row items-center gap-4">
            <Image
              src={getRandomInterviewCover()}
              alt="Interview cover"
              width={40}
              height={40}
              className="size-[40px] rounded-full object-cover"
            />

            <h1 className="text-xl font-semibold capitalize">
              {interview.role} Interview
            </h1>
          </div>

          {/* Technologies */}
          <DisplayTechIcons
            techStack={interview.techstack}
          />
        </div>

        {/* Interview Type */}
        <p className="h-fit rounded-lg bg-dark-200 px-4 py-2 capitalize">
          {interview.type}
        </p>
      </section>

      {/* AI Interview Agent */}
      <section>
        <Agent
          userName={user.name}
          userId={user.id}
          interviewId={id}
          type="interview"
          questions={interview.questions}
          feedbackId={feedback?.id}
        />
      </section>
    </main>
  );
};

export default InterviewDetails;
