import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware.js";
import {
  listInventory,
  getInventoryById,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  adjustInventoryStock,
  getStockLedger,
  getLowStockAlerts,
  getInventoryDashboard,
  exportInventoryToCSV,
} from "../services/inventory.service.js";

export const getInventoryItems = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const { search, status, category, warehouse, projectId, supplierId, page, limit, sortBy, sortOrder } = req.query;

    const result = await listInventory(companyId, {
      search: search as string,
      status: status as string,
      category: category as string,
      warehouse: warehouse as string,
      projectId: projectId as string,
      supplierId: supplierId as string,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      sortBy: sortBy as string,
      sortOrder: (sortOrder as "asc" | "desc") || undefined,
    });

    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load inventory" });
  }
};

export const getInventoryItem = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const item = await getInventoryById(id, companyId);
    res.status(200).json({ success: true, data: item });
  } catch (error) {
    const is404 = error instanceof Error && error.message === "Inventory item not found";
    res.status(is404 ? 404 : 500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load inventory item" });
  }
};

export const createInventoryItemHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const item = await createInventoryItem(companyId, req.body);
    res.status(201).json({ success: true, data: item });
  } catch (error) {
    res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Failed to create inventory item" });
  }
};

export const updateInventoryItemHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const item = await updateInventoryItem(id, companyId, req.body);
    res.status(200).json({ success: true, data: item });
  } catch (error) {
    const is404 = error instanceof Error && error.message === "Inventory item not found";
    res.status(is404 ? 404 : 400).json({ success: false, message: error instanceof Error ? error.message : "Failed to update inventory item" });
  }
};

export const deleteInventoryItemHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await deleteInventoryItem(id, companyId);
    res.status(200).json({ success: true, message: "Inventory item deleted" });
  } catch (error) {
    const is404 = error instanceof Error && error.message === "Inventory item not found";
    res.status(is404 ? 404 : 400).json({ success: false, message: error instanceof Error ? error.message : "Failed to delete inventory item" });
  }
};

export const adjustInventoryStockHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const item = await adjustInventoryStock(id, companyId, req.body);
    res.status(200).json({ success: true, data: item });
  } catch (error) {
    const is404 = error instanceof Error && error.message === "Inventory item not found";
    res.status(is404 ? 404 : 400).json({ success: false, message: error instanceof Error ? error.message : "Failed to adjust stock" });
  }
};

export const getStockLedgerHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const { inventoryId, movementType, fromDate, toDate, page, limit } = req.query;

    const result = await getStockLedger(companyId, {
      inventoryId: inventoryId as string,
      movementType: movementType as string,
      fromDate: fromDate as string,
      toDate: toDate as string,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });

    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load stock ledger" });
  }
};

export const getLowStockAlertsHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const alerts = await getLowStockAlerts(companyId);
    res.status(200).json({ success: true, data: alerts });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load low stock alerts" });
  }
};

export const getInventoryDashboardHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const summary = await getInventoryDashboard(companyId);
    res.status(200).json({ success: true, data: summary });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load inventory dashboard" });
  }
};

export const exportInventoryHandler = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const { search, status, category, warehouse, projectId, supplierId } = req.query;

    const csv = await exportInventoryToCSV(companyId, {
      search: search as string,
      status: status as string,
      category: category as string,
      warehouse: warehouse as string,
      projectId: projectId as string,
      supplierId: supplierId as string,
    });

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="inventory-export-${Date.now()}.csv"`);
    res.status(200).send(csv);
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to export inventory" });
  }
};
