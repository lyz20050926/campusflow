import type {
  Course,
  DegreeProgress,
  DegreeRequirements,
  RequirementKey,
} from "@/types";
import { CATEGORY_TO_KEY } from "@/lib/catalog";

const KEYS: RequirementKey[] = [
  "core",
  "major_elective",
  "general_elective",
  "mathematics",
  "laboratory",
];

/**
 * Computes degree progress from completed courses.
 * AU earned beyond a category's requirement does not count toward the total
 * (documented simplification for this fictional programme).
 */
export function computeProgress(
  completedCourses: string[],
  catalog: Course[],
  requirements: DegreeRequirements
): DegreeProgress {
  const earned: Record<RequirementKey, number> = {
    core: 0,
    major_elective: 0,
    general_elective: 0,
    mathematics: 0,
    laboratory: 0,
  };

  for (const code of completedCourses) {
    const course = catalog.find((c) => c.course_code === code);
    if (!course) continue;
    earned[CATEGORY_TO_KEY[course.category]] += course.academic_units;
  }

  const byCategory = {} as DegreeProgress["byCategory"];
  const remainingRequirements: DegreeProgress["remainingRequirements"] = {};
  let totalCounted = 0;

  for (const key of KEYS) {
    const required = requirements.requirements[key];
    const counted = Math.min(earned[key], required);
    byCategory[key] = { earned: earned[key], counted, required };
    totalCounted += counted;
    if (counted < required) remainingRequirements[key] = required - counted;
  }

  return {
    byCategory,
    totalCounted,
    totalRequired: requirements.total_required_au,
    percent: Math.round((totalCounted / requirements.total_required_au) * 100),
    remainingRequirements,
  };
}
