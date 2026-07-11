import prisma from "../config/prisma.js";

/**
 * The Project's master contract record — Work Order / Agreement / Tender references, the
 * government department hierarchy, and statutory percentages. Contract Value is NOT stored
 * here; it stays solely on Project.contractValue (the existing, single source of truth used
 * everywhere else — Project Control Center, Running Bills' Project Billing Summary, the AP
 * Control Center) and is read/written through this service purely as a convenience so the
 * Contract Information tab can show and edit it alongside the new fields in one form.
 */

export interface ProjectContractInfoInput {
  workOrderNumber?: string;
  workOrderDate?: string;
  agreementNumber?: string;
  agreementDate?: string;
  tenderNumber?: string;
  department?: string;
  division?: string;
  subDivision?: string;
  clientEngineer?: string;
  contractValue?: number;
  estimateAmount?: number;
  workStartDate?: string;
  completionDate?: string;
  defectLiabilityPeriod?: string;
  securityDepositPercent?: number;
  performanceGuaranteePercent?: number;
  gstPercent?: number;
}

function toDate(v: string | undefined) {
  return v ? new Date(v) : null;
}

function toDTO(
  project: { contractValue: { toString(): string } },
  info: {
    id: string;
    workOrderNumber: string | null;
    workOrderDate: Date | null;
    agreementNumber: string | null;
    agreementDate: Date | null;
    tenderNumber: string | null;
    department: string | null;
    division: string | null;
    subDivision: string | null;
    clientEngineer: string | null;
    estimateAmount: { toString(): string } | null;
    workStartDate: Date | null;
    completionDate: Date | null;
    defectLiabilityPeriod: string | null;
    securityDepositPercent: { toString(): string } | null;
    performanceGuaranteePercent: { toString(): string } | null;
    gstPercent: { toString(): string } | null;
    updatedAt: Date;
  } | null
) {
  const dateStr = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : "");
  return {
    workOrderNumber: info?.workOrderNumber ?? "",
    workOrderDate: dateStr(info?.workOrderDate ?? null),
    agreementNumber: info?.agreementNumber ?? "",
    agreementDate: dateStr(info?.agreementDate ?? null),
    tenderNumber: info?.tenderNumber ?? "",
    department: info?.department ?? "",
    division: info?.division ?? "",
    subDivision: info?.subDivision ?? "",
    clientEngineer: info?.clientEngineer ?? "",
    contractValue: project.contractValue.toString(),
    estimateAmount: info?.estimateAmount?.toString() ?? "",
    workStartDate: dateStr(info?.workStartDate ?? null),
    completionDate: dateStr(info?.completionDate ?? null),
    defectLiabilityPeriod: info?.defectLiabilityPeriod ?? "",
    securityDepositPercent: info?.securityDepositPercent?.toString() ?? "",
    performanceGuaranteePercent: info?.performanceGuaranteePercent?.toString() ?? "",
    gstPercent: info?.gstPercent?.toString() ?? "",
    updatedAt: info?.updatedAt.toISOString() ?? "",
  };
}

export async function getProjectContractInfo(projectId: string, companyId: string) {
  const project = await prisma.project.findFirst({ where: { id: projectId, companyId } });
  if (!project) throw new Error("Project not found");

  const info = await prisma.projectContractInfo.findFirst({ where: { projectId, companyId } });
  return toDTO(project, info);
}

export async function upsertProjectContractInfo(projectId: string, companyId: string, input: ProjectContractInfoInput) {
  const project = await prisma.project.findFirst({ where: { id: projectId, companyId } });
  if (!project) throw new Error("Project not found");

  const [, info] = await prisma.$transaction([
    prisma.project.update({
      where: { id: projectId },
      data: input.contractValue !== undefined ? { contractValue: input.contractValue } : {},
    }),
    prisma.projectContractInfo.upsert({
      where: { projectId },
      create: {
        companyId,
        projectId,
        workOrderNumber: input.workOrderNumber || null,
        workOrderDate: toDate(input.workOrderDate),
        agreementNumber: input.agreementNumber || null,
        agreementDate: toDate(input.agreementDate),
        tenderNumber: input.tenderNumber || null,
        department: input.department || null,
        division: input.division || null,
        subDivision: input.subDivision || null,
        clientEngineer: input.clientEngineer || null,
        estimateAmount: input.estimateAmount ?? null,
        workStartDate: toDate(input.workStartDate),
        completionDate: toDate(input.completionDate),
        defectLiabilityPeriod: input.defectLiabilityPeriod || null,
        securityDepositPercent: input.securityDepositPercent ?? null,
        performanceGuaranteePercent: input.performanceGuaranteePercent ?? null,
        gstPercent: input.gstPercent ?? null,
      },
      update: {
        workOrderNumber: input.workOrderNumber || null,
        workOrderDate: toDate(input.workOrderDate),
        agreementNumber: input.agreementNumber || null,
        agreementDate: toDate(input.agreementDate),
        tenderNumber: input.tenderNumber || null,
        department: input.department || null,
        division: input.division || null,
        subDivision: input.subDivision || null,
        clientEngineer: input.clientEngineer || null,
        estimateAmount: input.estimateAmount ?? null,
        workStartDate: toDate(input.workStartDate),
        completionDate: toDate(input.completionDate),
        defectLiabilityPeriod: input.defectLiabilityPeriod || null,
        securityDepositPercent: input.securityDepositPercent ?? null,
        performanceGuaranteePercent: input.performanceGuaranteePercent ?? null,
        gstPercent: input.gstPercent ?? null,
      },
    }),
  ]);

  const updatedProject = await prisma.project.findFirstOrThrow({ where: { id: projectId } });
  return toDTO(updatedProject, info);
}
