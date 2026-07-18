import { describe, expect, it } from "vitest";
import { COURSES, REQUIREMENTS } from "@/lib/catalog";
import { computeProgress } from "@/lib/progress";

describe("computeProgress", () => {
  it("starts at zero", () => {
    const p = computeProgress([], COURSES, REQUIREMENTS);
    expect(p.totalCounted).toBe(0);
    expect(p.percent).toBe(0);
    expect(p.remainingRequirements.core).toBe(30);
  });

  it("attributes AU to the right categories", () => {
    const p = computeProgress(
      ["CS1101", "MA1101", "GE1101", "CS2901"],
      COURSES,
      REQUIREMENTS
    );
    expect(p.byCategory.core.earned).toBe(3);
    expect(p.byCategory.mathematics.earned).toBe(3);
    expect(p.byCategory.general_elective.earned).toBe(3);
    expect(p.byCategory.laboratory.earned).toBe(3);
    expect(p.totalCounted).toBe(12);
  });

  it("ignores unknown course codes", () => {
    const p = computeProgress(["NOPE999"], COURSES, REQUIREMENTS);
    expect(p.totalCounted).toBe(0);
  });

  it("caps excess AU within a category", () => {
    // All four GE courses = 12 AU, requirement is 9.
    const p = computeProgress(
      ["GE1101", "GE1201", "GE2101", "GE2201"],
      COURSES,
      REQUIREMENTS
    );
    expect(p.byCategory.general_elective.earned).toBe(12);
    expect(p.byCategory.general_elective.counted).toBe(9);
    expect(p.remainingRequirements.general_elective).toBeUndefined();
  });

  it("reaches 100% when every requirement is met", () => {
    const all = COURSES.map((c) => c.course_code);
    const p = computeProgress(all, COURSES, REQUIREMENTS);
    expect(p.totalCounted).toBe(REQUIREMENTS.total_required_au);
    expect(p.percent).toBe(100);
    expect(Object.keys(p.remainingRequirements)).toHaveLength(0);
  });
});
