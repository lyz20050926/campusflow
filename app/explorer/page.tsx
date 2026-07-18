"use client";

import { useMemo, useState } from "react";
import CourseCard from "@/components/CourseCard";
import { CAREERS, CATEGORIES, COURSES } from "@/lib/catalog";

export default function ExplorerPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [semester, setSemester] = useState("all");
  const [career, setCareer] = useState("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return COURSES.filter((c) => {
      if (
        q &&
        !c.course_code.toLowerCase().includes(q) &&
        !c.course_name.toLowerCase().includes(q)
      )
        return false;
      if (category !== "all" && c.category !== category) return false;
      if (semester !== "all" && !c.offered_semesters.includes(Number(semester)))
        return false;
      if (career !== "all" && !c.career_tags.includes(career)) return false;
      return true;
    });
  }, [query, category, semester, career]);

  const selectClass =
    "rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm";

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Course Explorer</h1>

      <div className="flex flex-wrap items-center gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by course code or name…"
          className="w-64 rounded-md border border-slate-300 px-3 py-1.5 text-sm"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className={selectClass}
        >
          <option value="all">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select
          value={semester}
          onChange={(e) => setSemester(e.target.value)}
          className={selectClass}
        >
          <option value="all">Any semester</option>
          <option value="1">Semester 1</option>
          <option value="2">Semester 2</option>
        </select>
        <select
          value={career}
          onChange={(e) => setCareer(e.target.value)}
          className={selectClass}
        >
          <option value="all">Any career interest</option>
          {CAREERS.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <span className="text-sm text-slate-500">
          {filtered.length} course{filtered.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((course) => (
          <CourseCard key={course.course_code} course={course} />
        ))}
      </div>
    </div>
  );
}
