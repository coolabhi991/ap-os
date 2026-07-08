import prisma from "../config/prisma.js";
import { Prisma } from "@prisma/client";

export interface VendorFormInput {
  name: string;
  vendorCode?: string;
  category?: string;
  contactPerson?: string;
  mobile?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  gst?: string;
  pan?: string;
  notes?: string;
  status?: string;
}

export interface VendorListQuery {
  search?: string;
  status?: string;
  category?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

type VendorRow = {
  id: string;
  companyId: string;
  name: string;
  vendorCode: string | null;
  category: string | null;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  gstNumber: string | null;
  panNumber: string | null;
  notes: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

/** Map DB row → frontend-friendly shape. */
function toVendorDTO(v: VendorRow) {
  return {
    id: v.id,
    companyId: v.companyId,
    name: v.name,
    vendorCode: v.vendorCode ?? "",
    category: v.category ?? "",
    contactPerson: v.contactPerson ?? "",
    mobile: v.phone ?? "",
    email: v.email ?? "",
    address: v.address ?? "",
    city: v.city ?? "",
    state: v.state ?? "",
    pincode: v.pincode ?? "",
    gst: v.gstNumber ?? "",
    pan: v.panNumber ?? "",
    notes: v.notes ?? "",
    status: v.status,
    createdAt: v.createdAt.toISOString(),
    updatedAt: v.updatedAt.toISOString(),
  };
}

export async function listVendors(companyId: string, query: VendorListQuery) {
  const {
    search = "",
    status,
    category,
    page = 1,
    limit = 20,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = query;

  const where: Prisma.VendorWhereInput = {
    companyId,
    ...(status && { status }),
    ...(category && { category }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { vendorCode: { contains: search, mode: "insensitive" } },
        { contactPerson: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { gstNumber: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { category: { contains: search, mode: "insensitive" } },
      ],
    }),
  };

  const allowedSortFields = ["name", "status", "category", "vendorCode", "createdAt"];
  const orderByField = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";
  const skip = (Math.max(1, page) - 1) * Math.min(100, limit);
  const take = Math.min(100, limit);

  const [total, vendors] = await Promise.all([
    prisma.vendor.count({ where }),
    prisma.vendor.findMany({ where, orderBy: { [orderByField]: sortOrder }, skip, take }),
  ]);

  return { total, page, limit: take, data: vendors.map(toVendorDTO) };
}

export async function getVendorById(id: string, companyId: string) {
  const vendor = await prisma.vendor.findFirst({ where: { id, companyId } });
  if (!vendor) throw new Error("Vendor not found");
  return toVendorDTO(vendor);
}

export async function createVendor(companyId: string, input: VendorFormInput) {
  if (!input.name?.trim()) throw new Error("Vendor name is required");

  const vendor = await prisma.vendor.create({
    data: {
      companyId,
      name: input.name.trim(),
      vendorCode: input.vendorCode || null,
      category: input.category || null,
      contactPerson: input.contactPerson || null,
      phone: input.mobile || null,
      email: input.email || null,
      address: input.address || null,
      city: input.city || null,
      state: input.state || null,
      pincode: input.pincode || null,
      gstNumber: input.gst || null,
      panNumber: input.pan || null,
      notes: input.notes || null,
      status: input.status || "Active",
    },
  });

  return toVendorDTO(vendor);
}

export async function updateVendor(
  id: string,
  companyId: string,
  input: VendorFormInput
) {
  await getVendorById(id, companyId); // verify ownership

  if (!input.name?.trim()) throw new Error("Vendor name is required");

  const vendor = await prisma.vendor.update({
    where: { id },
    data: {
      name: input.name.trim(),
      vendorCode: input.vendorCode || null,
      category: input.category || null,
      contactPerson: input.contactPerson || null,
      phone: input.mobile || null,
      email: input.email || null,
      address: input.address || null,
      city: input.city || null,
      state: input.state || null,
      pincode: input.pincode || null,
      gstNumber: input.gst || null,
      panNumber: input.pan || null,
      notes: input.notes || null,
      status: input.status || "Active",
    },
  });

  return toVendorDTO(vendor);
}

export async function deleteVendor(id: string, companyId: string) {
  await getVendorById(id, companyId); // verify ownership
  return prisma.vendor.delete({ where: { id } });
}
