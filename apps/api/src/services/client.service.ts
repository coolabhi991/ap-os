import prisma from "../config/prisma.js";
import { Prisma } from "@prisma/client";

export interface ClientFormInput {
  companyName: string;
  clientCode?: string;
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

export async function createClient(companyId: string, input: ClientFormInput) {
  if (!input.companyName?.trim()) throw new Error("Company name is required");

  const client = await prisma.client.create({
    data: {
      companyId,
      name: input.companyName.trim(),
      clientCode: input.clientCode || null,
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
      clientCode: input.clientCode || null,
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

export async function deleteClient(id: string, companyId: string) {
  await getClientById(id, companyId); // verify ownership
  return prisma.client.delete({ where: { id } });
}
