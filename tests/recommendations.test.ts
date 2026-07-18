import { describe, expect, it } from "vitest";
import { COURSES, REQUIREMENTS } from "@/lib/catalog";
import { recommendCourses, scoreCourse } from "@/lib/recommendations";

const base = {
  career: "artificial intelligence",
  completedCourses: ["CS1101", "MA1101", "CS2101", "CS2102", "MA2101"],
  plannedCourses: [] as string[],
  upcomingSemester: 1,
  catalog: COURSES,
  requirements: REQUIREMENTS,
};

describe("scoreCourse", () => {
  it("gives +3 +2 +1 to an eligible career-matching course", () => {
    const course = COURSES.find((c) => c.course_code === "CS3201")!;
    const rec = scoreCourse(course, base);
    // +3 career, +2 incomplete major elective requirement, +1 offered in sem 1
    expect(rec.score).toBe(6);
    expect(rec.missingPrerequisites).toHaveLength(0);
    expect(rec.reasons.join(" ")).toContain("artificial intelligence");
  });

  it("applies the -5 penalty for missing prerequisites", () => {
    const course = COURSES.find((c) => c.course_code === "CS3202")!;
    const rec = scoreCourse(course, base); // needs CS3201, not completed
    expect(rec.missingPrerequisites).toContain("CS3201");
    // +3 career, +2 requirement, +0 (sem 2 only), -5 prereq
    expect(rec.score).toBe(0);
  });
});

describe("recommendCourses", () => {
  it("returns at most five, sorted by score", () => {
    const recs = recommendCourses(base);
    expect(recs).toHaveLength(5);
    for (let i = 1; i < recs.length; i++) {
      expect(recs[i - 1].score).toBeGreaterThanOrEqual(recs[i].score);
    }
  });

  it("excludes completed and planned courses", () => {
    const recs = recommendCourses({ ...base, plannedCourses: ["CS3201"] });
    const codes = recs.map((r) => r.course.course_code);
    expect(codes).not.toContain("CS1101"); // completed
    expect(codes).not.toContain("CS3201"); // planned
  });

  it("provides a reason for every recommendation", () => {
    for (const rec of recommendCourses(base)) {
      expect(rec.reasons.length).toBeGreaterThan(0);
    }
  });
});
