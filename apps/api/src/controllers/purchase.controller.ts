import { Request, Response } from "express";
import prisma from "../config/prisma.js";

export const getPurchaseRequisitions = async (_req: Request, res: Response) => {
  try {
    const requisitions = await prisma.purchaseRequisition.findMany({
      include: { project: true, vendor: true },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json({ success: true, data: requisitions });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load requisitions" });
  }
};

export const createPurchaseRequisition = async (req: Request, res: Response) => {
  try {
    const requisition = await prisma.purchaseRequisition.create({ data: req.body });
    res.status(201).json({ success: true, data: requisition });
  } catch (error) {
    res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Failed to create requisition" });
  }
};

export const getPurchaseOrders = async (_req: Request, res: Response) => {
  try {
    const orders = await prisma.purchaseOrder.findMany({
      include: { vendor: true, project: true },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Failed to load purchase orders" });
  }
};

export const createPurchaseOrder = async (req: Request, res: Response) => {
  try {
    const order = await prisma.purchaseOrder.create({ data: req.body });
    res.status(201).json({ success: true, data: order });
  } catch (error) {
    res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Failed to create purchase order" });
  }
};
