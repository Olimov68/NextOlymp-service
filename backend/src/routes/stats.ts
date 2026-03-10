import { Router, Request, Response } from "express";
import prisma from "../prisma";
import { authenticate, requireAdmin, AuthRequest } from "../middleware/auth";

const router = Router();

router.get("/", async (_req: Request, res: Response) => {
  try {
    let stats = await prisma.stats.findFirst();
    if (!stats) {
      stats = await prisma.stats.create({
        data: { countries: 20, students: 75000, medals: 1000, volunteers: 200 },
      });
    }
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: "Failed to get stats" });
  }
});

router.put("/", authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { countries, students, medals, volunteers } = req.body;
    let stats = await prisma.stats.findFirst();
    if (stats) {
      stats = await prisma.stats.update({
        where: { id: stats.id },
        data: { countries, students, medals, volunteers },
      });
    } else {
      stats = await prisma.stats.create({
        data: { countries, students, medals, volunteers },
      });
    }
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: "Failed to update stats" });
  }
});

export default router;
