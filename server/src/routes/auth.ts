import { Router } from "express";
import { User, Company } from "@hrms/db";
import { hashPassword, verifyPassword, generateToken, requireAuth, LoginBody, SignupBody } from "../lib/auth.js";
import { logAudit } from "../lib/audit.js";

const router = Router();

router.post("/login", async (req, res) => {
  try {
    const parsed = LoginBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Bad Request", message: parsed.error.errors[0]?.message || "Invalid input" });
      return;
    }
    const { email, password } = parsed.data;
    const user = await User.findOne({ email });
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      res.status(401).json({ error: "Unauthorized", message: "Invalid credentials" });
      return;
    }
    if (!user.isActive) {
      res.status(401).json({ error: "Unauthorized", message: "Account is inactive" });
      return;
    }
    const token = generateToken(user._id.toString(), user.role, user.companyId?.toString());

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        employeeId: user.employeeId,
        avatar: user.avatar,
        companyId: user.companyId,
      },
    });
  } catch (err) {
    req.log.error({ err }, "Login error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/signup", async (req, res) => {
  try {
    const parsed = SignupBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Bad Request", message: parsed.error.errors[0]?.message || "Invalid input" });
      return;
    }
    const { companyName, email, password, name } = parsed.data;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(409).json({ error: "Conflict", message: "Email already registered" });
      return;
    }

    const slug = companyName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const passwordHash = await hashPassword(password);

    const company = await Company.create({ name: companyName, email, passwordHash, slug });
    const user = await User.create({ email, passwordHash, name, role: "admin", companyId: company._id, isActive: true });
    const token = generateToken(user._id.toString(), user.role, company._id.toString());

    (req as any).userName = name;
    await logAudit(req, "company.signup", "Company", company._id.toString(), { companyName });

    res.status(201).json({
      token,
      user: { id: user._id, email: user.email, name: user.name, role: user.role, companyId: company._id },
    });
  } catch (err) {
    req.log.error({ err }, "Signup error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/me", requireAuth, async (req, res) => {
  try {
    const { userId } = req.user!;
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ error: "Not Found" });
      return;
    }
    res.json({
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      employeeId: user.employeeId,
      avatar: user.avatar,
      companyId: user.companyId,
    });
  } catch (err) {
    req.log.error({ err }, "Get me error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
