import { Router } from "express";
import { User, Company } from "@hrms/db";
import { requireAuth, requireRole, generateToken, verifyPassword } from "../lib/auth.js";

const router = Router();

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: "Bad Request", message: "Email and password required" });
      return;
    }
    const user = await User.findOne({ email, role: "superadmin" });
    if (!user) {
      res.status(401).json({ error: "Unauthorized", message: "Not authorized as super admin" });
      return;
    }
    if (!(await verifyPassword(password, user.passwordHash))) {
      res.status(401).json({ error: "Unauthorized", message: "Invalid credentials" });
      return;
    }
    const token = generateToken(user._id.toString(), user.role);
    res.json({ token, user: { id: user._id, email: user.email, name: user.name, role: user.role } });
  } catch (err) {
    req.log.error({ err }, "Admin login error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.use(requireAuth);
router.use(requireRole("superadmin"));

router.get("/companies", async (req, res) => {
  try {
    const companies = await Company.find().sort({ createdAt: -1 });
    const result = await Promise.all(
      companies.map(async (c) => {
        const userCount = await User.countDocuments({ companyId: c._id });
        return { id: c._id, name: c.name, email: c.email, slug: c.slug, isActive: c.isActive, userCount, createdAt: c.createdAt.toISOString() };
      }),
    );
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "List companies error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.patch("/companies/:id/toggle", async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) { res.status(404).json({ error: "Not Found" }); return; }
    company.isActive = !company.isActive;
    await company.save();
    await User.updateMany({ companyId: company._id }, { $set: { isActive: company.isActive } });
    res.json({ success: true, isActive: company.isActive });
  } catch (err) {
    req.log.error({ err }, "Toggle company error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/users", async (req, res) => {
  try {
    const { companyId } = req.query;
    const filter: any = {};
    if (companyId) filter.companyId = companyId;
    const users = await User.find(filter).populate("companyId", "name").sort({ createdAt: -1 });
    res.json(users.map((u) => ({
      id: u._id, email: u.email, name: u.name, role: u.role,
      isActive: u.isActive, companyName: (u.companyId as any)?.name || null,
      companyId: u.companyId?._id || u.companyId,
      createdAt: u.createdAt!.toISOString(),
    })));
  } catch (err) {
    req.log.error({ err }, "List users error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.patch("/users/:id/toggle", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) { res.status(404).json({ error: "Not Found" }); return; }
    user.isActive = !user.isActive;
    await user.save();
    res.json({ success: true, isActive: user.isActive });
  } catch (err) {
    req.log.error({ err }, "Toggle user error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.put("/users/:id/role", async (req, res) => {
  try {
    const { role } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { $set: { role } }, { new: true });
    if (!user) { res.status(404).json({ error: "Not Found" }); return; }
    res.json({ success: true, role: user.role });
  } catch (err) {
    req.log.error({ err }, "Update user role error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
