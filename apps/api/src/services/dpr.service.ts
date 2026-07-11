import prisma from "../config/prisma.js";
import { Prisma, Shift, VisitorType, SiteProblemType, LabourCategory } from "@prisma/client";
import { updateSubWork } from "./sub-work.service.js";

export const SHIFTS = ["DAY", "NIGHT"];
export const VISITOR_TYPES = ["EXECUTIVE_ENGINEER", "DEPUTY_ENGINEER", "ASSISTANT_ENGINEER", "JUNIOR_ENGINEER", "CONSULTANT", "CLIENT", "OTHER"];
export const SITE_PROBLEM_TYPES = ["RAIN", "LABOUR_SHORTAGE", "MATERIAL_SHORTAGE", "MACHINERY_BREAKDOWN", "DRAWING_PENDING", "OTHER"];

export interface ManualMachineryEntry {
  machineType: string;
  hours: number;
  amount: number;
  remarks?: string;
}

export interface DPRFormInput {
  projectId: string;
  siteId: string;
  subWorkId?: string;
  reportDate?: string;
  site?: string;
  engineerId?: string;
  contractorId?: string;
  weather?: string;
  shift?: string;
  remarks?: string;
  workDone?: string;
  plannedWork?: string;
  physicalProgressUpdate?: number;
  delayReason?: string;
  instructions?: string;
  labourSkilled?: number;
  labourUnskilled?: number;
  labourSupervisor?: number;
  labourOperator?: number;
  manualMachineryEntries?: ManualMachineryEntry[];
  // Optional — lets the Add/Edit DPR form submit Visitors and Site Problems in one go rather
  // than requiring the DPR to exist first. On update, a provided array wholesale REPLACES the
  // existing rows (simplest correct semantics for a small, form-edited child list).
  visitors?: VisitorInput[];
  siteProblems?: SiteProblemInput[];
}

export interface DPRListQuery {
  search?: string;
  projectId?: string;
  siteId?: string;
  subWorkId?: string;
  shift?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface VisitorInput {
  visitorType: string;
  name?: string;
  remarks?: string;
}

export interface SiteProblemInput {
  problemType: string;
  description?: string;
}

function parseShift(s: string | undefined): Shift {
  return SHIFTS.includes(s ?? "") ? (s as Shift) : "DAY";
}

function parseVisitorType(v: string): VisitorType {
  if (!VISITOR_TYPES.includes(v)) throw new Error(`Invalid visitor type: ${v}. Must be one of ${VISITOR_TYPES.join(", ")}`);
  return v as VisitorType;
}

function parseSiteProblemType(p: string): SiteProblemType {
  if (!SITE_PROBLEM_TYPES.includes(p)) throw new Error(`Invalid site problem type: ${p}. Must be one of ${SITE_PROBLEM_TYPES.join(", ")}`);
  return p as SiteProblemType;
}

function dayRange(date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return { gte: start, lte: end };
}

function autoNumber(): string {
  const now = new Date();
  const y = now.getFullYear().toString().slice(-2);
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `DPR-${y}${m}-${rand}`;
}

/**
 * Auto-pulls today's headcount from LabourAttendance, grouped into the 4 buckets the DPR
 * cares about. SEMI_SKILLED is folded into "Skilled" — there is no separate DPR bucket for
 * it, and semi-skilled is a sub-grade of skilled labour in common site-diary practice.
 * Present + Half Day both count as "on site today"; Absent/On Leave do not.
 */
async function autoPullLabourSummary(companyId: string, projectId: string, reportDate: Date, subWorkId?: string) {
  const attendances = await prisma.labourAttendance.findMany({
    where: {
      companyId,
      projectId,
      isDeleted: false,
      attendanceDate: dayRange(reportDate),
      status: { in: ["PRESENT", "HALF_DAY"] },
      ...(subWorkId && { subWorkId }),
    },
    select: { labour: { select: { category: true } } },
  });

  let labourSkilled = 0;
  let labourUnskilled = 0;
  let labourSupervisor = 0;
  let labourOperator = 0;

  for (const a of attendances) {
    const category: LabourCategory = a.labour.category;
    if (category === "SKILLED" || category === "SEMI_SKILLED") labourSkilled++;
    else if (category === "UNSKILLED") labourUnskilled++;
    else if (category === "SUPERVISOR") labourSupervisor++;
    else if (category === "OPERATOR") labourOperator++;
  }

  return { labourSkilled, labourUnskilled, labourSupervisor, labourOperator };
}

/** Live-pulled — never stored. Today's Machinery expenses (Site Expenses, category "Machinery") for this project/date/sub work. */
async function getMachinerySummary(companyId: string, projectId: string, reportDate: Date, subWorkId?: string) {
  const category = await prisma.expenseCategory.findFirst({
    where: { companyId, name: { equals: "Machinery", mode: "insensitive" } },
  });
  if (!category) return [];

  const expenses = await prisma.expense.findMany({
    where: {
      companyId,
      projectId,
      isDeleted: false,
      categoryId: category.id,
      expenseDate: dayRange(reportDate),
      ...(subWorkId && { subWorkId }),
    },
    select: {
      id: true,
      expenseNumber: true,
      machineType: true,
      machineHours: true,
      amount: true,
      vendor: { select: { id: true, name: true } },
    },
    orderBy: { expenseDate: "desc" },
  });

  return expenses.map((e) => ({
    id: e.id,
    expenseNumber: e.expenseNumber,
    machineType: e.machineType ?? "",
    hours: e.machineHours?.toString() ?? "0",
    amount: e.amount.toString(),
    vendor: e.vendor,
    source: "AUTO" as const,
  }));
}

/** Live-pulled — never stored. Material Received/Issued today, plus a Major Materials Used ranking by quantity issued today. */
async function getMaterialSummary(companyId: string, projectId: string, reportDate: Date, subWorkId?: string) {
  const [receipts, issues] = await Promise.all([
    prisma.materialReceipt.findMany({
      where: { companyId, projectId, receivedDate: dayRange(reportDate) },
      select: { id: true, receiptNumber: true, itemName: true, quantity: true, unit: true, vendor: { select: { id: true, name: true } } },
      orderBy: { receivedDate: "desc" },
    }),
    prisma.materialIssue.findMany({
      where: { companyId, projectId, isDeleted: false, issuedDate: dayRange(reportDate), ...(subWorkId && { subWorkId }) },
      select: { id: true, issueNumber: true, itemName: true, quantity: true, unit: true, purpose: true },
      orderBy: { issuedDate: "desc" },
    }),
  ]);

  const majorMap = new Map<string, { quantity: number; unit: string }>();
  for (const i of issues) {
    const bucket = majorMap.get(i.itemName) ?? { quantity: 0, unit: i.unit ?? "" };
    bucket.quantity += Number(i.quantity);
    majorMap.set(i.itemName, bucket);
  }
  const majorMaterialsUsed = Array.from(majorMap.entries())
    .sort((a, b) => b[1].quantity - a[1].quantity)
    .slice(0, 10)
    .map(([itemName, v]) => ({ itemName, quantity: v.quantity.toString(), unit: v.unit }));

  return {
    materialReceivedToday: receipts.map((r) => ({ ...r, quantity: r.quantity.toString() })),
    materialIssuedToday: issues.map((i) => ({ ...i, quantity: i.quantity.toString() })),
    majorMaterialsUsed,
  };
}

const include = {
  project: { select: { id: true, name: true, location: true } },
  subWork: { select: { id: true, name: true } },
  engineer: { select: { id: true, name: true, email: true } },
  contractor: { select: { id: true, name: true } },
  createdBy: { select: { id: true, name: true } },
  visitors: { orderBy: { createdAt: "desc" as const } },
  siteProblems: { orderBy: { createdAt: "desc" as const } },
};

type DPRRow = Prisma.DailyProgressReportGetPayload<{ include: typeof include }>;

function toDTO(dpr: DPRRow) {
  const labourTotal = dpr.labourSkilled + dpr.labourUnskilled + dpr.labourSupervisor + dpr.labourOperator;
  return {
    id: dpr.id,
    companyId: dpr.companyId,
    projectId: dpr.projectId,
    project: dpr.project,
    siteId: dpr.siteId,
    subWorkId: dpr.subWorkId ?? "",
    subWork: dpr.subWork,
    dprNumber: dpr.dprNumber,
    reportDate: dpr.reportDate.toISOString().slice(0, 10),
    site: dpr.site ?? dpr.project.location ?? "",
    engineerId: dpr.engineerId ?? "",
    engineer: dpr.engineer,
    contractorId: dpr.contractorId ?? "",
    contractor: dpr.contractor,
    weather: dpr.weather ?? "",
    shift: dpr.shift,
    remarks: dpr.remarks ?? "",
    workDone: dpr.workDone ?? "",
    plannedWork: dpr.plannedWork ?? "",
    physicalProgressUpdate: dpr.physicalProgressUpdate,
    delayReason: dpr.delayReason ?? "",
    instructions: dpr.instructions ?? "",
    labourSkilled: dpr.labourSkilled,
    labourUnskilled: dpr.labourUnskilled,
    labourSupervisor: dpr.labourSupervisor,
    labourOperator: dpr.labourOperator,
    labourTotal,
    labourManuallyAdjusted: dpr.labourManuallyAdjusted,
    manualMachineryEntries: (dpr.manualMachineryEntries as unknown as ManualMachineryEntry[] | null) ?? [],
    visitors: dpr.visitors.map((v) => ({ id: v.id, visitorType: v.visitorType, name: v.name ?? "", remarks: v.remarks ?? "", createdAt: v.createdAt.toISOString() })),
    siteProblems: dpr.siteProblems.map((p) => ({ id: p.id, problemType: p.problemType, description: p.description ?? "", createdAt: p.createdAt.toISOString() })),
    createdById: dpr.createdById,
    createdBy: dpr.createdBy,
    isDeleted: dpr.isDeleted,
    createdAt: dpr.createdAt.toISOString(),
    updatedAt: dpr.updatedAt.toISOString(),
  };
}

async function validateReferences(
  companyId: string,
  input: { projectId: string; siteId: string; subWorkId?: string; engineerId?: string; contractorId?: string }
) {
  const project = await prisma.project.findFirst({ where: { id: input.projectId, companyId } });
  if (!project) throw new Error("Project not found");

  const site = await prisma.site.findFirst({ where: { id: input.siteId, companyId, projectId: input.projectId } });
  if (!site) throw new Error("Site not found");

  if (input.subWorkId) {
    const subWork = await prisma.subWork.findFirst({ where: { id: input.subWorkId, companyId, projectId: input.projectId } });
    if (!subWork) throw new Error("Sub Work not found");
  }
  if (input.engineerId) {
    const engineer = await prisma.user.findFirst({ where: { id: input.engineerId, companyId } });
    if (!engineer) throw new Error("Engineer not found");
  }
  if (input.contractorId) {
    const contractor = await prisma.vendor.findFirst({ where: { id: input.contractorId, companyId } });
    if (!contractor) throw new Error("Contractor not found");
  }
  return project;
}

function validateManualMachineryEntries(entries: ManualMachineryEntry[] | undefined): ManualMachineryEntry[] {
  if (!entries?.length) return [];
  return entries.map((e) => {
    if (!e.machineType?.trim()) throw new Error("Machine type is required for a manual machinery entry");
    if (!Number.isFinite(e.hours) || e.hours < 0) throw new Error("Manual machinery entry hours must be a number greater than or equal to zero");
    if (!Number.isFinite(e.amount) || e.amount < 0) throw new Error("Manual machinery entry amount must be a number greater than or equal to zero");
    return { machineType: e.machineType.trim(), hours: e.hours, amount: e.amount, remarks: e.remarks?.trim() || undefined };
  });
}

export async function listDPRs(companyId: string, query: DPRListQuery) {
  const {
    search = "",
    projectId,
    siteId,
    subWorkId,
    shift,
    fromDate,
    toDate,
    page = 1,
    limit = 20,
    sortBy = "reportDate",
    sortOrder = "desc",
  } = query;

  const where: Prisma.DailyProgressReportWhereInput = {
    companyId,
    isDeleted: false,
    ...(projectId && { projectId }),
    ...(siteId && { siteId }),
    ...(subWorkId && { subWorkId }),
    ...(shift && SHIFTS.includes(shift.toUpperCase()) && { shift: shift.toUpperCase() as Shift }),
    ...(fromDate || toDate
      ? { reportDate: { ...(fromDate ? { gte: new Date(fromDate) } : {}), ...(toDate ? { lte: new Date(toDate) } : {}) } }
      : {}),
    ...(search && {
      OR: [
        { dprNumber: { contains: search, mode: "insensitive" } },
        { workDone: { contains: search, mode: "insensitive" } },
        { remarks: { contains: search, mode: "insensitive" } },
        { project: { name: { contains: search, mode: "insensitive" } } },
      ],
    }),
  };

  const allowed = ["reportDate", "dprNumber", "createdAt"];
  const orderByField = allowed.includes(sortBy) ? sortBy : "reportDate";
  const skip = (Math.max(1, page) - 1) * Math.min(100, limit);
  const take = Math.min(100, limit);

  const [total, dprs] = await Promise.all([
    prisma.dailyProgressReport.count({ where }),
    prisma.dailyProgressReport.findMany({ where, include, orderBy: { [orderByField]: sortOrder }, skip, take }),
  ]);

  return { total, page, limit: take, data: dprs.map(toDTO) };
}

export async function getDPRById(id: string, companyId: string) {
  const dpr = await prisma.dailyProgressReport.findFirst({ where: { id, companyId, isDeleted: false }, include });
  if (!dpr) throw new Error("DPR not found");

  const dto = toDTO(dpr);
  const [machinerySummary, materialSummary] = await Promise.all([
    getMachinerySummary(companyId, dpr.projectId, dpr.reportDate, dpr.subWorkId ?? undefined),
    getMaterialSummary(companyId, dpr.projectId, dpr.reportDate, dpr.subWorkId ?? undefined),
  ]);

  return { ...dto, machinerySummary, materialSummary };
}

/** Used by the Add-DPR form to prefill Labour/Machinery/Material before the report is saved. */
export async function getAutoPullPreview(companyId: string, projectId: string, reportDate: string, subWorkId?: string) {
  const project = await prisma.project.findFirst({ where: { id: projectId, companyId } });
  if (!project) throw new Error("Project not found");
  if (subWorkId) {
    const subWork = await prisma.subWork.findFirst({ where: { id: subWorkId, companyId, projectId } });
    if (!subWork) throw new Error("Sub Work not found");
  }

  const date = reportDate ? new Date(reportDate) : new Date();
  const [labourSummary, machinerySummary, materialSummary] = await Promise.all([
    autoPullLabourSummary(companyId, projectId, date, subWorkId),
    getMachinerySummary(companyId, projectId, date, subWorkId),
    getMaterialSummary(companyId, projectId, date, subWorkId),
  ]);

  return {
    ...labourSummary,
    labourTotal: labourSummary.labourSkilled + labourSummary.labourUnskilled + labourSummary.labourSupervisor + labourSummary.labourOperator,
    machinerySummary,
    materialSummary,
  };
}

export async function createDPR(companyId: string, createdById: string, input: DPRFormInput) {
  if (!input.projectId?.trim()) throw new Error("Project is required");
  if (!input.siteId?.trim()) throw new Error("Site is required");
  await validateReferences(companyId, input);

  const reportDate = input.reportDate ? new Date(input.reportDate) : new Date();
  const shift = parseShift(input.shift);
  const manualMachineryEntries = validateManualMachineryEntries(input.manualMachineryEntries);

  const labourProvided =
    input.labourSkilled !== undefined || input.labourUnskilled !== undefined || input.labourSupervisor !== undefined || input.labourOperator !== undefined;

  const autoLabour = await autoPullLabourSummary(companyId, input.projectId, reportDate, input.subWorkId);
  const labourSkilled = input.labourSkilled ?? autoLabour.labourSkilled;
  const labourUnskilled = input.labourUnskilled ?? autoLabour.labourUnskilled;
  const labourSupervisor = input.labourSupervisor ?? autoLabour.labourSupervisor;
  const labourOperator = input.labourOperator ?? autoLabour.labourOperator;

  const dpr = await prisma.$transaction(async (tx) => {
    const created = await tx.dailyProgressReport.create({
      data: {
        companyId,
        projectId: input.projectId,
        siteId: input.siteId,
        subWorkId: input.subWorkId || null,
        dprNumber: autoNumber(),
        reportDate,
        site: input.site || null,
        engineerId: input.engineerId || null,
        contractorId: input.contractorId || null,
        weather: input.weather || null,
        shift,
        remarks: input.remarks || null,
        workDone: input.workDone || null,
        plannedWork: input.plannedWork || null,
        physicalProgressUpdate: input.physicalProgressUpdate ?? null,
        delayReason: input.delayReason || null,
        instructions: input.instructions || null,
        labourSkilled,
        labourUnskilled,
        labourSupervisor,
        labourOperator,
        labourManuallyAdjusted: labourProvided,
        manualMachineryEntries: manualMachineryEntries as unknown as Prisma.InputJsonValue,
        createdById,
      },
    });

    if (input.visitors?.length) {
      await tx.dPRVisitor.createMany({
        data: input.visitors.map((v) => ({ companyId, dprId: created.id, visitorType: parseVisitorType(v.visitorType), name: v.name || null, remarks: v.remarks || null })),
      });
    }
    if (input.siteProblems?.length) {
      await tx.dPRSiteProblem.createMany({
        data: input.siteProblems.map((p) => ({ companyId, dprId: created.id, problemType: parseSiteProblemType(p.problemType), description: p.description || null })),
      });
    }

    if (input.subWorkId && input.physicalProgressUpdate !== undefined) {
      await updateSubWork(input.subWorkId, companyId, { physicalProgress: input.physicalProgressUpdate });
    }

    return tx.dailyProgressReport.findFirstOrThrow({ where: { id: created.id }, include });
  });

  return toDTO(dpr);
}

export async function updateDPR(id: string, companyId: string, input: DPRFormInput) {
  const existing = await prisma.dailyProgressReport.findFirst({ where: { id, companyId, isDeleted: false } });
  if (!existing) throw new Error("DPR not found");

  await validateReferences(companyId, { ...input, projectId: input.projectId || existing.projectId });

  const reportDate = input.reportDate ? new Date(input.reportDate) : existing.reportDate;
  const manualMachineryEntries = input.manualMachineryEntries !== undefined ? validateManualMachineryEntries(input.manualMachineryEntries) : undefined;

  const labourProvided =
    input.labourSkilled !== undefined || input.labourUnskilled !== undefined || input.labourSupervisor !== undefined || input.labourOperator !== undefined;

  const dpr = await prisma.$transaction(async (tx) => {
    const updated = await tx.dailyProgressReport.update({
      where: { id },
      data: {
        projectId: input.projectId || existing.projectId,
        subWorkId: input.subWorkId !== undefined ? input.subWorkId || null : existing.subWorkId,
        reportDate,
        site: input.site !== undefined ? input.site || null : existing.site,
        engineerId: input.engineerId !== undefined ? input.engineerId || null : existing.engineerId,
        contractorId: input.contractorId !== undefined ? input.contractorId || null : existing.contractorId,
        weather: input.weather !== undefined ? input.weather || null : existing.weather,
        shift: input.shift !== undefined ? parseShift(input.shift) : existing.shift,
        remarks: input.remarks !== undefined ? input.remarks || null : existing.remarks,
        workDone: input.workDone !== undefined ? input.workDone || null : existing.workDone,
        plannedWork: input.plannedWork !== undefined ? input.plannedWork || null : existing.plannedWork,
        physicalProgressUpdate: input.physicalProgressUpdate !== undefined ? input.physicalProgressUpdate : existing.physicalProgressUpdate,
        delayReason: input.delayReason !== undefined ? input.delayReason || null : existing.delayReason,
        instructions: input.instructions !== undefined ? input.instructions || null : existing.instructions,
        ...(input.labourSkilled !== undefined && { labourSkilled: input.labourSkilled }),
        ...(input.labourUnskilled !== undefined && { labourUnskilled: input.labourUnskilled }),
        ...(input.labourSupervisor !== undefined && { labourSupervisor: input.labourSupervisor }),
        ...(input.labourOperator !== undefined && { labourOperator: input.labourOperator }),
        ...(labourProvided && { labourManuallyAdjusted: true }),
        ...(manualMachineryEntries !== undefined && { manualMachineryEntries: manualMachineryEntries as unknown as Prisma.InputJsonValue }),
      },
    });

    if (input.visitors !== undefined) {
      await tx.dPRVisitor.deleteMany({ where: { dprId: id } });
      if (input.visitors.length) {
        await tx.dPRVisitor.createMany({
          data: input.visitors.map((v) => ({ companyId, dprId: id, visitorType: parseVisitorType(v.visitorType), name: v.name || null, remarks: v.remarks || null })),
        });
      }
    }
    if (input.siteProblems !== undefined) {
      await tx.dPRSiteProblem.deleteMany({ where: { dprId: id } });
      if (input.siteProblems.length) {
        await tx.dPRSiteProblem.createMany({
          data: input.siteProblems.map((p) => ({ companyId, dprId: id, problemType: parseSiteProblemType(p.problemType), description: p.description || null })),
        });
      }
    }

    const effectiveSubWorkId = input.subWorkId !== undefined ? input.subWorkId : existing.subWorkId;
    if (effectiveSubWorkId && input.physicalProgressUpdate !== undefined) {
      await updateSubWork(effectiveSubWorkId, companyId, { physicalProgress: input.physicalProgressUpdate });
    }

    return tx.dailyProgressReport.findFirstOrThrow({ where: { id: updated.id }, include });
  });

  return toDTO(dpr);
}

/** Soft delete only — an official site-diary record is never hard-deleted. */
export async function deleteDPR(id: string, companyId: string) {
  const existing = await prisma.dailyProgressReport.findFirst({ where: { id, companyId } });
  if (!existing) throw new Error("DPR not found");
  if (existing.isDeleted) throw new Error("DPR already deleted");

  await prisma.dailyProgressReport.update({ where: { id }, data: { isDeleted: true, deletedAt: new Date() } });
}

export async function addVisitor(dprId: string, companyId: string, input: VisitorInput) {
  const dpr = await prisma.dailyProgressReport.findFirst({ where: { id: dprId, companyId, isDeleted: false } });
  if (!dpr) throw new Error("DPR not found");

  const visitorType = parseVisitorType(input.visitorType);
  const visitor = await prisma.dPRVisitor.create({
    data: { companyId, dprId, visitorType, name: input.name || null, remarks: input.remarks || null },
  });
  return { id: visitor.id, visitorType: visitor.visitorType, name: visitor.name ?? "", remarks: visitor.remarks ?? "", createdAt: visitor.createdAt.toISOString() };
}

export async function removeVisitor(dprId: string, visitorId: string, companyId: string) {
  const visitor = await prisma.dPRVisitor.findFirst({ where: { id: visitorId, dprId, companyId } });
  if (!visitor) throw new Error("Visitor not found");
  await prisma.dPRVisitor.delete({ where: { id: visitorId } });
}

export async function addSiteProblem(dprId: string, companyId: string, input: SiteProblemInput) {
  const dpr = await prisma.dailyProgressReport.findFirst({ where: { id: dprId, companyId, isDeleted: false } });
  if (!dpr) throw new Error("DPR not found");

  const problemType = parseSiteProblemType(input.problemType);
  const problem = await prisma.dPRSiteProblem.create({
    data: { companyId, dprId, problemType, description: input.description || null },
  });
  return { id: problem.id, problemType: problem.problemType, description: problem.description ?? "", createdAt: problem.createdAt.toISOString() };
}

export async function removeSiteProblem(dprId: string, problemId: string, companyId: string) {
  const problem = await prisma.dPRSiteProblem.findFirst({ where: { id: problemId, dprId, companyId } });
  if (!problem) throw new Error("Site problem not found");
  await prisma.dPRSiteProblem.delete({ where: { id: problemId } });
}
