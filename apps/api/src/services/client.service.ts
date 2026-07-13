import prisma from "../config/prisma.js";
import { Prisma } from "@prisma/client";
import { getFinancialYear, padSeq } from "../utils/numbering.js";

export interface ClientFormInput {
  companyName: string;
  contactPerson?: string;
  mobile?: string;
  email?: string;
  gst?: string;
  pan?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  website?: string;
  status?: string;
  notes?: string;
}

export interface ClientListQuery {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

/** Map a DB Client row to the shape the frontend expects. */
function toClientDTO(c: {
  id: string;
  companyId: string;
  name: string;
  clientCode: string | null;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  gstNumber: string | null;
  panNumber: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  website: string | null;
  status: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: c.id,
    companyId: c.companyId,
    companyName: c.name,
    clientCode: c.clientCode ?? "",
    contactPerson: c.contactPerson ?? "",
    mobile: c.phone ?? "",
    email: c.email ?? "",
    gst: c.gstNumber ?? "",
    pan: c.panNumber ?? "",
    address: c.address ?? "",
    city: c.city ?? "",
    state: c.state ?? "",
    pincode: c.pincode ?? "",
    website: c.website ?? "",
    status: c.status,
    notes: c.notes ?? "",
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

/**
 * System-generated, permanent, read-only Client code (Document Numbering Standard) —
 * CLI/<FY>/<Seq>, sequential per company within the Financial Year of creation.
 */
async function generateClientCode(companyId: string): Promise<string> {
  const fy = getFinancialYear(new Date());
  const count = await prisma.client.count({ where: { companyId, clientCode: { startsWith: `CLI/${fy}/` } } });
  return `CLI/${fy}/${padSeq(count + 1)}`;
}

export async function listClients(companyId: string, query: ClientListQuery) {
  const {
    search = "",
    status,
    page = 1,
    limit = 20,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = query;

  const where: Prisma.ClientWhereInput = {
    companyId,
    ...(status && { status }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { clientCode: { contains: search, mode: "insensitive" } },
        { contactPerson: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { gstNumber: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ],
    }),
  };

  const allowedSortFields = ["name", "status", "clientCode", "createdAt"];
  const orderByField = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";
  const skip = (Math.max(1, page) - 1) * Math.min(100, limit);
  const take = Math.min(100, limit);

  const [total, clients] = await Promise.all([
    prisma.client.count({ where }),
    prisma.client.findMany({
      where,
      orderBy: { [orderByField]: sortOrder },
      skip,
      take,
    }),
  ]);

  return { total, page, limit: take, data: clients.map(toClientDTO) };
}

export async function getClientById(id: string, companyId: string) {
  const client = await prisma.client.findFirst({
    where: { id, companyId },
  });

  if (!client) throw new Error("Client not found");

  return toClientDTO(client);
}

/**
 * Client Ledger — per-Project rollup of Running Bill certified/received/outstanding, plus the
 * Client Module's required auto-calculated totals (never manually entered, never stored):
 * Total Agreement Value = sum of every Site's Agreement Value (Site.contractValue) across the
 * Client's Projects — NOT Project.contractValue, per the "Site is the self-contained unit" rule.
 * Total RA Bills = sum of RunningBill.totalCertifiedAmount (gross certified value billed).
 * Total Client Payments = sum of RunningBillPayment.amount (actual receipts, source of truth).
 * Outstanding Amount = Total RA Bills - Total Client Payments.
 */
export async function getClientLedger(id: string, companyId: string) {
  const client = await prisma.client.findFirst({ where: { id, companyId } });
  if (!client) throw new Error("Client not found");

  const projects = await prisma.project.findMany({
    where: { companyId, clientId: id },
    select: {
      id: true,
      name: true,
      contractValue: true,
      sites: { select: { contractValue: true } },
      runningBills: {
        where: { companyId },
        select: {
          totalCertifiedAmount: true,
          amountReceived: true,
          outstandingAmount: true,
          payments: { select: { amount: true } },
        },
      },
    },
  });

  const rows = projects.map((p) => {
    const totalCertified = p.runningBills.reduce((s, b) => s + Number(b.totalCertifiedAmount), 0);
    const totalReceived = p.runningBills.reduce(
      (s, b) => s + b.payments.reduce((ps, pay) => ps + Number(pay.amount), 0),
      0
    );
    const agreementValue = p.sites.reduce((s, site) => s + Number(site.contractValue), 0);
    const outstanding = totalCertified - totalReceived;
    return {
      projectId: p.id,
      projectName: p.name,
      contractValue: p.contractValue.toString(),
      agreementValue: agreementValue.toFixed(2),
      billsCount: p.runningBills.length,
      totalCertified: totalCertified.toFixed(2),
      totalReceived: totalReceived.toFixed(2),
      outstanding: outstanding.toFixed(2),
    };
  });

  const totalAgreementValue = rows.reduce((s, r) => s + Number(r.agreementValue), 0);
  const totalRABills = rows.reduce((s, r) => s + Number(r.totalCertified), 0);
  const totalClientPayments = rows.reduce((s, r) => s + Number(r.totalReceived), 0);
  const outstandingAmount = totalRABills - totalClientPayments;

  return {
    clientId: client.id,
    clientName: client.name,
    projects: rows,
    totalCertified: totalRABills.toFixed(2),
    totalReceived: totalClientPayments.toFixed(2),
    totalOutstanding: outstandingAmount.toFixed(2),
    // Client Module auto-calculated totals (Workflow Refinement milestone, Item 3).
    totalAgreementValue: totalAgreementValue.toFixed(2),
    totalRABills: totalRABills.toFixed(2),
    totalClientPayments: totalClientPayments.toFixed(2),
    outstandingAmount: outstandingAmount.toFixed(2),
  };
}

export async function createClient(companyId: string, input: ClientFormInput) {
  if (!input.companyName?.trim()) throw new Error("Company name is required");

  const clientCode = await generateClientCode(companyId);

  const client = await prisma.client.create({
    data: {
      companyId,
      name: input.companyName.trim(),
      clientCode,
      contactPerson: input.contactPerson || null,
      phone: input.mobile || null,
      email: input.email || null,
      gstNumber: input.gst || null,
      panNumber: input.pan || null,
      address: input.address || null,
      city: input.city || null,
      state: input.state || null,
      pincode: input.pincode || null,
      website: input.website || null,
      status: input.status || "Active",
      notes: input.notes || null,
    },
  });

  return toClientDTO(client);
}

export async function updateClient(
  id: string,
  companyId: string,
  input: ClientFormInput
) {
  await getClientById(id, companyId); // verify ownership

  if (!input.companyName?.trim()) throw new Error("Company name is required");

  const client = await prisma.client.update({
    where: { id },
    data: {
      name: input.companyName.trim(),
      // clientCode is system-generated and permanent — never re-derived or overwritten on update.
      contactPerson: input.contactPerson || null,
      phone: input.mobile || null,
      email: input.email || null,
      gstNumber: input.gst || null,
      panNumber: input.pan || null,
      address: input.address || null,
      city: input.city || null,
      state: input.state || null,
      pincode: input.pincode || null,
      website: input.website || null,
      status: input.status || "Active",
      notes: input.notes || null,
    },
  });

  return toClientDTO(client);
}

/** Blocked if the client already has Projects — deactivate instead, so historical records keep a valid, readable reference. */
export async function deleteClient(id: string, companyId: string) {
  await getClientById(id, companyId); // verify ownership

  const projectCount = await prisma.project.count({ where: { clientId: id, companyId } });
  if (projectCount > 0) {
    const deactivated = await prisma.client.update({ where: { id }, data: { status: "Inactive" } });
    return { deleted: false, data: toClientDTO(deactivated) };
  }

  await prisma.client.delete({ where: { id } });
  return { deleted: true, data: null };
}
