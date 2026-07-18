/**
 * Builds the structured context sent to the AI assistant. The assistant only
 * explains data computed here by normal program logic — it never calculates
 * prerequisites, conflicts, or AU totals itself.
 */
import type { Course, DegreeRequirements, Plan, PlannedSemester } from "@/types";
import { computeProgress } from "@/lib/progress";
import { recommendCourses } from "@/lib/recommendations";
import { totalAcademicUnits, validatePlan, DEFAULT_AU_LIMIT } from "@/lib/rules";

export interface AssistantContext {
  programme_name: string;
  career_interest: string | null;
  completed_courses: string[];
  planned_courses: Record<string, string[]>;
  semester_au_totals: Record<string, number>;
  au_limit_per_semester: number;
  overall_progress: string;
  remaining_requirements: Record<string, number>;
  validation_warnings: string[];
  top_recommendations: { course: string; score: number; reasons: string[] }[];
}

/**
 * Generates a deterministic answer entirely in the browser. The response only
 * restates values already calculated by the rule engine, so no study-plan data
 * needs to leave the user's device.
 */
export function buildOfflineAssistantReply(
  question: string,
  ctx: AssistantContext
): string {
  const q = question.toLowerCase();
  const lines: string[] = ["(Offline mode)", ""];

  if (
    q.includes("why") ||
    q.includes("cannot") ||
    q.includes("can't") ||
    q.includes("warning")
  ) {
    if (ctx.validation_warnings.length === 0) {
      lines.push("The rule engine found no problems with your current plan.");
    } else {
      lines.push("The rule engine reports these issues:");
      ctx.validation_warnings.forEach((warning) => lines.push(`- ${warning}`));
    }
    return lines.join("\n");
  }

  if (q.includes("heavy") || q.includes("workload") || q.includes("au")) {
    lines.push(`The semester limit is ${ctx.au_limit_per_semester} AU.`);
    for (const [semester, total] of Object.entries(ctx.semester_au_totals)) {
      lines.push(
        `- ${semester}: ${total} AU${
          total > ctx.au_limit_per_semester ? " — over the limit" : ""
        }`
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
      remaining.forEach(([category, value]) =>
        lines.push(`- ${category}: ${value} AU`)
      );
    }
    return lines.join("\n");
  }

  if (
    q.includes("recommend") ||
    q.includes("next") ||
    q.includes("suggest") ||
    q.includes("plan")
  ) {
    if (ctx.top_recommendations.length === 0) {
      lines.push(
        "Select a career interest on the Recommendations page to get ranked suggestions."
      );
    } else {
      lines.push("Top rule-engine recommendations:");
      ctx.top_recommendations.slice(0, 5).forEach((recommendation) => {
        lines.push(`- ${recommendation.course} (score ${recommendation.score})`);
        recommendation.reasons.forEach((reason) =>
          lines.push(`    • ${reason}`)
        );
      });
    }
    return lines.join("\n");
  }

  lines.push(`Overall progress: ${ctx.overall_progress}.`);
  lines.push(
    `Completed courses: ${
      ctx.completed_courses.length ? ctx.completed_courses.join(", ") : "none yet"
    }.`
  );
  lines.push(
    ctx.validation_warnings.length
      ? `Your plan has ${ctx.validation_warnings.length} warning(s) — ask "why" for details.`
      : "Your plan currently has no validation warnings."
  );
  return lines.join("\n");
}

export function buildAssistantContext(
  completed: string[],
  plan: Plan,
  semesters: PlannedSemester[],
  career: string | null,
  catalog: Course[],
  requirements: DegreeRequirements
): AssistantContext {
  const progress = computeProgress(completed, catalog, requirements);
  const issues = validatePlan(plan, semesters, completed, catalog);

  const planned_courses: Record<string, string[]> = {};
  const semester_au_totals: Record<string, number> = {};
  for (const sem of semesters) {
    planned_courses[sem.label] = plan[sem.id] ?? [];
    semester_au_totals[sem.label] = totalAcademicUnits(
      plan[sem.id] ?? [],
      catalog
    );
  }

  const recommendations = career
    ? recommendCourses({
        career,
        completedCourses: completed,
        plannedCourses: Object.values(plan).flat(),
        upcomingSemester: semesters[0]?.semester ?? 1,
        catalog,
        requirements,
      })
    : [];

  return {
    programme_name: requirements.programme_name,
    career_interest: career,
    completed_courses: completed,
    planned_courses,
    semester_au_totals,
    au_limit_per_semester: DEFAULT_AU_LIMIT,
    overall_progress: `${progress.totalCounted} / ${progress.totalRequired} AU (${progress.percent}%)`,
    remaining_requirements: progress.remainingRequirements as Record<
      string,
      number
    >,
    validation_warnings: issues.map((i) => i.message),
    top_recommendations: recommendations.map((r) => ({
      course: `${r.course.course_code} – ${r.course.course_name}`,
      score: r.score,
      reasons: r.reasons,
    })),
  };
}
