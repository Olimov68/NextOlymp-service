import { Router, Request, Response } from "express";
import prisma from "../prisma";
import { authenticate, requireAdmin, AuthRequest } from "../middleware/auth";

const router = Router();

// Get questions for an olympiad
router.get("/olympiad/:olympiadId", async (req: Request, res: Response) => {
  try {
    const questions = await prisma.question.findMany({
      where: { olympiadId: parseInt(req.params.olympiadId) },
      orderBy: { orderNum: "asc" },
    });
    res.json(questions);
  } catch (error) {
    res.status(500).json({ error: "Failed to get questions" });
  }
});

// Create question
router.post("/", authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { olympiadId, text, image, options, correctIdx, points, orderNum } = req.body;
    const question = await prisma.question.create({
      data: {
        olympiadId,
        text,
        image: image || "",
        options: options || [],
        correctIdx: correctIdx ?? 0,
        points: points || 1,
        orderNum: orderNum || 0,
      },
    });
    res.json(question);
  } catch (error) {
    res.status(500).json({ error: "Failed to create question" });
  }
});

// Update question
router.put("/:id", authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { text, image, options, correctIdx, points, orderNum } = req.body;
    const question = await prisma.question.update({
      where: { id: parseInt(req.params.id) },
      data: {
        ...(text !== undefined && { text }),
        ...(image !== undefined && { image }),
        ...(options !== undefined && { options }),
        ...(correctIdx !== undefined && { correctIdx }),
        ...(points !== undefined && { points }),
        ...(orderNum !== undefined && { orderNum }),
      },
    });
    res.json(question);
  } catch (error) {
    res.status(500).json({ error: "Failed to update question" });
  }
});

// Delete question
router.delete("/:id", authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.question.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete question" });
  }
});

export default router;
