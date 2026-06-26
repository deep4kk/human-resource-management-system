import { Router } from "express";
import { Employee, Department, User } from "@hrms/db";
import { requireAuth } from "../lib/auth.js";
import { hashPassword } from "../lib/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/", async (req, res) => {
  try {
    const { department, search, status, page = 1, limit = 20 } = req.query;
    const { companyId } = (req as any).user;
    const filter: any = { companyId };
    if (status) filter.status = status;
    if (department) filter.departmentId = department;
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { employeeCode: { $regex: search, $options: "i" } },
      ];
    }

    const offset = (Number(page) - 1) * Number(limit);
    const [employees, total] = await Promise.all([
      Employee.find(filter).populate("departmentId", "name").sort({ createdAt: -1 }).skip(offset).limit(Number(limit)),
      Employee.countDocuments(filter),
    ]);

    const managerIds = [...new Set(employees.filter((e) => e.managerId).map((e) => e.managerId!.toString()))];
    const managers: Record<string, string> = {};
    if (managerIds.length > 0) {
      const mgrs = await Employee.find({ _id: { $in: managerIds } }, "firstName lastName");
      mgrs.forEach((m) => { managers[m._id.toString()] = `${m.firstName} ${m.lastName}`; });
    }

    res.json({
      employees: employees.map((e) => ({
        id: e._id,
        employeeCode: e.employeeCode,
        firstName: e.firstName,
        lastName: e.lastName,
        email: e.email,
        phone: e.phone,
        avatar: e.avatar,
        departmentId: e.departmentId?._id,
        departmentName: (e.departmentId as any)?.name || null,
        designation: e.designation,
        role: e.role,
        status: e.status,
        joinDate: e.joinDate,
        salary: e.salary,
        managerId: e.managerId,
        managerName: e.managerId ? managers[e.managerId.toString()] || null : null,
        address: e.address,
        dateOfBirth: e.dateOfBirth,
        gender: e.gender,
        createdAt: e.createdAt.toISOString(),
      })),
      total,
      page: Number(page),
      limit: Number(limit),
    });
  } catch (err) {
    req.log.error({ err }, "List employees error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { companyId } = (req as any).user;
    const { firstName, lastName, email, phone, departmentId, designation, role, joinDate, salary, managerId, address, dateOfBirth, gender, password } = req.body;

    const count = await Employee.countDocuments({ companyId });
    const employeeCode = `TK${String(count + 1).padStart(4, "0")}`;

    const employee = await Employee.create({
      employeeCode, firstName, lastName, email, phone: phone || null,
      departmentId: departmentId || null, designation: designation || null,
      role: role || "employee", joinDate: joinDate || null,
      salary: salary || null, managerId: managerId || null,
      address: address || null, dateOfBirth: dateOfBirth || null,
      gender: gender || null, companyId,
    });

    if (password) {
      await User.create({
        email, passwordHash: await hashPassword(password),
        name: `${firstName} ${lastName}`, role: role || "employee",
        employeeId: employee._id, companyId,
      }).catch(() => {});
    }

    const dept = departmentId ? await Department.findById(departmentId, "name") : null;

    res.status(201).json({
      id: employee._id,
      employeeCode: employee.employeeCode,
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      phone: employee.phone,
      departmentName: dept?.name || null,
      designation: employee.designation,
      role: employee.role,
      status: employee.status,
      joinDate: employee.joinDate,
      salary: employee.salary,
      managerName: null,
      createdAt: employee.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Create employee error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id).populate("departmentId", "name");
    if (!employee) { res.status(404).json({ error: "Not Found" }); return; }

    let managerName = null;
    if (employee.managerId) {
      const mgr = await Employee.findById(employee.managerId, "firstName lastName");
      if (mgr) managerName = `${mgr.firstName} ${mgr.lastName}`;
    }

    res.json({
      id: employee._id,
      employeeCode: employee.employeeCode,
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      phone: employee.phone,
      avatar: employee.avatar,
      departmentId: employee.departmentId?._id,
      departmentName: (employee.departmentId as any)?.name || null,
      designation: employee.designation,
      role: employee.role,
      status: employee.status,
      joinDate: employee.joinDate,
      salary: employee.salary,
      managerId: employee.managerId,
      managerName,
      address: employee.address,
      dateOfBirth: employee.dateOfBirth,
      gender: employee.gender,
      createdAt: employee.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Get employee error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { firstName, lastName, email, phone, departmentId, designation, role, status, joinDate, salary, managerId, address, dateOfBirth, gender } = req.body;
    const update: any = {};
    if (firstName !== undefined) update.firstName = firstName;
    if (lastName !== undefined) update.lastName = lastName;
    if (email !== undefined) update.email = email;
    if (phone !== undefined) update.phone = phone || null;
    if (departmentId !== undefined) update.departmentId = departmentId || null;
    if (designation !== undefined) update.designation = designation || null;
    if (role !== undefined) update.role = role;
    if (status !== undefined) update.status = status;
    if (joinDate !== undefined) update.joinDate = joinDate || null;
    if (salary !== undefined) update.salary = salary || null;
    if (managerId !== undefined) update.managerId = managerId || null;
    if (address !== undefined) update.address = address || null;
    if (dateOfBirth !== undefined) update.dateOfBirth = dateOfBirth || null;
    if (gender !== undefined) update.gender = gender || null;

    const employee = await Employee.findByIdAndUpdate(req.params.id, { $set: update }, { new: true });
    if (!employee) { res.status(404).json({ error: "Not Found" }); return; }

    res.json({
      ...employee.toObject(),
      id: employee._id,
      salary: employee.salary,
      createdAt: employee.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Update employee error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await Employee.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Employee deleted" });
  } catch (err) {
    req.log.error({ err }, "Delete employee error");
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
