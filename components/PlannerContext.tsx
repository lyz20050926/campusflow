"use client";

import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import type { Plan } from "@/types";
import { SEMESTERS } from "@/lib/catalog";

const STORAGE_KEY = "campusflow-state-v1";

interface StoredState {
  completed: string[];
  plan: Plan;
  career: string | null;
}

interface PlannerContextValue extends StoredState {
  ready: boolean;
  toggleCompleted: (code: string) => void;
  addToSemester: (semesterId: string, code: string) => void;
  removeFromSemester: (semesterId: string, code: string) => void;
  moveCourse: (fromId: string, toId: string, code: string) => void;
  setCareer: (career: string | null) => void;
  resetAll: () => void;
}

const emptyPlan = (): Plan =>
  Object.fromEntries(SEMESTERS.map((s) => [s.id, [] as string[]]));

const PlannerContext = createContext<PlannerContextValue | null>(null);

export function PlannerProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StoredState>({
    completed: [],
    plan: emptyPlan(),
    career: null,
  });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<StoredState>;
        setState({
          completed: parsed.completed ?? [],
          plan: { ...emptyPlan(), ...(parsed.plan ?? {}) },
          career: parsed.career ?? null,
        });
      }
    } catch {
      // Corrupt storage — start fresh.
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, ready]);

  const toggleCompleted = (code: string) =>
    setState((s) => ({
      ...s,
      completed: s.completed.includes(code)
        ? s.completed.filter((c) => c !== code)
        : [...s.completed, code],
      // Marking a course completed removes it from the plan.
      plan: s.completed.includes(code)
        ? s.plan
        : Object.fromEntries(
            Object.entries(s.plan).map(([k, v]) => [
              k,
              v.filter((c) => c !== code),
            ])
          ),
    }));

  const addToSemester = (semesterId: string, code: string) =>
    setState((s) => {
      const alreadyPlanned = Object.values(s.plan).some((codes) =>
        codes.includes(code)
      );
      if (alreadyPlanned || s.completed.includes(code)) return s;
      return {
        ...s,
        plan: { ...s.plan, [semesterId]: [...(s.plan[semesterId] ?? []), code] },
      };
    });

  const removeFromSemester = (semesterId: string, code: string) =>
    setState((s) => ({
      ...s,
      plan: {
        ...s.plan,
        [semesterId]: (s.plan[semesterId] ?? []).filter((c) => c !== code),
      },
    }));

  const moveCourse = (fromId: string, toId: string, code: string) =>
    setState((s) => {
      if (fromId === toId) return s;
      return {
        ...s,
        plan: {
          ...s.plan,
          [fromId]: (s.plan[fromId] ?? []).filter((c) => c !== code),
          [toId]: [...(s.plan[toId] ?? []), code],
        },
      };
    });

  const setCareer = (career: string | null) =>
    setState((s) => ({ ...s, career }));

  const resetAll = () =>
    setState({ completed: [], plan: emptyPlan(), career: null });

  return (
    <PlannerContext.Provider
      value={{
        ...state,
        ready,
        toggleCompleted,
        addToSemester,
        removeFromSemester,
        moveCourse,
        setCareer,
        resetAll,
      }}
    >
      {children}
    </PlannerContext.Provider>
  );
}

export function usePlanner(): PlannerContextValue {
  const ctx = useContext(PlannerContext);
  if (!ctx) throw new Error("usePlanner must be used inside PlannerProvider");
  return ctx;
}
