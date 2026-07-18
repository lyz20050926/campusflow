"use client";

import { useState } from "react";
import { usePlanner } from "@/components/PlannerContext";
import {
  buildAssistantContext,
  buildOfflineAssistantReply,
} from "@/lib/assistant";
import { COURSES, REQUIREMENTS, SEMESTERS } from "@/lib/catalog";

interface Message {
  role: "user" | "assistant";
  text: string;
}

const SUGGESTIONS = [
  "Why can I not take this course?",
  "Which course should I take next?",
  "Is my semester too heavy?",
  "Which graduation requirements are incomplete?",
  "Suggest an AI-focused semester plan.",
];

export default function AssistantPage() {
  const { completed, plan, career, ready } = usePlanner();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  if (!ready) return null;

  function ask(question: string) {
    if (!question.trim()) return;
    setMessages((m) => [...m, { role: "user", text: question }]);
    setInput("");
    const context = buildAssistantContext(
      completed,
      plan,
      SEMESTERS,
      career,
      COURSES,
      REQUIREMENTS
    );
    setMessages((m) => [
      ...m,
      {
        role: "assistant",
        text: buildOfflineAssistantReply(question, context),
      },
    ]);
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold">AI Assistant</h1>
        <p className="text-sm text-slate-500">
          The assistant explains results from the rule engine. It runs entirely
          in your browser, so your study-plan data never leaves your device.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => ask(s)}
            className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs hover:bg-slate-50"
          >
            {s}
          </button>
        ))}
      </div>

      <div className="min-h-[300px] space-y-3 rounded-lg border border-slate-200 bg-white p-4">
        {messages.length === 0 && (
          <p className="text-sm text-slate-400">
            Ask a question about your plan, or pick a suggestion above.
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`whitespace-pre-wrap rounded-lg px-3 py-2 text-sm ${
              m.role === "user"
                ? "ml-8 bg-indigo-600 text-white"
                : "mr-8 bg-slate-100 text-slate-800"
            }`}
          >
            {m.text}
            {m.role === "assistant" && (
              <div className="mt-1 text-xs opacity-60">
                Offline response — generated in your browser.
              </div>
            )}
          </div>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
        className="flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your study plan…"
          className="grow rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          Send
        </button>
      </form>
    </div>
  );
}
