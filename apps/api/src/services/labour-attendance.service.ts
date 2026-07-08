import prisma from "../config/prisma.js";
import { Prisma, AttendanceStatus } from "@prisma/client";
import { getCurrentWageRate } from "./labour-wage-rate.service.js";

const ATTENDANCE_STATUSES: AttendanceStatus[] = ["PRESENT", "ABSENT", "HALF_DAY", "ON_LEAVE"];

function parseStatus(s: string | undefined): AttendanceStatus {
  const upper = (s ?? "").trim().toUpperCase() as AttendanceStatus;
  return ATTENDANCE_STATUSES.includes(upper) ? upper : "PRESENT";
}

function computeWage(status: AttendanceStatus, dailyWage: number, overtimeRate: number, overtimeHours: number) {
  const baseMultiplier = status === "PRESENT" ? 1 : status === "HALF_DAY" ? 0.5 : 0;
  const base = dailyWage * baseMultiplier;
  const overtime = baseMultiplier > 0 ? overtimeHours * overtimeRate : 0;
  return base + overtime;
}

export interface AttendanceEntryInput {
  labourId: string;
  status: string;
  overtimeHours?: number;
  remarks?: string;
}

export interface MarkAttendanceInput extends AttendanceEntryInput {
  projectId: string;
  attendanceDate?: string;
}

export interface BulkMarkAttendanceInput {
  projectId: string;
  attendanceDate?: string;
  entries: AttendanceEntryInput[];
}

export interface AttendanceUpdateInput {
  status?: string;
  overtimeHours?: number;
  remarks?: string;
}

export interface LabourAttendanceListQuery {
  search?: string;
  projectId?: string;
  labourId?: string;
  groupId?: string;
  status?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

const include = {
  project: { select: { id: true, name: true } },
  labour: { select: { id: true, name: true, category: true, contractorId: true, groupId: true } },
  createdBy: { select: { id: true, name: true } },
};

type AttendanceRow = Prisma.LabourAttendanceGetPayload<{ include: typeof include }>;

function toDTO(a: AttendanceRow) {
  return {
    id: a.id,
    companyId: a.companyId,
    projectId: a.projectId,
    project: a.project,
    labourId: a.labourId,
    labour: a.labour,
    attendanceDate: a.attendanceDate.toISOString().slice(0, 10),
    status: a.status,
    overtimeHours: a.overtimeHours.toString(),
    dailyWageSnapshot: a.dailyWageSnapshot.toString(),
    overtimeRateSnapshot: a.overtimeRateSnapshot.toString(),
    wageAmount: a.wageAmount.toString(),
    remarks: a.remarks ?? "",
    createdById: a.createdById,
    createdBy: a.createdBy,
    isDeleted: a.isDeleted,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  };
}

async function markOne(
  companyId: string,
  createdById: string,
  projectId: string,
  attendanceDate: Date,
  entry: AttendanceEntryInput
) {
  const labour = await prisma.labour.findFirst({ where: { id: entry.labourId, companyId, isDeleted: false } });
  if (!labour) throw new Error("Labour not found");

  const existing = await prisma.labourAttendance.findFirst({
    where: { labourId: entry.labourId, attendanceDate, isDeleted: false },
  });
  if (existing) throw new Error(`Attendance already marked for ${labour.name} on this date`);

  const rate = await getCurrentWageRate(companyId, entry.labourId, attendanceDate);
  if (!rate) throw new Error(`No wage rate set for ${labour.name} — add one before marking attendance`);

  const status = parseStatus(entry.status);
  const overtimeHours = entry.overtimeHours ?? 0;
  const dailyWage = Number(rate.dailyWage);
  const overtimeRate = Number(rate.overtimeRate);
  const wageAmount = computeWage(status, dailyWage, overtimeRate, overtimeHours);

  return prisma.labourAttendance.create({
    data: {
      companyId,
      projectId,
      labourId: entry.labourId,
      attendanceDate,
      status,
      overtimeHours,
      dailyWageSnapshot: dailyWage,
      overtimeRateSnapshot: overtimeRate,
      wageAmount,
      remarks: entry.remarks || null,
      createdById,
    },
    include,
  });
}

export async function markAttendance(companyId: string, createdById: string, input: MarkAttendanceInput) {
  if (!input.projectId?.trim()) throw new Error("Project is required");
  const project = await prisma.project.findFirst({ where: { id: input.projectId, companyId } });
  if (!project) throw new Error("Project not found");

  const attendanceDate = input.attendanceDate ? new Date(input.attendanceDate) : new Date();
  const record = await markOne(companyId, createdById, input.projectId, attendanceDate, input);
  return toDTO(record);
}

/** Marks attendance for multiple workers on the same date/project in one call. Entries that fail (already marked, no wage rate) are skipped, not fatal to the batch. */
export async function bulkMarkAttendance(companyId: string, createdById: string, input: BulkMarkAttendanceInput) {
  if (!input.projectId?.trim()) throw new Error("Project is required");
  const project = await prisma.project.findFirst({ where: { id: input.projectId, companyId } });
  if (!project) throw new Error("Project not found");
  if (!input.entries?.length) throw new Error("At least one attendance entry is required");

  const attendanceDate = input.attendanceDate ? new Date(input.attendanceDate) : new Date();

  const created: ReturnType<typeof toDTO>[] = [];
  const skipped: Array<{ labourId: string; reason: string }> = [];

  for (const entry of input.entries) {
    try {
      const record = await markOne(companyId, createdById, input.projectId, attendanceDate, entry);
      created.push(toDTO(record));
    } catch (error) {
      skipped.push({ labourId: entry.labourId, reason: error instanceof Error ? error.message : "Failed to mark attendance" });
    }
  }

  return { created, skipped };
}

export async function listLabourAttendance(companyId: string, query: LabourAttendanceListQuery) {
  const {
    search = "",
    projectId,
    labourId,
    groupId,
    status,
    fromDate,
    toDate,
    page = 1,
    limit = 20,
    sortBy = "attendanceDate",
    sortOrder = "desc",
  } = query;

  const where: Prisma.LabourAttendanceWhereInput = {
    companyId,
    isDeleted: false,
    ...(projectId && { projectId }),
    ...(labourId && { labourId }),
    ...(groupId && { labour: { groupId } }),
    ...(status && ATTENDANCE_STATUSES.includes(status.toUpperCase() as AttendanceStatus) && { status: status.toUpperCase() as AttendanceStatus }),
    ...(fromDate || toDate
      ? { attendanceDate: { ...(fromDate ? { gte: new Date(fromDate) } : {}), ...(toDate ? { lte: new Date(toDate) } : {}) } }
      : {}),
    ...(search && {
      OR: [
        { labour: { name: { contains: search, mode: "insensitive" } } },
        { project: { name: { contains: search, mode: "insensitive" } } },
        { remarks: { contains: search, mode: "insensitive" } },
      ],
    }),
  };

  const allowed = ["attendanceDate", "status", "wageAmount", "createdAt"];
  const orderByField = allowed.includes(sortBy) ? sortBy : "attendanceDate";
  const skip = (Math.max(1, page) - 1) * Math.min(200, limit);
  const take = Math.min(200, limit);

  const [total, entries] = await Promise.all([
    prisma.labourAttendance.count({ where }),
    prisma.labourAttendance.findMany({ where, include, orderBy: { [orderByField]: sortOrder }, skip, take }),
  ]);

  return { total, page, limit: take, data: entries.map(toDTO) };
}

export async function getLabourAttendanceById(id: string, companyId: string) {
  const entry = await prisma.labourAttendance.findFirst({ where: { id, companyId, isDeleted: false }, include });
  if (!entry) throw new Error("Attendance record not found");
  return toDTO(entry);
}

/** Only status/overtime/remarks are editable — the wage snapshot is recomputed from the ORIGINAL rate captured at marking time, never a possibly-changed current rate. */
export async function updateLabourAttendance(id: string, companyId: string, input: AttendanceUpdateInput) {
  const existing = await prisma.labourAttendance.findFirst({ where: { id, companyId, isDeleted: false } });
  if (!existing) throw new Error("Attendance record not found");

  const status = input.status ? parseStatus(input.status) : existing.status;
  const overtimeHours = input.overtimeHours ?? Number(existing.overtimeHours);
  const wageAmount = computeWage(status, Number(existing.dailyWageSnapshot), Number(existing.overtimeRateSnapshot), overtimeHours);

  const entry = await prisma.labourAttendance.update({
    where: { id },
    data: {
      status,
      overtimeHours,
      wageAmount,
      remarks: input.remarks ?? existing.remarks,
    },
    include,
  });

  return toDTO(entry);
}

export async function deleteLabourAttendance(id: string, companyId: string) {
  const existing = await prisma.labourAttendance.findFirst({ where: { id, companyId } });
  if (!existing) throw new Error("Attendance record not found");
  if (existing.isDeleted) throw new Error("Attendance record already deleted");

  await prisma.labourAttendance.update({ where: { id }, data: { isDeleted: true, deletedAt: new Date() } });
}

export async function exportLabourAttendanceToCSV(companyId: string, query: LabourAttendanceListQuery) {
  const { data } = await listLabourAttendance(companyId, { ...query, page: 1, limit: 5000 });

  const headers = ["Date", "Project", "Labour", "Category", "Status", "Overtime Hours", "Daily Wage", "Overtime Rate", "Wage Amount", "Remarks"];

  const escapeCsv = (value: string) => {
    if (value.includes(",") || value.includes("\"") || value.includes("\n")) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  const rows = data.map((a) =>
    [
      a.attendanceDate,
      a.project?.name ?? "",
      a.labour?.name ?? "",
      a.labour?.category ?? "",
      a.status,
      a.overtimeHours,
      a.dailyWageSnapshot,
      a.overtimeRateSnapshot,
      a.wageAmount,
      a.remarks,
    ]
      .map((v) => escapeCsv(String(v ?? "")))
      .join(",")
  );

  return [headers.join(","), ...rows].join("\n");
}
