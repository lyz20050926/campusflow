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
