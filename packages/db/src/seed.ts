import { connectDB, disconnectDB, User, Company, Employee, Department, Branding } from "./index.js";
import crypto from "crypto";

const SALT = "hrms_salt_flowmative";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + SALT).digest("hex");
}

async function seed() {
  console.log("Starting database seed...\n");

  await connectDB();

  try {
    const existingUsers = await User.findOne();
    if (existingUsers) {
      console.log("Database already has users. Skipping seed.\n");
      return;
    }

    // Create super admin company
    console.log("Creating super admin...");
    const superAdmin = await User.create({
      email: "superadmin@hrms.com",
      passwordHash: hashPassword("superadmin123"),
      name: "Super Admin",
      role: "superadmin",
      isActive: true,
    });
    console.log(`  Created super admin: superadmin@hrms.com / superadmin123\n`);

    // Create demo company
    console.log("Creating demo company...");
    const company = await Company.create({
      name: "Flowmative",
      email: "admin@flowmative.com",
      passwordHash: hashPassword("admin123"),
      slug: "flowmative",
      isActive: true,
    });
    console.log(`  Created company: Flowmative\n`);

    // Create departments
    console.log("Creating departments...");
    const deptNames = [
      { name: "Engineering", description: "Software development and technical teams" },
      { name: "Human Resources", description: "HR and people operations" },
      { name: "Marketing", description: "Marketing and communications" },
      { name: "Finance", description: "Finance and accounting" },
      { name: "Operations", description: "Operations and logistics" },
    ];
    const departments = await Department.insertMany(
      deptNames.map((d) => ({ ...d, companyId: company._id }))
    );
    console.log(`  Created ${departments.length} departments\n`);

    // Create employees
    console.log("Creating employees...");
    const empData = [
      { employeeCode: "EMP001", firstName: "Raj", lastName: "Kumar", email: "admin@flowmative.com", phone: "+91 98765 43210", departmentId: departments[0]._id, designation: "Software Engineer", role: "admin", joinDate: "2022-01-15", salary: 120000, gender: "male" },
      { employeeCode: "EMP002", firstName: "Priya", lastName: "Sharma", email: "hr@flowmative.com", phone: "+91 98765 43211", departmentId: departments[1]._id, designation: "HR Manager", role: "hr", joinDate: "2021-06-01", salary: 95000, gender: "female" },
      { employeeCode: "EMP003", firstName: "Amit", lastName: "Singh", email: "employee@flowmative.com", phone: "+91 98765 43212", departmentId: departments[0]._id, designation: "Senior Developer", role: "employee", joinDate: "2023-03-10", salary: 85000, gender: "male" },
      { employeeCode: "EMP004", firstName: "Sneha", lastName: "Patel", email: "manager@flowmative.com", phone: "+91 98765 43213", departmentId: departments[0]._id, designation: "Engineering Manager", role: "manager", joinDate: "2020-09-01", salary: 150000, gender: "female" },
      { employeeCode: "EMP005", firstName: "Vikram", lastName: "Reddy", email: "vikram@flowmative.com", phone: "+91 98765 43214", departmentId: departments[2]._id, designation: "Marketing Lead", role: "employee", joinDate: "2022-07-20", salary: 75000, gender: "male" },
    ];
    const employees = await Employee.insertMany(
      empData.map((e) => ({ ...e, companyId: company._id, status: "active" }))
    );
    console.log(`  Created ${employees.length} employees\n`);

    // Create users
    console.log("Creating users...");
    const users = [
      { email: "admin@flowmative.com", passwordHash: hashPassword("admin123"), name: "Raj Kumar", role: "admin", employeeId: employees[0]._id, companyId: company._id },
      { email: "hr@flowmative.com", passwordHash: hashPassword("hr123"), name: "Priya Sharma", role: "hr", employeeId: employees[1]._id, companyId: company._id },
      { email: "employee@flowmative.com", passwordHash: hashPassword("emp123"), name: "Amit Singh", role: "employee", employeeId: employees[2]._id, companyId: company._id },
      { email: "manager@flowmative.com", passwordHash: hashPassword("mgr123"), name: "Sneha Patel", role: "manager", employeeId: employees[3]._id, companyId: company._id },
    ];
    await User.insertMany(users);
    console.log(`  Created ${users.length} users\n`);

    // Create default branding
    console.log("Creating default branding...");
    await Branding.create({
      companyName: "Flowmative HRMS",
      logoUrl: null,
      primaryColor: "#6366f1",
      accentColor: "#8b5cf6",
      theme: "light",
      tagline: "Empowering Your Workforce",
      companyId: company._id,
    });
    console.log("  Created default branding\n");

    console.log("Database seeded successfully!\n");
    console.log("========================================");
    console.log("  Demo Accounts:");
    console.log("========================================");
    console.log("  Super Admin | superadmin@hrms.com     | superadmin123");
    console.log("  Admin       | admin@flowmative.com    | admin123");
    console.log("  HR          | hr@flowmative.com       | hr123");
    console.log("  Employee    | employee@flowmative.com | emp123");
    console.log("  Manager     | manager@flowmative.com  | mgr123");
    console.log("========================================\n");
  } catch (error) {
    console.error("Seed failed:", error);
    throw error;
  } finally {
    await disconnectDB();
  }
}

seed();
