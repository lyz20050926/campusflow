import coursesJson from "@/data/courses.json";
import requirementsJson from "@/data/degree_requirements.json";
import type {
  Category,
  Course,
  DegreeRequirements,
  PlannedSemester,
  RequirementKey,
} from "@/types";

export const COURSES = coursesJson as unknown as Course[];
export const REQUIREMENTS = requirementsJson as unknown as DegreeRequirements;

const courseIndex = new Map(COURSES.map((c) => [c.course_code, c]));

export function getCourse(code: string): Course | undefined {
  return courseIndex.get(code);
}

export const CATEGORY_TO_KEY: Record<Category, RequirementKey> = {
  Core: "core",
  "Major Elective": "major_elective",
  "General Elective": "general_elective",
  Mathematics: "mathematics",
  Laboratory: "laboratory",
};

export const KEY_TO_LABEL: Record<RequirementKey, string> = {
  core: "Core",
  major_elective: "Major Electives",
  general_elective: "General Electives",
  mathematics: "Mathematics",
  laboratory: "Laboratory",
};

export const CATEGORIES: Category[] = [
  "Core",
  "Major Elective",
  "General Elective",
  "Mathematics",
  "Laboratory",
];

export const CAREERS = [
  "artificial intelligence",
  "software engineering",
  "data science",
  "telecommunications",
  "embedded systems",
];

/** The future semesters shown in the planner, in chronological order. */
export const SEMESTERS: PlannedSemester[] = [
  { id: "y2s1", label: "Year 2 Semester 1", semester: 1 },
  { id: "y2s2", label: "Year 2 Semester 2", semester: 2 },
  { id: "y3s1", label: "Year 3 Semester 1", semester: 1 },
  { id: "y3s2", label: "Year 3 Semester 2", semester: 2 },
];
