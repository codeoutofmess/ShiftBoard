import { useEffect, useState } from "react";
import { getEmployees } from "../api/employees";
import { extractErrorMessage } from "../api/errors";
import type { EmployeeResponse } from "../api/types";

export function EmployeesPage() {
  const [employees, setEmployees] = useState<EmployeeResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getEmployees()
      .then(setEmployees)
      .catch((err) => setError(extractErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-slate-900">Employees</h1>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      {isLoading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Email</th>
                <th className="px-4 py-2 font-medium">Role</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((employee) => (
                <tr key={employee.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-2 text-slate-900">{employee.name}</td>
                  <td className="px-4 py-2 text-slate-600">{employee.email}</td>
                  <td className="px-4 py-2 text-slate-600">{employee.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
