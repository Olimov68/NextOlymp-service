import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../prisma";
import { authenticate, AuthRequest } from "../middleware/auth";

const router = Router();

// Register - all fields required
router.post("/register", async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, username, email, password, region, district, city, grade } = req.body;

    if (!firstName || !lastName || !username || !email || !password || !region || !district || !city || !grade) {
      res.status(400).json({ error: "All fields are required" });
      return;
    }

    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      res.status(400).json({ error: "Email already registered" });
      return;
    }

    const existingUsername = await prisma.user.findUnique({ where: { username } });
    if (existingUsername) {
      res.status(400).json({ error: "Username already taken" });
      return;
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        username,
        email,
        password: hashed,
        region,
        district,
        city,
        grade,
        country: "UZ",
      },
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        email: user.email,
        role: user.role,
        region: user.region,
        district: user.district,
        city: user.city,
        grade: user.grade,
        country: user.country,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Registration failed" });
  }
});

// Login - username + password
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        email: user.email,
        role: user.role,
        region: user.region,
        district: user.district,
        city: user.city,
        grade: user.grade,
        country: user.country,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Login failed" });
  }
});

// Get current user
router.get("/me", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        username: true,
        email: true,
        role: true,
        region: true,
        district: true,
        city: true,
        grade: true,
        country: true,
      },
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Failed to get user" });
  }
});

// Update profile
router.put("/profile", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { firstName, lastName, email, region, district, city, grade } = req.body;
    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(email && { email }),
        ...(region && { region }),
        ...(district && { district }),
        ...(city && { city }),
        ...(grade && { grade }),
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        username: true,
        email: true,
        role: true,
        region: true,
        district: true,
        city: true,
        grade: true,
        country: true,
      },
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Failed to update profile" });
  }
});

export default router;
