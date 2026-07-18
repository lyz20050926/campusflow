"use client";

import Link from "next/link";
import ProgressBar from "@/components/ProgressBar";
import { usePlanner } from "@/components/PlannerContext";
import { COURSES, KEY_TO_LABEL, REQUIREMENTS, SEMESTERS } from "@/lib/catalog";
import { computeProgress } from "@/lib/progress";
import { validatePlan } from "@/lib/rules";
import type { RequirementKey } from "@/types";

export default function DashboardPage() {
  const { completed, plan, ready } = usePlanner();
  if (!ready) return null;

  const progress = computeProgress(completed, COURSES, REQUIREMENTS);
  const issues = validatePlan(plan, SEMESTERS, completed, COURSES);
  const remainingCourses = COURSES.filter(
    (c) => !completed.includes(c.course_code)
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-slate-500">{REQUIREMENTS.programme_name}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="text-3xl font-bold text-indigo-700">
            {progress.totalCounted}
            <span className="text-lg font-normal text-slate-400">
              {" "}
              / {progress.totalRequired} AU
            </span>
          </div>
          <div className="text-sm text-slate-500">Completed academic units</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="text-3xl font-bold text-indigo-700">
            {progress.percent}%
          </div>
          <div className="text-sm text-slate-500">Degree completion</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="text-3xl font-bold text-indigo-700">
            {remainingCourses}
          </div>
          <div className="text-sm text-slate-500">
            Catalogue courses not yet completed
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="mb-4 font-semibold">Requirement progress</h2>
        <div className="space-y-4">
          {(Object.keys(progress.byCategory) as RequirementKey[]).map((key) => (
            <ProgressBar
              key={key}
              label={KEY_TO_LABEL[key]}
              value={progress.byCategory[key].counted}
              max={progress.byCategory[key].required}
            />
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="mb-3 font-semibold">Plan warnings</h2>
        {issues.length === 0 ? (
          <p className="text-sm text-slate-500">
            No problems detected in your current plan.{" "}
            <Link href="/planner" className="text-indigo-600 underline">
              Open the planner
            </Link>{" "}
            to add courses.
          </p>
        ) : (
          <ul className="space-y-2">
            {issues.map((issue, i) => (
              <li
                key={i}
                className={`rounded-md px-3 py-2 text-sm ${
                  issue.severity === "error"
                    ? "bg-red-50 text-red-700"
                    : "bg-amber-50 text-amber-700"
                }`}
              >
                {issue.message}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
