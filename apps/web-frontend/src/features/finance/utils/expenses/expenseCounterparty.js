export function resolveExpenseCounterpartyLabel(row, { suppliers = [], users = [] } = {}) {
  if (!row) return '—';
  if (row.employeeId) {
    const employee = users.find((u) => String(u.id) === String(row.employeeId));
    if (employee?.fullName) return employee.fullName;
  }
  if (row.supplierId) {
    const supplier = suppliers.find((s) => String(s.id) === String(row.supplierId));
    if (supplier?.name) return supplier.name;
  }
  return '—';
}
