/**
 * Deterministic rule engine. No LLM is involved anywhere in this file —
 * every check is plain program logic over the course catalogue.
 */
import type {
  Course,
  Plan,
  PlannedSemester,
  Schedule,
  ValidationIssue,
} from "@/types";

export const DEFAULT_AU_LIMIT = 21;

/** Two class slots conflict when they share a day and their times overlap. */
export function timesOverlap(a: Schedule, b: Schedule): boolean {
  if (a.day !== b.day) return false;
  return a.start_time < b.end_time && b.start_time < a.end_time;
}

export interface PrerequisiteResult {
  valid: boolean;
  type: "missing_prerequisite";
  course_code: string;
  missing_courses: string[];
  message: string;
}

/**
 * A course can only be taken when every prerequisite was completed in an
 * earlier semester (or before the plan starts).
 */
export function validatePrerequisites(
  courseCode: string,
  completedCourses: string[],
  catalog: Course[]
): PrerequisiteResult {
  const course = catalog.find((c) => c.course_code === courseCode);
  const prerequisites = course?.prerequisites ?? [];
  const missing = prerequisites.filter((p) => !completedCourses.includes(p));
  return {
    valid: missing.length === 0,
    type: "missing_prerequisite",
    course_code: courseCode,
    missing_courses: missing,
    message:
      missing.length === 0
        ? `All prerequisites for ${courseCode} are satisfied.`
        : `${missing.join(", ")} must be completed before taking ${courseCode}.`,
  };
}

/** Checks whether a course is offered in the given semester (1 or 2). */
export function validateAvailability(
  courseCode: string,
  semester: number,
  catalog: Course[]
): { valid: boolean; message: string } {
  const course = catalog.find((c) => c.course_code === courseCode);
  if (!course) return { valid: false, message: `${courseCode} does not exist.` };
  const valid = course.offered_semesters.includes(semester);
  return {
    valid,
    message: valid
      ? `${courseCode} is offered in Semester ${semester}.`
      : `${courseCode} is only offered in Semester ${course.offered_semesters.join(" and Semester ")}.`,
  };
}

/** Total AU of a set of courses; codes not in the catalogue count as 0. */
export function totalAcademicUnits(codes: string[], catalog: Course[]): number {
  return codes.reduce((sum, code) => {
    const course = catalog.find((c) => c.course_code === code);
    return sum + (course?.academic_units ?? 0);
  }, 0);
}

export function validateAuLimit(
  codes: string[],
  catalog: Course[],
  limit: number = DEFAULT_AU_LIMIT
): { valid: boolean; total: number; limit: number; message: string } {
  const total = totalAcademicUnits(codes, catalog);
  return {
    valid: total <= limit,
    total,
    limit,
    message:
      total <= limit
        ? `${total} AU is within the ${limit} AU limit.`
        : `${total} AU exceeds the ${limit} AU semester limit.`,
  };
}

/** Every conflicting pair of courses within one semester. */
export function findTimetableConflicts(
  codes: string[],
  catalog: Course[]
): { a: Course; b: Course }[] {
  const courses = codes
    .map((code) => catalog.find((c) => c.course_code === code))
    .filter((c): c is Course => Boolean(c));
  const conflicts: { a: Course; b: Course }[] = [];
  for (let i = 0; i < courses.length; i++) {
    for (let j = i + 1; j < courses.length; j++) {
      if (timesOverlap(courses[i].schedule, courses[j].schedule)) {
        conflicts.push({ a: courses[i], b: courses[j] });
      }
    }
  }
  return conflicts;
}

/**
 * Validates a whole multi-semester plan and returns structured issues.
 * Prerequisites may be satisfied by completed courses or by courses planned
 * in strictly earlier semesters.
 */
export function validatePlan(
  plan: Plan,
  semesters: PlannedSemester[],
  completedCourses: string[],
  catalog: Course[],
  auLimit: number = DEFAULT_AU_LIMIT
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const availableBefore = new Set(completedCourses);
  const seenInPlan = new Set<string>();

  for (const sem of semesters) {
    const codes = plan[sem.id] ?? [];

    for (const code of codes) {
      const course = catalog.find((c) => c.course_code === code);
      if (!course) continue;

      if (completedCourses.includes(code)) {
        issues.push({
          valid: false,
          type: "already_completed",
          severity: "warning",
          semester_id: sem.id,
          course_code: code,
          message: `${code} is already completed and does not need to be planned.`,
        });
      }

      if (seenInPlan.has(code)) {
        issues.push({
          valid: false,
          type: "duplicate_course",
          severity: "error",
          semester_id: sem.id,
          course_code: code,
          message: `${code} appears more than once in the plan.`,
        });
      }
      seenInPlan.add(code);

      const prereq = validatePrerequisites(
        code,
        Array.from(availableBefore),
        catalog
      );
      if (!prereq.valid) {
        issues.push({
          valid: false,
          type: "missing_prerequisite",
          severity: "error",
          semester_id: sem.id,
          course_code: code,
          missing_courses: prereq.missing_courses,
          message: prereq.message,
        });
      }

      const availability = validateAvailability(code, sem.semester, catalog);
      if (!availability.valid) {
        issues.push({
          valid: false,
          type: "not_offered",
          severity: "error",
          semester_id: sem.id,
          course_code: code,
          message: availability.message,
        });
      }
    }

    const auCheck = validateAuLimit(codes, catalog, auLimit);
    if (!auCheck.valid) {
      issues.push({
        valid: false,
        type: "au_limit_exceeded",
        severity: "warning",
        semester_id: sem.id,
        message: `${sem.label} has ${auCheck.total} AU, which exceeds the ${auLimit} AU limit.`,
      });
    }

    for (const { a, b } of findTimetableConflicts(codes, catalog)) {
      issues.push({
        valid: false,
        type: "timetable_conflict",
        severity: "error",
        semester_id: sem.id,
        course_code: a.course_code,
        conflict_with: b.course_code,
        message: `${a.course_code} conflicts with ${b.course_code} on ${a.schedule.day} from ${a.schedule.start_time} to ${a.schedule.end_time}.`,
      });
    }

    // Courses in this semester become available for later semesters.
    codes.forEach((code) => availableBefore.add(code));
  }

  return issues;
}
