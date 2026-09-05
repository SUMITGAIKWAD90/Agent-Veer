"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { vapi } from "@/lib/vapi.sdk";
import { interviewer } from "@/constants";
import { createFeedback } from "@/lib/actions/general.actions";

enum CallStatus {
  INACTIVE = "INACTIVE",
  CONNECTING = "CONNECTING",
  ACTIVE = "ACTIVE",
  FINISHED = "FINISHED",
}

interface SavedMessage {
  role: "user" | "system" | "assistant";
  content: string;
}

interface VapiTranscriptMessage {
  type: "transcript";
  transcriptType: "partial" | "final";
  role: "user" | "assistant";
  transcript: string;
}

interface AgentProps {
  userName: string;
  userId: string;
  interviewId: string;
  feedbackId?: string;
  type: "generate" | "interview";
  questions?: string[];
}

const Agent = ({
  userName,
  userId,
  interviewId,
  feedbackId,
  type,
  questions,
}: AgentProps) => {
  const router = useRouter();

  const [callStatus, setCallStatus] = useState<CallStatus>(
    CallStatus.INACTIVE
  );

  const [messages, setMessages] = useState<SavedMessage[]>([]);

  const [isSpeaking, setIsSpeaking] = useState(false);

  const feedbackGenerated = useRef(false);

  /**
   * Generate interview feedback after the call ends.
   */
  const handleGenerateFeedback = useCallback(
    async (transcript: SavedMessage[]) => {
      if (feedbackGenerated.current) {
        return;
      }

      feedbackGenerated.current = true;

      try {
        console.log("Generating interview feedback...");

        const result = await createFeedback({
          interviewId,
          userId,
          transcript,
          feedbackId,
        });

        if (result.success) {
          router.push(`/interview/${interviewId}/feedback`);
          return;
        }

        console.error("Failed to save interview feedback.");

        router.push("/");
      } catch (error: unknown) {
        console.error(
          "Error generating interview feedback:",
          error
        );

        router.push("/");
      }
    },
    [feedbackId, interviewId, router, userId]
  );

  /**
   * Register Vapi event listeners.
   */
  useEffect(() => {
    const handleCallStart = () => {
      console.log("Vapi call started.");

      setCallStatus(CallStatus.ACTIVE);
    };

    const handleCallEnd = () => {
      console.log("Vapi call ended.");

      setCallStatus(CallStatus.FINISHED);
      setIsSpeaking(false);
    };

    const handleMessage = (message: unknown) => {
      if (!message || typeof message !== "object") {
        return;
      }

      const vapiMessage = message as Partial<VapiTranscriptMessage>;

      if (
        vapiMessage.type !== "transcript" ||
        vapiMessage.transcriptType !== "final" ||
        !vapiMessage.role ||
        !vapiMessage.transcript
      ) {
        return;
      }

      const newMessage: SavedMessage = {
        role: vapiMessage.role,
        content: vapiMessage.transcript,
      };

      setMessages((previousMessages) => [
        ...previousMessages,
        newMessage,
      ]);
    };

    const handleSpeechStart = () => {
      console.log("AI speech started.");

      setIsSpeaking(true);
    };

    const handleSpeechEnd = () => {
      console.log("AI speech ended.");

      setIsSpeaking(false);
    };

    const handleError = (error: unknown) => {
      console.error("Vapi error:", error);

      setCallStatus(CallStatus.FINISHED);
      setIsSpeaking(false);
    };

    vapi.on("call-start", handleCallStart);
    vapi.on("call-end", handleCallEnd);
    vapi.on("message", handleMessage);
    vapi.on("speech-start", handleSpeechStart);
    vapi.on("speech-end", handleSpeechEnd);
    vapi.on("error", handleError);

    return () => {
      vapi.off("call-start", handleCallStart);
      vapi.off("call-end", handleCallEnd);
      vapi.off("message", handleMessage);
      vapi.off("speech-start", handleSpeechStart);
      vapi.off("speech-end", handleSpeechEnd);
      vapi.off("error", handleError);
    };
  }, []);

  const lastMessage = messages[messages.length - 1]?.content ?? "";

  /**
   * Handle call completion.
   */
  useEffect(() => {
    if (callStatus !== CallStatus.FINISHED) {
      return;
    }

    // Generated interviews don't require feedback.
    if (type === "generate") {
      router.push("/");
      return;
    }

    // Don't generate empty feedback.
    if (messages.length === 0) {
      console.warn("No transcript messages found.");

      router.push("/");
      return;
    }

    void handleGenerateFeedback(messages);
  }, [
    callStatus,
    handleGenerateFeedback,
    messages,
    router,
    type,
  ]);

  /**
   * Start the interview call.
   */
  const handleCall = async () => {
    if (callStatus === CallStatus.CONNECTING) {
      return;
    }

    try {
      setCallStatus(CallStatus.CONNECTING);

      if (type === "generate") {
        const workflowId =
          process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID;

        if (!workflowId) {
          throw new Error(
            "NEXT_PUBLIC_VAPI_WORKFLOW_ID is not configured."
          );
        }

        await vapi.start(workflowId, {
          variableValues: {
            username: userName,
            userid: userId,
          },
        });

        return;
      }

      const formattedQuestions =
        questions?.map((question) => `- ${question}`).join("\n") ?? "";

      await vapi.start(interviewer, {
        variableValues: {
          questions: formattedQuestions,
        },
      });
    } catch (error: unknown) {
      console.error("Failed to start Vapi call:", error);

      setCallStatus(CallStatus.INACTIVE);
      setIsSpeaking(false);
    }
  };

  /**
   * End the current interview call.
   */
  const handleDisconnect = () => {
    if (callStatus !== CallStatus.ACTIVE) {
      return;
    }

    vapi.stop();

    setCallStatus(CallStatus.FINISHED);
    setIsSpeaking(false);
  };

  const isActive = callStatus === CallStatus.ACTIVE;
  const isConnecting = callStatus === CallStatus.CONNECTING;

  return (
    <>
      <div className="call-view">
        {/* AI Interviewer */}
        <div className="card-interviewer">
          <div className="avatar">
            <Image
              src="/ai-avatar.png"
              alt="AI interviewer"
              width={65}
              height={54}
              className="object-cover"
            />

            {isSpeaking && (
              <span className="animate-speak" />
            )}
          </div>

          <h3>AI Interviewer</h3>
        </div>

        {/* Candidate */}
        <div className="card-border">
          <div className="card-content">
            <Image
              src="/profile.svg"
              alt="Candidate profile"
              width={120}
              height={120}
              className="size-[120px] rounded-full object-cover"
            />

            <h3>{userName}</h3>
          </div>
        </div>
      </div>

      {/* Transcript */}
      {lastMessage && (
        <div className="transcript-border">
          <div className="transcript">
            <p
              key={lastMessage}
              className={cn(
                "opacity-0 transition-opacity duration-500",
                "animate-fadeIn opacity-100"
              )}
            >
              {lastMessage}
            </p>
          </div>
        </div>
      )}

      {/* Call button */}
      <div className="flex w-full justify-center">
        {!isActive ? (
          <button
            type="button"
            className="relative btn-call"
            onClick={handleCall}
            disabled={isConnecting}
          >
            <span
              className={cn(
                "absolute animate-ping rounded-full opacity-75",
                !isConnecting && "hidden"
              )}
            />

            <span className="relative">
              {isConnecting ? ". . ." : "Call"}
            </span>
          </button>
        ) : (
          <button
            type="button"
            className="btn-disconnect"
            onClick={handleDisconnect}
          >
            End
          </button>
        )}
      </div>
    </>
  );
};

export default Agent;