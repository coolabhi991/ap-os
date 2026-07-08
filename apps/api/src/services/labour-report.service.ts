import prisma from "../config/prisma.js";
import { Prisma } from "@prisma/client";

interface DateRangeQuery {
  fromDate?: string;
  toDate?: string;
}

function dateRangeWhere(query: DateRangeQuery) {
  const { fromDate, toDate } = query;
  if (!fromDate && !toDate) return undefined;
  return { ...(fromDate ? { gte: new Date(fromDate) } : {}), ...(toDate ? { lte: new Date(toDate) } : {}) };
}

export interface WageSummaryFilters {
  labourId?: string;
  projectId?: string;
  contractorId?: string;
  fromDate?: string;
  toDate?: string;
}

/**
 * Core per-labour wage summary shared by the Wage Register and Pending Wages reports.
 * wageEarned respects the given date range (a period figure); totalAdvances/totalPayments
 * are always all-time (pending balance is a running total, not scoped to a period).
 */
export async function getLabourWageSummary(companyId: string, filters: WageSummaryFilters) {
  const labourWhere: Prisma.LabourWhereInput = {
    companyId,
    isDeleted: false,
    ...(filters.labourId && { id: filters.labourId }),
    ...(filters.projectId && { projectId: filters.projectId }),
    ...(filters.contractorId && { contractorId: filters.contractorId }),
  };

  const labours = await prisma.labour.findMany({
    where: labourWhere,
    select: { id: true, name: true, category: true, contractor: { select: { id: true, name: true } } },
  });
  const labourIds = labours.map((l) => l.id);
  if (labourIds.length === 0) return [];

  const dateRange = dateRangeWhere(filters);
  const attendanceWhere: Prisma.LabourAttendanceWhereInput = {
    companyId,
    labourId: { in: labourIds },
    isDeleted: false,
    ...(dateRange && { attendanceDate: dateRange }),
  };

  const [attendanceRows, advanceAgg, paymentAgg] = await Promise.all([
    prisma.labourAttendance.groupBy({
      by: ["labourId", "status"],
      where: attendanceWhere,
      _count: { _all: true },
      _sum: { wageAmount: true, overtimeHours: true },
    }),
    prisma.labourAdvance.groupBy({
      by: ["labourId"],
      where: { companyId, labourId: { in: labourIds }, isDeleted: false },
      _sum: { amount: true },
    }),
    prisma.labourPayment.groupBy({
      by: ["labourId"],
      where: { companyId, labourId: { in: labourIds }, isDeleted: false },
      _sum: { amount: true },
    }),
  ]);

  const advanceByLabour = new Map(advanceAgg.map((a) => [a.labourId, Number(a._sum.amount ?? 0)]));
  const paymentByLabour = new Map(paymentAgg.map((p) => [p.labourId, Number(p._sum.amount ?? 0)]));

  const statsByLabour = new Map<
    string,
    { daysPresent: number; daysHalfDay: number; daysAbsent: number; daysOnLeave: number; wageEarned: number; overtimeHours: number }
  >();
  for (const row of attendanceRows) {
    const s = statsByLabour.get(row.labourId) ?? { daysPresent: 0, daysHalfDay: 0, daysAbsent: 0, daysOnLeave: 0, wageEarned: 0, overtimeHours: 0 };
    const count = row._count._all;
    if (row.status === "PRESENT") s.daysPresent += count;
    else if (row.status === "HALF_DAY") s.daysHalfDay += count;
    else if (row.status === "ABSENT") s.daysAbsent += count;
    else if (row.status === "ON_LEAVE") s.daysOnLeave += count;
    s.wageEarned += Number(row._sum.wageAmount ?? 0);
    s.overtimeHours += Number(row._sum.overtimeHours ?? 0);
    statsByLabour.set(row.labourId, s);
  }

  return labours.map((l) => {
    const s = statsByLabour.get(l.id) ?? { daysPresent: 0, daysHalfDay: 0, daysAbsent: 0, daysOnLeave: 0, wageEarned: 0, overtimeHours: 0 };
    const totalAdvances = advanceByLabour.get(l.id) ?? 0;
    const totalPayments = paymentByLabour.get(l.id) ?? 0;
    const pendingWages = s.wageEarned - totalAdvances - totalPayments;

    return {
      labourId: l.id,
      name: l.name,
      category: l.category,
      contractorName: l.contractor?.name ?? "",
      daysPresent: s.daysPresent,
      daysHalfDay: s.daysHalfDay,
      daysAbsent: s.daysAbsent,
      daysOnLeave: s.daysOnLeave,
      totalOvertimeHours: s.overtimeHours.toString(),
      wageEarned: s.wageEarned.toString(),
      totalAdvances: totalAdvances.toString(),
      totalPayments: totalPayments.toString(),
      pendingWages: pendingWages.toString(),
    };
  });
}

/** Wage Register: wages earned in a given period (defaults to all-time if no range given). */
export async function getWageRegister(companyId: string, filters: WageSummaryFilters) {
  return getLabourWageSummary(companyId, filters);
}

/** Pending Wages: always an all-time running balance, never scoped to a date range. */
export async function getPendingWages(companyId: string, filters: Omit<WageSummaryFilters, "fromDate" | "toDate">) {
  const summary = await getLabourWageSummary(companyId, filters);
  return summary
    .filter((s) => Number(s.pendingWages) > 0)
    .sort((a, b) => Number(b.pendingWages) - Number(a.pendingWages));
}

export async function getProjectLabourCostReport(companyId: string, query: DateRangeQuery) {
  const dateRange = dateRangeWhere(query);
  const where: Prisma.LabourAttendanceWhereInput = { companyId, isDeleted: false, ...(dateRange && { attendanceDate: dateRange }) };

  const rows = await prisma.labourAttendance.groupBy({
    by: ["projectId"],
    where,
    _sum: { wageAmount: true },
    _count: { _all: true },
    orderBy: { _sum: { wageAmount: "desc" } },
  });

  const projects = await prisma.project.findMany({ where: { id: { in: rows.map((r) => r.projectId) } }, select: { id: true, name: true } });
  const nameById = new Map(projects.map((p) => [p.id, p.name]));

  return rows.map((r) => ({
    projectId: r.projectId,
    projectName: nameById.get(r.projectId) ?? "Unknown",
    totalWageCost: (r._sum.wageAmount ?? new Prisma.Decimal(0)).toString(),
    attendanceCount: r._count._all,
  }));
}

export async function getLabourDashboard(companyId: string) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const baseWhere: Prisma.LabourAttendanceWhereInput = { companyId, isDeleted: false };

  const [totalActiveLabour, todayAgg, todayByStatus, monthAgg, projectCostRaw, recentAttendance, topPendingWages] = await Promise.all([
    prisma.labour.count({ where: { companyId, isDeleted: false, status: "Active" } }),
    prisma.labourAttendance.aggregate({ where: { ...baseWhere, attendanceDate: { gte: startOfDay } }, _sum: { wageAmount: true }, _count: { _all: true } }),
    prisma.labourAttendance.groupBy({ by: ["status"], where: { ...baseWhere, attendanceDate: { gte: startOfDay } }, _count: { _all: true } }),
    prisma.labourAttendance.aggregate({ where: { ...baseWhere, attendanceDate: { gte: startOfMonth } }, _sum: { wageAmount: true }, _count: { _all: true } }),
    prisma.labourAttendance.groupBy({ by: ["projectId"], where: baseWhere, _sum: { wageAmount: true }, orderBy: { _sum: { wageAmount: "desc" } }, take: 10 }),
    prisma.labourAttendance.findMany({
      where: baseWhere,
      include: { project: { select: { id: true, name: true } }, labour: { select: { id: true, name: true } } },
      orderBy: { attendanceDate: "desc" },
      take: 10,
    }),
    getPendingWages(companyId, {}),
  ]);

  const projects = await prisma.project.findMany({ where: { id: { in: projectCostRaw.map((r) => r.projectId) } }, select: { id: true, name: true } });
  const projectNameById = new Map(projects.map((p) => [p.id, p.name]));

  const byStatus: Record<string, number> = { PRESENT: 0, ABSENT: 0, HALF_DAY: 0, ON_LEAVE: 0 };
  for (const row of todayByStatus) byStatus[row.status] = row._count._all;

  return {
    totalActiveLabour,
    today: {
      count: todayAgg._count._all,
      wageAmount: (todayAgg._sum.wageAmount ?? new Prisma.Decimal(0)).toString(),
      byStatus,
    },
    thisMonth: {
      count: monthAgg._count._all,
      wageAmount: (monthAgg._sum.wageAmount ?? new Prisma.Decimal(0)).toString(),
    },
    projectWiseCost: projectCostRaw.map((r) => ({
      projectId: r.projectId,
      projectName: projectNameById.get(r.projectId) ?? "Unknown",
      totalWageCost: (r._sum.wageAmount ?? new Prisma.Decimal(0)).toString(),
    })),
    topPendingWages: topPendingWages.slice(0, 10),
    recentAttendance: recentAttendance.map((a) => ({
      id: a.id,
      attendanceDate: a.attendanceDate.toISOString().slice(0, 10),
      project: a.project,
      labour: a.labour,
      status: a.status,
      wageAmount: a.wageAmount.toString(),
    })),
  };
}
