export type Category =
  | "Core"
  | "Major Elective"
  | "General Elective"
  | "Mathematics"
  | "Laboratory";

export type RequirementKey =
  | "core"
  | "major_elective"
  | "general_elective"
  | "mathematics"
  | "laboratory";

export interface Schedule {
  day: string;
  start_time: string; // "HH:MM", 24-hour
  end_time: string;
}

export interface Course {
  course_code: string;
  course_name: string;
  description: string;
  academic_units: number;
  category: Category;
  offered_semesters: number[]; // 1 = Semester 1, 2 = Semester 2
  prerequisites: string[];
  career_tags: string[];
  schedule: Schedule;
}

export interface DegreeRequirements {
  programme_name: string;
  total_required_au: number;
  max_au_per_semester: number;
  requirements: Record<RequirementKey, number>;
}

export interface PlannedSemester {
  id: string;
  label: string; // e.g. "Year 2 Semester 1"
  semester: number; // 1 or 2 — used for availability checks
}

/** Maps semester id -> list of course codes planned for that semester. */
export type Plan = Record<string, string[]>;

export type IssueType =
  | "missing_prerequisite"
  | "au_limit_exceeded"
  | "not_offered"
  | "timetable_conflict"
  | "duplicate_course"
  | "already_completed";

export interface ValidationIssue {
  valid: false;
  type: IssueType;
  severity: "error" | "warning";
  semester_id?: string;
  course_code?: string;
  missing_courses?: string[];
  conflict_with?: string;
  message: string;
}

export interface CategoryProgress {
  earned: number; // raw AU earned in the category
  counted: number; // AU counted toward the degree (capped at required)
  required: number;
}

export interface DegreeProgress {
  byCategory: Record<RequirementKey, CategoryProgress>;
  totalCounted: number;
  totalRequired: number;
  percent: number;
  remainingRequirements: Partial<Record<RequirementKey, number>>;
}

export interface Recommendation {
  course: Course;
  score: number;
  reasons: string[];
  missingPrerequisites: string[];
}
