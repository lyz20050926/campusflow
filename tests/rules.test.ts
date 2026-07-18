import { describe, expect, it } from "vitest";
import { COURSES, SEMESTERS } from "@/lib/catalog";
import {
  findTimetableConflicts,
  timesOverlap,
  totalAcademicUnits,
  validateAuLimit,
  validateAvailability,
  validatePlan,
  validatePrerequisites,
} from "@/lib/rules";
import type { Plan } from "@/types";

describe("validatePrerequisites", () => {
  it("flags a missing prerequisite", () => {
    const result = validatePrerequisites("CS2101", [], COURSES);
    expect(result.valid).toBe(false);
    expect(result.missing_courses).toContain("CS1101");
    expect(result.message).toContain("CS1101");
  });

  it("passes when all prerequisites are completed", () => {
    const result = validatePrerequisites("CS2101", ["CS1101"], COURSES);
    expect(result.valid).toBe(true);
    expect(result.missing_courses).toHaveLength(0);
  });

  it("reports every missing prerequisite for multi-prereq courses", () => {
    const result = validatePrerequisites("CS3201", ["CS2102"], COURSES);
    expect(result.valid).toBe(false);
    expect(result.missing_courses).toEqual(["MA2101"]);
  });
});

describe("validateAvailability", () => {
  it("rejects a course in a semester it is not offered", () => {
    const result = validateAvailability("CS3202", 1, COURSES);
    expect(result.valid).toBe(false);
    expect(result.message).toContain("only offered in Semester 2");
  });

  it("accepts a course in an offered semester", () => {
    expect(validateAvailability("CS3202", 2, COURSES).valid).toBe(true);
  });
});

describe("academic unit limits", () => {
  it("sums academic units", () => {
    expect(totalAcademicUnits(["CS1101", "CS3101"], COURSES)).toBe(7);
  });

  it("flags a semester above the 21 AU limit", () => {
    const heavy = [
      "CS1101", "EE1101", "MA1101", "GE1101", "GE1201", "GE2101", "CS2901", "EE2901",
    ]; // 24 AU
    const result = validateAuLimit(heavy, COURSES);
    expect(result.valid).toBe(false);
    expect(result.total).toBe(24);
  });

  it("accepts a normal load", () => {
    expect(validateAuLimit(["CS1101", "MA1101"], COURSES).valid).toBe(true);
  });
});

describe("timetable conflicts", () => {
  it("detects overlap on the same day", () => {
    expect(
      timesOverlap(
        { day: "Monday", start_time: "10:00", end_time: "12:00" },
        { day: "Monday", start_time: "11:00", end_time: "13:00" }
      )
    ).toBe(true);
  });

  it("ignores identical times on different days", () => {
    expect(
      timesOverlap(
        { day: "Monday", start_time: "10:00", end_time: "12:00" },
        { day: "Tuesday", start_time: "10:00", end_time: "12:00" }
      )
    ).toBe(false);
  });

  it("treats back-to-back classes as non-conflicting", () => {
    expect(
      timesOverlap(
        { day: "Monday", start_time: "08:00", end_time: "10:00" },
        { day: "Monday", start_time: "10:00", end_time: "12:00" }
      )
    ).toBe(false);
  });

  it("finds the CS2101 / EE3201 Monday clash", () => {
    const conflicts = findTimetableConflicts(["CS2101", "EE3201"], COURSES);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].a.course_code).toBe("CS2101");
    expect(conflicts[0].b.course_code).toBe("EE3201");
  });
});

describe("validatePlan", () => {
  it("returns no issues for a valid plan", () => {
    const plan: Plan = { y2s1: ["CS2101", "MA2101"], y2s2: ["CS2104"] };
    const issues = validatePlan(plan, SEMESTERS, ["CS1101", "MA1101"], COURSES);
    expect(issues).toHaveLength(0);
  });

  it("accepts prerequisites satisfied by an earlier planned semester", () => {
    const plan: Plan = { y2s1: ["CS2101"], y2s2: ["CS2104"] };
    const issues = validatePlan(plan, SEMESTERS, ["CS1101"], COURSES);
    expect(issues).toHaveLength(0);
  });

  it("rejects a prerequisite planned in the same semester", () => {
    const plan: Plan = { y2s1: ["CS1101", "CS2101"] };
    const issues = validatePlan(plan, SEMESTERS, [], COURSES);
    expect(
      issues.some(
        (i) => i.type === "missing_prerequisite" && i.course_code === "CS2101"
      )
    ).toBe(true);
  });

  it("flags availability, conflicts, and duplicates together", () => {
    const plan: Plan = {
      y2s1: ["CS2101", "EE3201", "CS3202"], // clash + CS3202 not offered in sem 1
      y2s2: ["CS2101"], // duplicate
    };
    const issues = validatePlan(
      plan,
      SEMESTERS,
      ["CS1101", "MA1101", "MA1102", "EE2201"],
      COURSES
    );
    const types = issues.map((i) => i.type);
    expect(types).toContain("timetable_conflict");
    expect(types).toContain("not_offered");
    expect(types).toContain("duplicate_course");
  });

  it("warns when a semester exceeds the AU limit", () => {
    const plan: Plan = {
      y2s1: [
        "CS1101", "EE1101", "MA1101", "GE1101", "GE1201", "GE2101", "CS2901", "EE2901",
      ],
    };
    const issues = validatePlan(plan, SEMESTERS, [], COURSES);
    expect(issues.some((i) => i.type === "au_limit_exceeded")).toBe(true);
  });
});
