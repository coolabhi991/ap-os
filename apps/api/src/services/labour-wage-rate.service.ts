import prisma from "../config/prisma.js";
import { Prisma } from "@prisma/client";

export interface LabourWageRateFormInput {
  dailyWage: number;
  overtimeRate?: number;
  effectiveFrom?: string;
}

function toDTO(r: {
  id: string;
  companyId: string;
  labourId: string;
  dailyWage: Prisma.Decimal;
  overtimeRate: Prisma.Decimal;
  effectiveFrom: Date;
  createdAt: Date;
}) {
  return {
    id: r.id,
    companyId: r.companyId,
    labourId: r.labourId,
    dailyWage: r.dailyWage.toString(),
    overtimeRate: r.overtimeRate.toString(),
    effectiveFrom: r.effectiveFrom.toISOString().slice(0, 10),
    createdAt: r.createdAt.toISOString(),
  };
}

export async function listLabourWageRates(companyId: string, labourId: string) {
  const labour = await prisma.labour.findFirst({ where: { id: labourId, companyId } });
  if (!labour) throw new Error("Labour not found");

  const rates = await prisma.labourWageRate.findMany({
    where: { companyId, labourId },
    orderBy: { effectiveFrom: "desc" },
  });
  return rates.map(toDTO);
}

export async function createLabourWageRate(companyId: string, labourId: string, input: LabourWageRateFormInput) {
  const labour = await prisma.labour.findFirst({ where: { id: labourId, companyId } });
  if (!labour) throw new Error("Labour not found");

  if (!input.dailyWage || input.dailyWage <= 0) throw new Error("Daily wage must be greater than zero");

  const rate = await prisma.labourWageRate.create({
    data: {
      companyId,
      labourId,
      dailyWage: input.dailyWage,
      overtimeRate: input.overtimeRate ?? 0,
      effectiveFrom: input.effectiveFrom ? new Date(input.effectiveFrom) : new Date(),
    },
  });

  return toDTO(rate);
}

/** The wage rate in effect on a given date (the latest rate with effectiveFrom <= that date). Used by Attendance to snapshot pay at marking time. */
export async function getCurrentWageRate(companyId: string, labourId: string, asOfDate: Date) {
  return prisma.labourWageRate.findFirst({
    where: { companyId, labourId, effectiveFrom: { lte: asOfDate } },
    orderBy: { effectiveFrom: "desc" },
  });
}
