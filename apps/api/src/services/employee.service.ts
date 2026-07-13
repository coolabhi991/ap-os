import prisma from "../config/prisma.js";
import { Prisma, EmployeeStatus } from "@prisma/client";
import { getFinancialYear, padSeq } from "../utils/numbering.js";

export const EMPLOYEE_STATUSES = ["ACTIVE", "INACTIVE"];

export interface EmployeeFormInput {
  name: string;
  mobile?: string;
  designation?: string;
  department?: string;
  status?: string;
}

export interface EmployeeListQuery {
  search?: string;
  status?: string;
  department?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

function parseStatus(s: string | undefined): EmployeeStatus | undefined {
  return s && EMPLOYEE_STATUSES.includes(s.toUpperCase()) ? (s.toUpperCase() as EmployeeStatus) : undefined;
}

function toDTO(e: {
  id: string;
  companyId: string;
  name: string;
  code: string | null;
  mobile: string | null;
  designation: string | null;
  department: string | null;
  status: EmployeeStatus;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: e.id,
    companyId: e.companyId,
    name: e.name,
    code: e.code ?? "",
    mobile: e.mobile ?? "",
    designation: e.designation ?? "",
    department: e.department ?? "",
    status: e.status,
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
  };
}

export async function listEmployees(companyId: string, query: EmployeeListQuery) {
  const { search = "", status, department, page = 1, limit = 20, sortBy = "createdAt", sortOrder = "desc" } = query;

  const where: Prisma.EmployeeWhereInput = {
    companyId,
    ...(parseStatus(status) && { status: parseStatus(status) }),
    ...(department && { department }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { mobile: { contains: search, mode: "insensitive" } },
        { designation: { contains: search, mode: "insensitive" } },
      ],
    }),
  };

  const allowed = ["name", "designation", "department", "status", "createdAt"];
  const orderByField = allowed.includes(sortBy) ? sortBy : "createdAt";
  const skip = (Math.max(1, page) - 1) * Math.min(100, limit);
  const take = Math.min(100, limit);

  const [total, employees] = await Promise.all([
    prisma.employee.count({ where }),
    prisma.employee.findMany({ where, orderBy: { [orderByField]: sortOrder }, skip, take }),
  ]);

  return { total, page, limit: take, data: employees.map(toDTO) };
}

export async function getEmployeeById(id: string, companyId: string) {
  const employee = await prisma.employee.findFirst({ where: { id, companyId } });
  if (!employee) throw new Error("Employee not found");
  return toDTO(employee);
}

/**
 * System-generated, permanent, read-only Employee code (Document Numbering Standard) —
 * EMP/<FY>/<Seq>, sequential per company within the Financial Year of creation.
 */
async function generateEmployeeCode(companyId: string): Promise<string> {
  const fy = getFinancialYear(new Date());
  const count = await prisma.employee.count({ where: { companyId, code: { startsWith: `EMP/${fy}/` } } });
  return `EMP/${fy}/${padSeq(count + 1)}`;
}

export async function createEmployee(companyId: string, input: EmployeeFormInput) {
  if (!input.name?.trim()) throw new Error("Employee name is required");

  const code = await generateEmployeeCode(companyId);

  const employee = await prisma.employee.create({
    data: {
      companyId,
      name: input.name.trim(),
      code,
      mobile: input.mobile || null,
      designation: input.designation || null,
      department: input.department || null,
      status: parseStatus(input.status) ?? "ACTIVE",
    },
  });

  return toDTO(employee);
}

export async function updateEmployee(id: string, companyId: string, input: EmployeeFormInput) {
  const existing = await prisma.employee.findFirst({ where: { id, companyId } });
  if (!existing) throw new Error("Employee not found");
  if (!input.name?.trim()) throw new Error("Employee name is required");

  const employee = await prisma.employee.update({
    where: { id },
    data: {
      name: input.name.trim(),
      mobile: input.mobile || null,
      designation: input.designation || null,
      department: input.department || null,
      status: parseStatus(input.status) ?? existing.status,
    },
  });

  return toDTO(employee);
}

/** Blocked if the employee already has allocated transactions — deactivate instead, to keep transaction history readable. */
export async function deleteEmployee(id: string, companyId: string) {
  const existing = await prisma.employee.findFirst({ where: { id, companyId } });
  if (!existing) throw new Error("Employee not found");

  const allocationCount = await prisma.transactionAllocation.count({ where: { employeeId: id } });
  if (allocationCount > 0) {
    const deactivated = await prisma.employee.update({ where: { id }, data: { status: "INACTIVE" } });
    return { deleted: false, data: toDTO(deactivated) };
  }

  await prisma.employee.delete({ where: { id } });
  return { deleted: true, data: null };
}
