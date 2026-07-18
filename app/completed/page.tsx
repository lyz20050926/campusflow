"use client";

import { useState } from "react";
import { usePlanner } from "@/components/PlannerContext";
import { COURSES, REQUIREMENTS, getCourse } from "@/lib/catalog";
import { computeProgress } from "@/lib/progress";
import { totalAcademicUnits } from "@/lib/rules";

export default function CompletedPage() {
  const { completed, toggleCompleted, ready } = usePlanner();
  const [selected, setSelected] = useState("");
  if (!ready) return null;

  const available = COURSES.filter((c) => !completed.includes(c.course_code));
  const progress = computeProgress(completed, COURSES, REQUIREMENTS);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Completed Courses</h1>
        <p className="text-sm text-slate-500">
          {completed.length} courses · {totalAcademicUnits(completed, COURSES)}{" "}
          AU earned · {progress.percent}% of the degree
        </p>
      </div>

      <div className="flex gap-2">
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="grow rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
        >
          <option value="">Select a course to add…</option>
          {available.map((c) => (
            <option key={c.course_code} value={c.course_code}>
              {c.course_code} – {c.course_name} ({c.academic_units} AU)
            </option>
          ))}
        </select>
        <button
          disabled={!selected}
          onClick={() => {
            if (selected) toggleCompleted(selected);
            setSelected("");
          }}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          Add
        </button>
      </div>

      {completed.length === 0 ? (
        <p className="text-sm text-slate-500">
          No completed courses yet. Add them above or from the Course Explorer.
        </p>
      ) : (
        <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
          {completed.map((code) => {
            const course = getCourse(code);
            if (!course) return null;
            return (
              <li
                key={code}
                className="flex items-center justify-between px-4 py-3"
              >
                <div>
                  <span className="font-mono text-sm text-slate-500">
                    {code}
                  </span>{" "}
                  <span className="font-medium">{course.course_name}</span>
                  <span className="ml-2 text-sm text-slate-500">
                    {course.academic_units} AU · {course.category}
                  </span>
                </div>
                <button
                  onClick={() => toggleCompleted(code)}
                  className="rounded-md border border-slate-300 px-2.5 py-1 text-xs text-red-600 hover:bg-red-50"
                >
                  Remove
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
