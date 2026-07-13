import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware.js";
import {
  listEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} from "../services/employee.service.js";

const notFoundMessage = "Employee not found";

export const getEmployees = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const { search, status, department, page, limit, sortBy, sortOrder } = req.query;

    const result = await listEmployees(companyId, {
      search: search as string,
      status: status as string,
      department: department as string,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      sortBy: sortBy as string,
      sortOrder: (sortOrder as "asc" | "desc") || undefined,
    });

    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load employees" });
  }
};

export const getEmployee = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const employee = await getEmployeeById(id, companyId);
    res.status(200).json({ success: true, data: employee });
  } catch (error) {
    const is404 = error instanceof Error && error.message === notFoundMessage;
    res.status(is404 ? 404 : 500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load employee" });
  }
};

export const createEmployeeHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const employee = await createEmployee(companyId, req.body);
    res.status(201).json({ success: true, data: employee });
  } catch (error) {
    res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Failed to create employee" });
  }
};

export const updateEmployeeHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const employee = await updateEmployee(id, companyId, req.body);
    res.status(200).json({ success: true, data: employee });
  } catch (error) {
    const is404 = error instanceof Error && error.message === notFoundMessage;
    res.status(is404 ? 404 : 400).json({ success: false, message: error instanceof Error ? error.message : "Failed to update employee" });
  }
};

export const deleteEmployeeHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await deleteEmployee(id, companyId);
    if (result.deleted) {
      res.status(200).json({ success: true, message: "Employee deleted" });
    } else {
      res.status(200).json({ success: true, message: "Employee has allocated transactions — deactivated instead of deleted", data: result.data });
    }
  } catch (error) {
    const is404 = error instanceof Error && error.message === notFoundMessage;
    res.status(is404 ? 404 : 400).json({ success: false, message: error instanceof Error ? error.message : "Failed to delete employee" });
  }
};
