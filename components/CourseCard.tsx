"use client";

import { useState } from "react";
import type { Course } from "@/types";
import { usePlanner } from "@/components/PlannerContext";

const categoryColors: Record<string, string> = {
  Core: "bg-indigo-100 text-indigo-800",
  "Major Elective": "bg-purple-100 text-purple-800",
  "General Elective": "bg-emerald-100 text-emerald-800",
  Mathematics: "bg-amber-100 text-amber-800",
  Laboratory: "bg-rose-100 text-rose-800",
};

export default function CourseCard({ course }: { course: Course }) {
  const { completed, plan, toggleCompleted } = usePlanner();
  const [open, setOpen] = useState(false);
  const isCompleted = completed.includes(course.course_code);
  const isPlanned = Object.values(plan).some((codes) =>
    codes.includes(course.course_code)
  );

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-mono text-sm text-slate-500">
            {course.course_code}
          </div>
          <h3 className="font-semibold">{course.course_name}</h3>
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${categoryColors[course.category]}`}
        >
          {course.category}
        </span>
      </div>

      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
        <span>{course.academic_units} AU</span>
        <span>Sem {course.offered_semesters.join(" & ")}</span>
        <span>
          Prereq:{" "}
          {course.prerequisites.length ? course.prerequisites.join(", ") : "None"}
        </span>
      </div>

      {course.career_tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {course.career_tags.map((t) => (
            <span
              key={t}
              className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600"
            >
              {t}
            </span>
          ))}
        </div>
      )}

      {open && (
        <div className="mt-3 space-y-1 border-t border-slate-100 pt-3 text-sm text-slate-600">
          <p>{course.description}</p>
          <p>
            <span className="font-medium">Schedule:</span> {course.schedule.day}{" "}
            {course.schedule.start_time}–{course.schedule.end_time}
          </p>
        </div>
      )}

      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={() => setOpen((o) => !o)}
          className="rounded-md border border-slate-300 px-2.5 py-1 text-xs hover:bg-slate-50"
        >
          {open ? "Hide details" : "Details"}
        </button>
        <button
          onClick={() => toggleCompleted(course.course_code)}
          className={`rounded-md px-2.5 py-1 text-xs font-medium ${
            isCompleted
              ? "bg-emerald-600 text-white hover:bg-emerald-700"
              : "border border-slate-300 hover:bg-slate-50"
          }`}
        >
          {isCompleted ? "✓ Completed" : "Mark completed"}
        </button>
        {isPlanned && (
          <span className="text-xs font-medium text-indigo-600">Planned</span>
        )}
      </div>
    </div>
  );
}
