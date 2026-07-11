/**
 * Phase 1 (Site-First Architecture) one-off backfill.
 *
 * Creates one default Site per existing Project (copying contract figures from
 * Project/ProjectContractInfo where available) and stamps siteId onto every existing
 * SubWork/DailyProgressReport/MeasurementBook/RunningBill/Expense/LabourAttendance/
 * Document row that belongs to that project and doesn't have a siteId yet.
 *
 * Idempotent: re-running skips projects that already have a Site.
 *
 * Run with: pnpm --filter api exec tsx scripts/backfill-sites.ts
 */
import prisma from "../src/config/prisma.js";
import { ProjectStatus } from "@prisma/client";

async function main() {
  const projects = await prisma.project.findMany({
    include: { contractInfo: true, sites: { select: { id: true }, take: 1 } },
  });

  let created = 0;
  for (const project of projects) {
    if (project.sites.length > 0) continue;

    const contractValue = project.contractValue;
    const securityDeposit = project.contractInfo?.securityDepositPercent
      ? contractValue.mul(project.contractInfo.securityDepositPercent).div(100)
      : 0;
    const performanceGuarantee = project.contractInfo?.performanceGuaranteePercent
      ? contractValue.mul(project.contractInfo.performanceGuaranteePercent).div(100)
      : 0;

    const site = await prisma.site.create({
      data: {
        companyId: project.companyId,
        projectId: project.id,
        name: project.name,
        village: null,
        taluka: null,
        district: null,
        engineer: project.contractInfo?.clientEngineer ?? project.manager ?? null,
        siteType: "OWN_SITE",
        status: project.status as ProjectStatus,
        contractValue,
        emdValue: 0,
        securityDeposit,
        performanceGuarantee,
        workOrderDate: project.contractInfo?.workOrderDate ?? null,
        completionDate: project.contractInfo?.completionDate ?? null,
      },
    });
    created++;

    const where = { companyId: project.companyId, projectId: project.id, siteId: null };
    await prisma.$transaction([
      prisma.subWork.updateMany({ where, data: { siteId: site.id } }),
      prisma.dailyProgressReport.updateMany({ where, data: { siteId: site.id } }),
      prisma.measurementBook.updateMany({ where, data: { siteId: site.id } }),
      prisma.runningBill.updateMany({ where, data: { siteId: site.id } }),
      prisma.expense.updateMany({ where, data: { siteId: site.id } }),
      prisma.labourAttendance.updateMany({ where, data: { siteId: site.id } }),
      prisma.document.updateMany({ where, data: { siteId: site.id } }),
    ]);

    console.log(`Created default Site "${site.name}" (${site.id}) for Project ${project.id}`);
  }

  console.log(`Backfill complete. Sites created: ${created}/${projects.length} projects.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
