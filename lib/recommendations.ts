/**
 * Rule-based recommendation scoring. The ranking is calculated entirely by
 * code — the LLM is never involved.
 *
 * Score:
 *   +3  matches the selected career interest
 *   +2  contributes to an incomplete degree requirement
 *   +1  offered in the upcoming semester
 *   -5  has missing prerequisites
 */
import type {
  Course,
  DegreeRequirements,
  Recommendation,
} from "@/types";
import { CATEGORY_TO_KEY, KEY_TO_LABEL } from "@/lib/catalog";
import { computeProgress } from "@/lib/progress";
import { validatePrerequisites } from "@/lib/rules";

export interface RecommendationInput {
  career: string;
  completedCourses: string[];
  plannedCourses: string[];
  upcomingSemester: number; // 1 or 2
  catalog: Course[];
  requirements: DegreeRequirements;
  topN?: number;
}

export function scoreCourse(
  course: Course,
  input: Omit<RecommendationInput, "topN">
): Recommendation {
  const { career, completedCourses, upcomingSemester, catalog, requirements } =
    input;
  const progress = computeProgress(completedCourses, catalog, requirements);
  const reasons: string[] = [];
  let score = 0;

  if (course.career_tags.includes(career)) {
    score += 3;
    reasons.push(`It matches your interest in ${career}.`);
  }

  const key = CATEGORY_TO_KEY[course.category];
  if (progress.remainingRequirements[key]) {
    score += 2;
    reasons.push(
      `It contributes to your incomplete ${KEY_TO_LABEL[key].toLowerCase()} requirement (${progress.remainingRequirements[key]} AU remaining).`
    );
  }

  if (course.offered_semesters.includes(upcomingSemester)) {
    score += 1;
    reasons.push(`It is offered next semester (Semester ${upcomingSemester}).`);
  }

  const prereq = validatePrerequisites(
    course.course_code,
    completedCourses,
    catalog
  );
  if (!prereq.valid) {
    score -= 5;
    reasons.push(
      `Missing prerequisite${prereq.missing_courses.length > 1 ? "s" : ""}: ${prereq.missing_courses.join(", ")}.`
    );
  } else if (course.prerequisites.length > 0) {
    reasons.push("You have completed all prerequisites.");
  }

  return {
    course,
    score,
    reasons,
    missingPrerequisites: prereq.missing_courses,
  };
}

export function recommendCourses(input: RecommendationInput): Recommendation[] {
  const { completedCourses, plannedCourses, catalog, topN = 5 } = input;
  const excluded = new Set([...completedCourses, ...plannedCourses]);

  return catalog
    .filter((course) => !excluded.has(course.course_code))
    .map((course) => scoreCourse(course, input))
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.course.course_code.localeCompare(b.course.course_code)
    )
    .slice(0, topN);
}
