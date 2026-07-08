import { Request, Response } from "express";
import {
  registerUser,
  loginUser,
  getProfile,
} from "../services/auth.service.js";
import { AuthRequest } from "../middleware/auth.middleware.js";

export const health = (_req: Request, res: Response) => {
  res.json({
    success: true,
    module: "Authentication",
    message: "Auth module is working",
  });
};

export const register = async (req: Request, res: Response) => {
  try {
    const user = await registerUser(req.body);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: user,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Registration failed",
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const result = await loginUser(email, password);

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: result,
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error instanceof Error ? error.message : "Login failed",
    });
  }
};

export const profile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const user = await getProfile(userId);

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