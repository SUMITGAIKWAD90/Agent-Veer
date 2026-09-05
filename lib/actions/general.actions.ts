"use server";

import { google } from "@ai-sdk/google";
import { generateText, Output } from "ai";

import { feedbackSchema } from "@/constants";
import { db } from "@/firebase/admin";

export async function createFeedback(
  params: CreateFeedbackParams
): Promise<{ success: true; feedbackId: string } | { success: false }> {
  const { interviewId, userId, transcript, feedbackId } = params;

  try {
    const formattedTranscript = transcript
      .map(
        ({ role, content }: { role: string; content: string }) =>
          `- ${role}: ${content}`
      )
      .join("\n");

    const { output } = await generateText({
      model: google("gemini-3.6-flash"),
      output: Output.object({
        schema: feedbackSchema,
        name: "interview_feedback",
        description:
          "Structured evaluation of a candidate's mock interview performance.",
      }),
      system: `
You are a professional technical interviewer analyzing a mock interview.

Evaluate the candidate objectively and critically. Do not be overly lenient.
Identify mistakes, weaknesses, missing concepts, unclear answers, and areas that
could be improved.

Return only the structured feedback required by the provided schema.
Do not add categories that are not defined in the schema.
      `.trim(),
      prompt: `
Analyze the following mock interview transcript.

TRANSCRIPT:
${formattedTranscript}

Score the candidate from 0 to 100 in each of these categories:

1. Communication Skills
   - Clarity
   - Articulation
   - Structure of responses

2. Technical Knowledge
   - Understanding of relevant concepts
   - Accuracy
   - Depth of knowledge

3. Problem Solving
   - Ability to analyze problems
   - Logical reasoning
   - Quality of proposed solutions

4. Cultural Fit
   - Alignment with the role
   - Professionalism
   - Suitability for the position

5. Confidence and Clarity
   - Confidence
   - Engagement
   - Ability to communicate ideas clearly

Provide detailed but evidence-based feedback based only on the transcript.
      `.trim(),
    });

    if (!output) {
      throw new Error("AI model did not return feedback.");
    }

    const feedbackData = {
      interviewId,
      userId,
      totalScore: output.totalScore,
      categoryScores: output.categoryScores,
      strengths: output.strengths,
      areasForImprovement: output.areasForImprovement,
      finalAssessment: output.finalAssessment,
      createdAt: new Date().toISOString(),
    };

    const feedbackRef = feedbackId
      ? db.collection("feedback").doc(feedbackId)
      : db.collection("feedback").doc();

    await feedbackRef.set(feedbackData);

    return {
      success: true,
      feedbackId: feedbackRef.id,
    };
  } catch (error) {
    console.error("Error creating interview feedback:", error);

    return {
      success: false,
    };
  }
}

export async function getInterviewById(id: string): Promise<Interview | null> {
  if (!id || id.trim() === "") {
    return null;
  }

  const interview = await db.collection("interviews").doc(id).get();

  if (!interview.exists) {
    return null;
  }

  return {
    id: interview.id,
    ...interview.data(),
  } as Interview;
}

export async function getFeedbackByInterviewId(
  params: GetFeedbackByInterviewIdParams
): Promise<Feedback | null> {
  const { interviewId, userId } = params;

  if (!interviewId || !userId) {
    return null;
  }

  const snapshot = await db
    .collection("feedback")
    .where("interviewId", "==", interviewId)
    .where("userId", "==", userId)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  const feedbackDoc = snapshot.docs[0];

  return {
    id: feedbackDoc.id,
    ...feedbackDoc.data(),
  } as Feedback;
}

export async function getLatestInterviews(
  params: GetLatestInterviewsParams
): Promise<Interview[]> {
  const { userId, limit = 20 } = params;

  const snapshot = await db
    .collection("interviews")
    .where("finalized", "==", true)
    .where("userId", "!=", userId)
    .orderBy("userId")
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Interview[];
}

export async function getInterviewsByUserId(
  userId: string
): Promise<Interview[]> {
  const snapshot = await db
    .collection("interviews")
    .where("userId", "==", userId)
    .orderBy("createdAt", "desc")
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Interview[];
}