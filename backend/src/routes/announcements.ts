import { Router, Request, Response } from "express";
import prisma from "../prisma";
import { authenticate, requireAdmin, AuthRequest } from "../middleware/auth";

const router = Router();

router.get("/", async (_req: Request, res: Response) => {
  try {
    const announcements = await prisma.announcement.findMany({ orderBy: { createdAt: "desc" } });
    res.json(announcements);
  } catch (error) {
    res.status(500).json({ error: "Failed to get announcements" });
  }
});

router.post("/", authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { title, description } = req.body;
    const announcement = await prisma.announcement.create({ data: { title, description } });
    res.json(announcement);
  } catch (error) {
    res.status(500).json({ error: "Failed to create announcement" });
  }
});

router.put("/:id", authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { title, description } = req.body;
    const announcement = await prisma.announcement.update({
      where: { id: parseInt(req.params.id) },
      data: { title, description },
    });
    res.json(announcement);
  } catch (error) {
    res.status(500).json({ error: "Failed to update announcement" });
  }
});

router.delete("/:id", authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.announcement.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete announcement" });
  }
});

export default router;
