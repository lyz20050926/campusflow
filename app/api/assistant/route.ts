import { NextResponse } from "next/server";
import type { AssistantContext } from "@/lib/assistant";

const SYSTEM_PROMPT = `You are CampusFlow, a university course-planning assistant.

Only use the course, programme, and validation data provided by the
application.

Do not invent course details, prerequisites, schedules, or university
policies.

Explain rule-engine results clearly and suggest valid alternatives.

If information is missing, say that there is not enough verified data.`;

export async function POST(req: Request) {
  const { question, context } = (await req.json()) as {
    question: string;
    context: AssistantContext;
  };

  if (!question?.trim()) {
    return NextResponse.json({ error: "Question is required." }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ reply: mockReply(question, context), mock: true });
  }

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5",
        max_tokens: 700,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: `Application data (computed by the rule engine, not by you):\n${JSON.stringify(context, null, 2)}\n\nStudent question: ${question}`,
          },
        ],
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      return NextResponse.json(
        { error: `LLM request failed (${res.status}): ${detail.slice(0, 300)}` },
        { status: 502 }
      );
    }

    const data = (await res.json()) as {
      content: { type: string; text?: string }[];
    };
    const reply = data.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n");
    return NextResponse.json({ reply, mock: false });
  } catch (err) {
    return NextResponse.json(
      { error: `Could not reach the LLM API: ${String(err)}` },
      { status: 502 }
    );
  }
}

/**
 * Deterministic fallback used when no API key is configured, so the app is
 * fully usable offline. It only restates data computed by the rule engine.
 */
function mockReply(question: string, ctx: AssistantContext): string {
  const q = question.toLowerCase();
  const lines: string[] = ["(Mock mode — no API key configured.)", ""];

  if (q.includes("why") || q.includes("cannot") || q.includes("can't") || q.includes("warning")) {
    if (ctx.validation_warnings.length === 0) {
      lines.push("The rule engine found no problems with your current plan.");
    } else {
      lines.push("The rule engine reports these issues:");
      ctx.validation_warnings.forEach((w) => lines.push(`- ${w}`));
    }
    return lines.join("\n");
  }

  if (q.includes("heavy") || q.includes("workload") || q.includes("au")) {
    lines.push(`The semester limit is ${ctx.au_limit_per_semester} AU.`);
    for (const [sem, total] of Object.entries(ctx.semester_au_totals)) {
      lines.push(
        `- ${sem}: ${total} AU${total > ctx.au_limit_per_semester ? " — over the limit" : ""}`
      );
    }
    return lines.join("\n");
  }

  if (q.includes("requirement") || q.includes("graduat")) {
    lines.push(`Overall progress: ${ctx.overall_progress}.`);
    const remaining = Object.entries(ctx.remaining_requirements);
    if (remaining.length === 0) {
      lines.push("All category requirements are complete.");
    } else {
      lines.push("Remaining requirements:");
      remaining.forEach(([k, v]) => lines.push(`- ${k}: ${v} AU`));
    }
    return lines.join("\n");
  }

  if (q.includes("recommend") || q.includes("next") || q.includes("suggest") || q.includes("plan")) {
    if (ctx.top_recommendations.length === 0) {
      lines.push(
        "Select a career interest on the Recommendations page to get ranked suggestions."
      );
    } else {
      lines.push("Top rule-engine recommendations:");
      ctx.top_recommendations.slice(0, 5).forEach((r) => {
        lines.push(`- ${r.course} (score ${r.score})`);
        r.reasons.forEach((reason) => lines.push(`    • ${reason}`));
      });
    }
    return lines.join("\n");
  }

  lines.push(`Overall progress: ${ctx.overall_progress}.`);
  lines.push(
    `Completed courses: ${ctx.completed_courses.length ? ctx.completed_courses.join(", ") : "none yet"}.`
  );
  lines.push(
    ctx.validation_warnings.length
      ? `Your plan has ${ctx.validation_warnings.length} warning(s) — ask "why" for details.`
      : "Your plan currently has no validation warnings."
  );
  return lines.join("\n");
}
