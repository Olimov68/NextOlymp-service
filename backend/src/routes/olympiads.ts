import { Router, Request, Response } from "express";
import prisma from "../prisma";
import { authenticate, requireAdmin, AuthRequest } from "../middleware/auth";

const router = Router();

router.get("/", async (_req: Request, res: Response) => {
  try {
    const olympiads = await prisma.olympiad.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { questions: true } } },
    });
    res.json(olympiads);
  } catch (error) {
    res.status(500).json({ error: "Failed to get olympiads" });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const olympiad = await prisma.olympiad.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { _count: { select: { questions: true } } },
    });
    if (!olympiad) {
      res.status(404).json({ error: "Olympiad not found" });
      return;
    }
    res.json(olympiad);
  } catch (error) {
    res.status(500).json({ error: "Failed to get olympiad" });
  }
});

router.post("/", authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { title, subject, description, price, status, startDate, endDate } = req.body;
    const olympiad = await prisma.olympiad.create({
      data: {
        title,
        subject,
        description: description || "",
        price: price || 0,
        status: status || "upcoming",
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      },
    });
    res.json(olympiad);
  } catch (error) {
    res.status(500).json({ error: "Failed to create olympiad" });
  }
});

router.put("/:id", authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { title, subject, description, price, status, startDate, endDate } = req.body;
    const olympiad = await prisma.olympiad.update({
      where: { id: parseInt(req.params.id) },
      data: {
        ...(title !== undefined && { title }),
        ...(subject !== undefined && { subject }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price }),
        ...(status !== undefined && { status }),
        ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
      },
    });
    res.json(olympiad);
  } catch (error) {
    res.status(500).json({ error: "Failed to update olympiad" });
  }
});

router.delete("/:id", authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.olympiad.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete olympiad" });
  }
});

export default router;
