import prisma from "../config/prisma.js";

/**
 * Central Bank Directory (Workflow Refinement milestone, Item 5) — a read-only aggregation over
 * the accounts that already live in their own modules. No duplicate storage: Company accounts
 * stay in CompanyBankAccount, Vendor accounts in VendorBankAccount, Employee/Partner accounts in
 * the generic BankAccountMaster (ownerType EMPLOYEE/PARTNER). This service only reads and joins.
 */

interface DirectoryRow {
  id: string;
  ownerType: "COMPANY" | "VENDOR" | "EMPLOYEE" | "PARTNER";
  ownerName: string;
  bankName: string;
  branch: string;
  accountNumber: string;
  ifscCode: string;
  isPrimary: boolean;
  status: string;
}

export async function getBankDirectory(companyId: string) {
  const [companyAccounts, vendorAccounts, employeeMasterAccounts, partnerMasterAccounts] = await Promise.all([
    prisma.companyBankAccount.findMany({ where: { companyId } }),
    prisma.vendorBankAccount.findMany({ where: { companyId }, include: { vendor: { select: { name: true } } } }),
    prisma.bankAccountMaster.findMany({ where: { companyId, ownerType: "EMPLOYEE" } }),
    prisma.bankAccountMaster.findMany({ where: { companyId, ownerType: "PARTNER" } }),
  ]);

  const employeeIds = employeeMasterAccounts.map((a) => a.ownerId).filter((id): id is string => !!id);
  const partnerIds = partnerMasterAccounts.map((a) => a.ownerId).filter((id): id is string => !!id);

  const [employees, partners] = await Promise.all([
    employeeIds.length ? prisma.employee.findMany({ where: { id: { in: employeeIds }, companyId }, select: { id: true, name: true } }) : [],
    partnerIds.length ? prisma.partner.findMany({ where: { id: { in: partnerIds }, companyId }, select: { id: true, name: true } }) : [],
  ]);
  const employeeNameById = new Map(employees.map((e) => [e.id, e.name]));
  const partnerNameById = new Map(partners.map((p) => [p.id, p.name]));

  const company: DirectoryRow[] = companyAccounts.map((a) => ({
    id: a.id,
    ownerType: "COMPANY",
    ownerName: a.nickname || a.beneficiaryName || "Company Account",
    bankName: a.bankName,
    branch: a.branch ?? "",
    accountNumber: a.accountNumber,
    ifscCode: a.ifscCode,
    isPrimary: a.isPrimary,
    status: a.isActive ? "ACTIVE" : "INACTIVE",
  }));

  const vendor: DirectoryRow[] = vendorAccounts.map((a) => ({
    id: a.id,
    ownerType: "VENDOR",
    ownerName: a.vendor.name,
    bankName: a.bankName,
    branch: a.branch ?? "",
    accountNumber: a.accountNumber,
    ifscCode: a.ifscCode,
    isPrimary: a.isPrimary,
    status: a.isActive ? "ACTIVE" : "INACTIVE",
  }));

  const employee: DirectoryRow[] = employeeMasterAccounts.map((a) => ({
    id: a.id,
    ownerType: "EMPLOYEE",
    ownerName: a.ownerLabel || (a.ownerId ? employeeNameById.get(a.ownerId) : undefined) || "Employee Account",
    bankName: a.bankName,
    branch: a.branch ?? "",
    accountNumber: a.accountNumber,
    ifscCode: a.ifscCode,
    isPrimary: a.isPrimary,
    status: a.status,
  }));

  const partner: DirectoryRow[] = partnerMasterAccounts.map((a) => ({
    id: a.id,
    ownerType: "PARTNER",
    ownerName: a.ownerLabel || (a.ownerId ? partnerNameById.get(a.ownerId) : undefined) || "Partner Account",
    bankName: a.bankName,
    branch: a.branch ?? "",
    accountNumber: a.accountNumber,
    ifscCode: a.ifscCode,
    isPrimary: a.isPrimary,
    status: a.status,
  }));

  return {
    company,
    vendor,
    employee,
    partner,
    totalAccounts: company.length + vendor.length + employee.length + partner.length,
  };
}
