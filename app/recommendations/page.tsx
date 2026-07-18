"use client";

import { usePlanner } from "@/components/PlannerContext";
import { CAREERS, COURSES, REQUIREMENTS } from "@/lib/catalog";
import { recommendCourses } from "@/lib/recommendations";

export default function RecommendationsPage() {
  const { completed, plan, career, setCareer, ready } = usePlanner();
  if (!ready) return null;

  const recommendations = career
    ? recommendCourses({
        career,
        completedCourses: completed,
        plannedCourses: Object.values(plan).flat(),
        upcomingSemester: 1,
        catalog: COURSES,
        requirements: REQUIREMENTS,
      })
    : [];

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Recommendations</h1>
        <p className="text-sm text-slate-500">
          Transparent, rule-based scoring — no AI involved in the ranking.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {CAREERS.map((c) => (
          <button
            key={c}
            onClick={() => setCareer(c)}
            className={`rounded-full px-4 py-1.5 text-sm capitalize ${
              career === c
                ? "bg-indigo-600 text-white"
                : "border border-slate-300 bg-white hover:bg-slate-50"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {!career ? (
        <p className="text-sm text-slate-500">
          Select a career interest to see your top five recommended courses.
        </p>
      ) : (
        <div className="space-y-3">
          {recommendations.map((rec, i) => (
            <div
              key={rec.course.course_code}
              className="rounded-lg border border-slate-200 bg-white p-4"
            >
              <div className="flex items-start justify-between">
                <h3 className="font-semibold">
                  <span className="mr-2 text-slate-400">#{i + 1}</span>
                  {rec.course.course_code} – {rec.course.course_name}
                </h3>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    rec.score > 0
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  Score: {rec.score}
                </span>
              </div>
              <div className="mt-1 text-sm text-slate-500">
                {rec.course.academic_units} AU · {rec.course.category} · Sem{" "}
                {rec.course.offered_semesters.join(" & ")}
              </div>
              <ul className="mt-2 list-disc space-y-0.5 pl-5 text-sm text-slate-600">
                {rec.reasons.map((r, j) => (
                  <li key={j}>{r}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
