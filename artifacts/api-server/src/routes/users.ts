import { Router } from "express";
import { requireAuth, AuthRequest } from "./authMiddleware";
import { connectMongo, UserModel } from "./mongo";

const router = Router();

router.get("/me", requireAuth, async (req: AuthRequest, res) => {
  try {
    await connectMongo();
    const user = await UserModel.findById(req.userId).lean();
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    req.log.error(err, "getMe error");
    res.status(500).json({ error: "Failed to get user" });
  }
});

router.put("/me", requireAuth, async (req: AuthRequest, res) => {
  try {
    await connectMongo();
    const { name, age, language, bloodGroup, address } = req.body;
    const user = await UserModel.findByIdAndUpdate(
      req.userId,
      { name, age, language, bloodGroup, address, profileComplete: true },
      { new: true, lean: true }
    );
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    req.log.error(err, "updateMe error");
    res.status(500).json({ error: "Failed to update user" });
  }
});

export default router;
