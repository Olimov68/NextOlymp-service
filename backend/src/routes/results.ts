import { Router, Request, Response } from "express";
import prisma from "../prisma";
import { authenticate, requireAdmin, AuthRequest } from "../middleware/auth";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    const { subject } = req.query;
    const where = subject ? { subject: String(subject).toLowerCase() } : {};

    const results = await prisma.result.findMany({
      where,
      include: { user: { select: { firstName: true, lastName: true, country: true } } },
      orderBy: { score: "desc" },
    });

    const ranked = results.map((r, i) => ({
      rank: i + 1,
      name: `${r.user.firstName} ${r.user.lastName}`,
      country: r.country || r.user.country,
      score: r.score,
      medal: r.medal,
      subject: r.subject,
    }));

    res.json(ranked);
  } catch (error) {
    console.error("Results error:", error);
    res.status(500).json({ error: "Failed to get results", detail: String(error) });
  }
});

router.post("/", authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { userId, olympiadId, subject, score, medal, country } = req.body;
    const result = await prisma.result.create({
      data: {
        userId,
        olympiadId,
        subject: subject.toLowerCase(),
        score,
        medal: medal || "",
        country: country || "",
      },
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to create result" });
  }
});

router.post("/bulk", authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { results: items } = req.body;
    const created = await prisma.result.createMany({ data: items });
    res.json({ count: created.count });
  } catch (error) {
    res.status(500).json({ error: "Failed to bulk create results" });
  }
});

router.delete("/:id", authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.result.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete result" });
  }
});

export default router;
