import { useState, type FormEvent } from "react";
import { createLocation } from "../api/locations";
import { createShift, updateShift } from "../api/shifts";
import type { EmployeeResponse, LocationResponse, ShiftResponse } from "../api/types";
import { extractErrorMessage } from "../api/errors";
import { toApiValue, toInputValue } from "../lib/week";

interface ShiftFormModalProps {
  employees: EmployeeResponse[];
  locations: LocationResponse[];
  editingShift: ShiftResponse | null;
  defaultStart?: string;
  onClose: () => void;
  onSaved: () => void;
  onLocationCreated: (location: LocationResponse) => void;
}

export function ShiftFormModal({
  employees,
  locations,
  editingShift,
  defaultStart,
  onClose,
  onSaved,
  onLocationCreated,
}: ShiftFormModalProps) {
  const [employeeId, setEmployeeId] = useState(String(editingShift?.employeeId ?? employees[0]?.id ?? ""));
  const [locationId, setLocationId] = useState(String(editingShift?.locationId ?? locations[0]?.id ?? ""));
  const [startTime, setStartTime] = useState(
    editingShift ? toInputValue(editingShift.startTime) : (defaultStart ?? ""),
  );
  const [endTime, setEndTime] = useState(editingShift ? toInputValue(editingShift.endTime) : "");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showNewLocation, setShowNewLocation] = useState(locations.length === 0);
  const [newLocationName, setNewLocationName] = useState("");
  const [isCreatingLocation, setIsCreatingLocation] = useState(false);

  async function handleAddLocation() {
    if (!newLocationName.trim()) return;
    setIsCreatingLocation(true);
    setError(null);
    try {
      const location = await createLocation({ name: newLocationName.trim() });
      onLocationCreated(location);
      setLocationId(String(location.id));
      setNewLocationName("");
      setShowNewLocation(false);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsCreatingLocation(false);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (!employeeId || !locationId || !startTime || !endTime) {
      setError("All fields are required.");
      return;
    }

    const request = {
      employeeId: Number(employeeId),
      locationId: Number(locationId),
      startTime: toApiValue(startTime),
      endTime: toApiValue(endTime),
    };

    setIsSubmitting(true);
    try {
      if (editingShift) {
        await updateShift(editingShift.id, request);
      } else {
        await createShift(request);
      }
      onSaved();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-slate-900/40 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          {editingShift ? "Edit shift" : "New shift"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="employeeId" className="mb-1 block text-sm font-medium text-slate-700">
              Employee
            </label>
            <select
              id="employeeId"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            >
              {employees.length === 0 && <option value="">No employees yet</option>}
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="locationId" className="mb-1 block text-sm font-medium text-slate-700">
              Location
            </label>
            {!showNewLocation ? (
              <div className="flex items-center gap-2">
                <select
                  id="locationId"
                  value={locationId}
                  onChange={(e) => setLocationId(e.target.value)}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                >
                  {locations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowNewLocation(true)}
                  className="whitespace-nowrap text-sm font-medium text-slate-600 underline"
                >
                  + New
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  value={newLocationName}
                  onChange={(e) => setNewLocationName(e.target.value)}
                  placeholder="Location name"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddLocation}
                  disabled={isCreatingLocation}
                  className="whitespace-nowrap rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                >
                  Add
                </button>
                {locations.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowNewLocation(false)}
                    className="whitespace-nowrap text-sm text-slate-500 underline"
                  >
                    Cancel
                  </button>
                )}
              </div>
            )}
          </div>

          <div>
            <label htmlFor="startTime" className="mb-1 block text-sm font-medium text-slate-700">
              Start
            </label>
            <input
              id="startTime"
              type="datetime-local"
              required
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="endTime" className="mb-1 block text-sm font-medium text-slate-700">
              End
            </label>
            <input
              id="endTime"
              type="datetime-local"
              required
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || employees.length === 0 || locations.length === 0}
              className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
            >
              {isSubmitting ? "Saving…" : "Save shift"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
