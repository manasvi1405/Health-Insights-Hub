import { Router } from "express";
import jwt from "jsonwebtoken";
import { connectMongo, UserModel } from "./mongo";

const router = Router();
const JWT_SECRET = process.env.SESSION_SECRET || "sehat-saathi-secret";

const DEV_PHONE = "8446530525";
const DEV_OTP = "12345";

router.post("/send-otp", async (req, res) => {
  try {
    await connectMongo();
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: "Phone is required" });

    const otp = phone === DEV_PHONE ? DEV_OTP : Math.floor(100000 * Math.random()).toString().padStart(5, "0");
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    await UserModel.findOneAndUpdate(
      { phone },
      { otp, otpExpiry },
      { upsert: true, new: true }
    );

    if (phone !== DEV_PHONE) {
      req.log.info({ phone }, "OTP generated (Twilio not configured in dev)");
    }

    res.json({ message: phone === DEV_PHONE ? "Dev OTP: 12345" : "OTP sent successfully" });
  } catch (err) {
    req.log.error(err, "send-otp error");
    res.status(500).json({ error: "Failed to send OTP" });
  }
});

router.post("/verify-otp", async (req, res) => {
  try {
    await connectMongo();
    const { phone, otp, name } = req.body;
    if (!phone || !otp) return res.status(400).json({ error: "Phone and OTP required" });

    const user = await UserModel.findOne({ phone });
    if (!user) return res.status(400).json({ error: "User not found, send OTP first" });

    const isValid = user.otp === otp && (user.otpExpiry ? user.otpExpiry > new Date() : true);
    if (!isValid && !(phone === DEV_PHONE && otp === DEV_OTP)) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    if (name && !user.name) {
      user.name = name;
      user.profileComplete = true;
    }
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    const token = jwt.sign({ userId: user._id, phone }, JWT_SECRET, { expiresIn: "30d" });

    res.json({ token, user: { _id: user._id, name: user.name, phone: user.phone, age: user.age, language: user.language, bloodGroup: user.bloodGroup, address: user.address, profileComplete: user.profileComplete } });
  } catch (err) {
    req.log.error(err, "verify-otp error");
    res.status(500).json({ error: "Verification failed" });
  }
});

export default router;
export { JWT_SECRET };
