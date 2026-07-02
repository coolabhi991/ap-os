import { Request, Response } from "express";
import {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  updateUserStatus,
} from "../services/user.service.js";

export const create = async (req: Request, res: Response) => {
  try {
    const user = await createUser(req.body);

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: user,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "User creation failed",
    });
  }
};

export const list = async (_req: Request, res: Response) => {
  try {
    const users = await getUsers();

    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to fetch users",
    });
  }
};

export const getById = async (req: Request, res: Response) => {
  try {
    const user = await getUserById(req.params.id);

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error instanceof Error ? error.message : "User not found",
    });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const user = await updateUser(req.params.id, req.body);

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: user,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Update failed",
    });
  }
};

export const updateStatus = async (req: Request, res: Response) => {
  try {
    const user = await updateUserStatus(req.params.id, req.body);

    res.status(200).json({
      success: true,
      message: "User status updated successfully",
      data: user,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Status update failed",
    });
  }
};