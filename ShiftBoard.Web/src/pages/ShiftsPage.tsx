import { useEffect, useState } from "react";
import { getEmployees } from "../api/employees";
import { extractErrorMessage } from "../api/errors";
import { getLocations } from "../api/locations";
import { deleteShift, getShifts } from "../api/shifts";
import type { EmployeeResponse, LocationResponse, ShiftResponse } from "../api/types";
import { useAuth } from "../auth/useAuth";
import { addDays, formatDayHeading, formatTime, formatWeekRange, startOfWeek, toDateKey } from "../lib/week";
import { ShiftFormModal } from "../shifts/ShiftFormModal";

type FormState = { mode: "create" } | { mode: "edit"; shift: ShiftResponse } | null;

export function ShiftsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "Admin";

  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [shifts, setShifts] = useState<ShiftResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [employees, setEmployees] = useState<EmployeeResponse[]>([]);
  const [locations, setLocations] = useState<LocationResponse[]>([]);
  const [formState, setFormState] = useState<FormState>(null);

  const weekEnd = addDays(weekStart, 6);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  async function loadShifts() {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getShifts({ from: toDateKey(weekStart), to: toDateKey(weekEnd) });
      setShifts(data);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadShifts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStart]);

  async function openCreateForm() {
    if (employees.length === 0) {
      setEmployees(await getEmployees());
    }
    if (locations.length === 0) {
      setLocations(await getLocations());
    }
    setFormState({ mode: "create" });
  }

  async function openEditForm(shift: ShiftResponse) {
    if (employees.length === 0) {
      setEmployees(await getEmployees());
    }
    if (locations.length === 0) {
      setLocations(await getLocations());
    }
    setFormState({ mode: "edit", shift });
  }

  async function handleDelete(shift: ShiftResponse) {
    const confirmed = window.confirm(
      `Delete ${shift.employeeName}'s shift on ${formatDayHeading(new Date(shift.startTime))}?`,
    );
    if (!confirmed) return;

    try {
      await deleteShift(shift.id);
      await loadShifts();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  function shiftsForDay(day: Date): ShiftResponse[] {
    const key = toDateKey(day);
    return shifts
      .filter((s) => s.startTime.slice(0, 10) === key)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">This week's shifts</h1>
          <p className="text-sm text-slate-500">{formatWeekRange(weekStart)}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekStart(addDays(weekStart, -7))}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            ← Previous
          </button>
          <button
            onClick={() => setWeekStart(startOfWeek(new Date()))}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Today
          </button>
          <button
            onClick={() => setWeekStart(addDays(weekStart, 7))}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Next →
          </button>
          {isAdmin && (
            <button
              onClick={openCreateForm}
              className="ml-2 rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
            >
              + New shift
            </button>
          )}
        </div>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {isLoading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-7">
          {days.map((day) => (
            <div key={toDateKey(day)} className="rounded-lg border border-slate-200 bg-white p-3">
              <h3 className="mb-2 text-sm font-semibold text-slate-700">{formatDayHeading(day)}</h3>
              <div className="space-y-2">
                {shiftsForDay(day).length === 0 && <p className="text-xs text-slate-400">No shifts</p>}
                {shiftsForDay(day).map((shift) => (
                  <div key={shift.id} className="rounded-md border border-slate-200 p-2 text-xs">
                    <p className="font-medium text-slate-900">
                      {formatTime(shift.startTime)} – {formatTime(shift.endTime)}
                    </p>
                    <p className="text-slate-600">{shift.employeeName}</p>
                    <p className="text-slate-400">{shift.locationName}</p>
                    {isAdmin && (
                      <div className="mt-1 flex gap-2">
                        <button
                          onClick={() => openEditForm(shift)}
                          className="text-slate-600 underline hover:text-slate-900"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(shift)}
                          className="text-red-600 underline hover:text-red-800"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {formState && (
        <ShiftFormModal
          employees={employees}
          locations={locations}
          editingShift={formState.mode === "edit" ? formState.shift : null}
          onClose={() => setFormState(null)}
          onSaved={() => {
            setFormState(null);
            loadShifts();
          }}
          onLocationCreated={(location) => setLocations((prev) => [...prev, location])}
        />
      )}
    </div>
  );
}
