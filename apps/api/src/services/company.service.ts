import prisma from "../config/prisma.js";

export async function getCompany(companyId: string) {
  const company = await prisma.company.findFirst({ where: { id: companyId } });

  if (!company) {
    throw new Error("Company not found");
  }

  return company;
}

interface UpdateCompanyInput {
  name?: string;
  gstNumber?: string;
  panNumber?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  logo?: string;
}

export async function updateCompany(companyId: string, data: UpdateCompanyInput) {
  const company = await prisma.company.findFirst({ where: { id: companyId } });

  if (!company) {
    throw new Error("Company not found");
  }

  return prisma.company.update({
    where: {
      id: company.id,
    },
    data,
  });
}