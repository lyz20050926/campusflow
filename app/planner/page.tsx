"use client";

import { useState } from "react";
import { usePlanner } from "@/components/PlannerContext";
import { COURSES, SEMESTERS, getCourse } from "@/lib/catalog";
import {
  DEFAULT_AU_LIMIT,
  totalAcademicUnits,
  validatePlan,
} from "@/lib/rules";

export default function PlannerPage() {
  const {
    completed,
    plan,
    addToSemester,
    removeFromSemester,
    moveCourse,
    ready,
  } = usePlanner();
  const [pending, setPending] = useState<Record<string, string>>({});
  if (!ready) return null;

  const issues = validatePlan(plan, SEMESTERS, completed, COURSES);
  const plannedAll = new Set(Object.values(plan).flat());
  const addable = COURSES.filter(
    (c) => !completed.includes(c.course_code) && !plannedAll.has(c.course_code)
  );

  const issuesFor = (semesterId: string, code?: string) =>
    issues.filter(
      (i) =>
        i.semester_id === semesterId &&
        (code === undefined
          ? i.course_code === undefined
          : i.course_code === code)
    );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Semester Planner</h1>
        <p className="text-sm text-slate-500">
          Semester limit: {DEFAULT_AU_LIMIT} AU. Warnings update automatically
          as you edit the plan.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {SEMESTERS.map((sem) => {
          const codes = plan[sem.id] ?? [];
          const total = totalAcademicUnits(codes, COURSES);
          const overLimit = total > DEFAULT_AU_LIMIT;
          return (
            <div
              key={sem.id}
              className="flex flex-col rounded-lg border border-slate-200 bg-white p-4"
            >
              <div className="mb-3 flex items-baseline justify-between">
                <h2 className="font-semibold">{sem.label}</h2>
                <span
                  className={`text-sm font-medium ${overLimit ? "text-red-600" : "text-slate-500"}`}
                >
                  {total} AU
                </span>
              </div>

              <div className="grow space-y-2">
                {codes.length === 0 && (
                  <p className="text-sm text-slate-400">No courses planned.</p>
                )}
                {codes.map((code) => {
                  const course = getCourse(code);
                  const courseIssues = issuesFor(sem.id, code);
                  return (
                    <div
                      key={code}
                      className={`rounded-md border p-2 text-sm ${
                        courseIssues.some((i) => i.severity === "error")
                          ? "border-red-300 bg-red-50"
                          : "border-slate-200 bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-medium">
                          {code}
                          <span className="ml-1 font-normal text-slate-500">
                            {course?.academic_units} AU
                          </span>
                        </span>
                        <div className="flex items-center gap-1">
                          <select
                            aria-label={`Move ${code}`}
                            value={sem.id}
                            onChange={(e) =>
                              moveCourse(sem.id, e.target.value, code)
                            }
                            className="rounded border border-slate-300 bg-white px-1 py-0.5 text-xs"
                          >
                            {SEMESTERS.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.label.replace("Year ", "Y").replace(" Semester ", "S")}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => removeFromSemester(sem.id, code)}
                            className="rounded border border-slate-300 bg-white px-1.5 py-0.5 text-xs text-red-600 hover:bg-red-50"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                      <div className="text-xs text-slate-500">
                        {course?.course_name}
                      </div>
                      {courseIssues.map((issue, i) => (
                        <div
                          key={i}
                          className={`mt-1 text-xs ${issue.severity === "error" ? "text-red-600" : "text-amber-600"}`}
                        >
                          ⚠ {issue.message}
                        </div>
                      ))}
                    </div>
                  );
                })}
                {issuesFor(sem.id).map((issue, i) => (
                  <div key={i} className="text-xs text-amber-600">
                    ⚠ {issue.message}
                  </div>
                ))}
              </div>

              <div className="mt-3 flex gap-1">
                <select
                  value={pending[sem.id] ?? ""}
                  onChange={(e) =>
                    setPending((p) => ({ ...p, [sem.id]: e.target.value }))
                  }
                  className="min-w-0 grow rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs"
                >
                  <option value="">Add course…</option>
                  {addable.map((c) => (
                    <option key={c.course_code} value={c.course_code}>
                      {c.course_code} – {c.course_name}
                    </option>
                  ))}
                </select>
                <button
                  disabled={!pending[sem.id]}
                  onClick={() => {
                    addToSemester(sem.id, pending[sem.id]);
                    setPending((p) => ({ ...p, [sem.id]: "" }));
                  }}
                  className="rounded-md bg-indigo-600 px-2.5 py-1.5 text-xs font-medium text-white disabled:opacity-40"
                >
                  Add
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
