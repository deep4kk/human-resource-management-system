import { Router } from "express";
import crypto from "crypto";
import { User, PasswordReset } from "@hrms/db";
import { hashPassword } from "../lib/auth.js";
import { sendPasswordResetEmail } from "../lib/email.js";

const router = Router();

router.post("/forgot", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ error: "Bad Request", message: "Email required" });
      return;
    }

    const user = await User.findOne({ email });
    if (!user) {
      res.json({ message: "If the email exists, a reset link has been sent" });
      return;
    }

    const token = crypto.randomBytes(32).toString("hex");
    await PasswordReset.create({
      email,
      token,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });

    const resetLink = `${process.env.FRONTEND_URL || "http://localhost:3001"}/reset-password?token=${token}`;
    await sendPasswordResetEmail(email, resetLink);

    res.json({ message: "If the email exists, a reset link has been sent" });
  } catch (err) {
    req.log.error({ err }, "Forgot password error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/reset", async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password || password.length < 8) {
      res.status(400).json({ error: "Bad Request", message: "Valid token and password (min 8 chars) required" });
      return;
    }

    const reset = await PasswordReset.findOne({ token, used: false, expiresAt: { $gt: new Date() } });
    if (!reset) {
      res.status(400).json({ error: "Bad Request", message: "Invalid or expired token" });
      return;
    }

    const passwordHash = await hashPassword(password);
    await User.updateOne({ email: reset.email }, { $set: { passwordHash } });
    await PasswordReset.updateOne({ _id: reset._id }, { $set: { used: true } });

    res.json({ message: "Password reset successful" });
  } catch (err) {
    req.log.error({ err }, "Reset password error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
