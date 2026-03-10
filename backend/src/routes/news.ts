import { Router, Request, Response } from "express";
import prisma from "../prisma";
import { authenticate, requireAdmin, AuthRequest } from "../middleware/auth";

const router = Router();

router.get("/", async (_req: Request, res: Response) => {
  try {
    const news = await prisma.news.findMany({ orderBy: { createdAt: "desc" } });
    res.json(news);
  } catch (error) {
    res.status(500).json({ error: "Failed to get news" });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const article = await prisma.news.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!article) {
      res.status(404).json({ error: "News not found" });
      return;
    }
    res.json(article);
  } catch (error) {
    res.status(500).json({ error: "Failed to get news" });
  }
});

router.post("/", authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, image } = req.body;
    const article = await prisma.news.create({ data: { title, description, image: image || "" } });
    res.json(article);
  } catch (error) {
    res.status(500).json({ error: "Failed to create news" });
  }
});

router.put("/:id", authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, image } = req.body;
    const article = await prisma.news.update({
      where: { id: parseInt(req.params.id) },
      data: { title, description, image },
    });
    res.json(article);
  } catch (error) {
    res.status(500).json({ error: "Failed to update news" });
  }
});

router.delete("/:id", authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.news.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete news" });
  }
});

export default router;
