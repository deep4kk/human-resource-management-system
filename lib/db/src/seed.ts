/**
 * Database Seed Script
 * 
 * Run with: pnpm run db:seed
 * 
 * Creates demo users, employees, and departments for development
 */

import { db, pool } from "./index.js";
import { usersTable } from "./schema/users.js";
import { employeesTable } from "./schema/employees.js";
import { departmentsTable } from "./schema/departments.js";
import { brandingTable } from "./schema/branding.js";
import { eq } from "drizzle-orm";

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function seed() {
  console.log("🌱 Starting database seed...\n");

  try {
    // Check if already seeded
    const existingUsers = await db.select().from(usersTable).limit(1);
    if (existingUsers.length > 0) {
      console.log("⚠️  Database already has users. Skipping seed.");
      console.log("   Run 'pnpm run db:reset' to reset and reseed.\n");
      await pool.end();
      return;
    }

    // Create departments
    console.log("📁 Creating departments...");
    const departments = [
      { name: "Engineering", description: "Software development and technical teams" },
      { name: "Human Resources", description: "HR and people operations" },
      { name: "Marketing", description: "Marketing and communications" },
      { name: "Finance", description: "Finance and accounting" },
      { name: "Operations", description: "Operations and logistics" },
    ];

    const deptResults = await db
      .insert(departmentsTable)
      .values(departments)
      .returning();
    console.log(`   ✓ Created ${deptResults.length} departments\n`);

    // Create employees
    console.log("👥 Creating employees...");
    const employees = [
      {
        employeeCode: "EMP001",
        firstName: "Raj",
        lastName: "Kumar",
        email: "admin@toyo-kambocha.com",
        phone: "+91 98765 43210",
        departmentId: deptResults[0].id,
        designation: "Software Engineer",
        role: "admin",
        status: "active",
        joinDate: "2022-01-15",
        salary: 120000,
        address: "123 Tech Park, Bangalore",
        dateOfBirth: "1990-05-15",
        gender: "male",
      },
      {
        employeeCode: "EMP002",
        firstName: "Priya",
        lastName: "Sharma",
        email: "hr@toyo-kambocha.com",
        phone: "+91 98765 43211",
        departmentId: deptResults[1].id,
        designation: "HR Manager",
        role: "hr",
        status: "active",
        joinDate: "2021-06-01",
        salary: 95000,
        address: "456 MG Road, Bangalore",
        dateOfBirth: "1988-08-22",
        gender: "female",
      },
      {
        employeeCode: "EMP003",
        firstName: "Amit",
        lastName: "Singh",
        email: "employee@toyo-kambocha.com",
        phone: "+91 98765 43212",
        departmentId: deptResults[0].id,
        designation: "Senior Developer",
        role: "employee",
        status: "active",
        joinDate: "2023-03-10",
        salary: 85000,
        address: "789 Whitefield, Bangalore",
        dateOfBirth: "1992-12-03",
        gender: "male",
      },
      {
        employeeCode: "EMP004",
        firstName: "Sneha",
        lastName: "Patel",
        email: "manager@toyo-kambocha.com",
        phone: "+91 98765 43213",
        departmentId: deptResults[0].id,
        designation: "Engineering Manager",
        role: "manager",
        status: "active",
        joinDate: "2020-09-01",
        salary: 150000,
        address: "321 Koramangala, Bangalore",
        dateOfBirth: "1985-03-18",
        gender: "female",
      },
      {
        employeeCode: "EMP005",
        firstName: "Vikram",
        lastName: "Reddy",
        email: "vikram@toyo-kambocha.com",
        phone: "+91 98765 43214",
        departmentId: deptResults[2].id,
        designation: "Marketing Lead",
        role: "employee",
        status: "active",
        joinDate: "2022-07-20",
        salary: 75000,
        address: "654 Indiranagar, Bangalore",
        dateOfBirth: "1991-11-25",
        gender: "male",
      },
    ];

    const empResults = await db
      .insert(employeesTable)
      .values(employees)
      .returning();
    console.log(`   ✓ Created ${empResults.length} employees\n`);

    // Create users
    console.log("🔐 Creating users...");
    const users = [
      {
        email: "admin@toyo-kambocha.com",
        passwordHash: await hashPassword("admin123"),
        name: "Raj Kumar",
        role: "admin",
        employeeId: empResults[0].id,
        isActive: true,
      },
      {
        email: "hr@toyo-kambocha.com",
        passwordHash: await hashPassword("hr123"),
        name: "Priya Sharma",
        role: "hr",
        employeeId: empResults[1].id,
        isActive: true,
      },
      {
        email: "employee@toyo-kambocha.com",
        passwordHash: await hashPassword("emp123"),
        name: "Amit Singh",
        role: "employee",
        employeeId: empResults[2].id,
        isActive: true,
      },
      {
        email: "manager@toyo-kambocha.com",
        passwordHash: await hashPassword("mgr123"),
        name: "Sneha Patel",
        role: "manager",
        employeeId: empResults[3].id,
        isActive: true,
      },
    ];

    await db.insert(usersTable).values(users);
    console.log(`   ✓ Created ${users.length} users\n`);

    // Create default branding
    console.log("🎨 Creating default branding...");
    await db.insert(brandingTable).values({
      companyName: "Toyo Kambocha HRMS",
      logoUrl: null,
      primaryColor: "#6366f1",
      accentColor: "#8b5cf6",
      theme: "light",
      tagline: "Empowering Your Workforce",
    });
    console.log("   ✓ Created default branding\n");

    console.log("✅ Database seeded successfully!\n");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("   Demo Accounts:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("   Admin    │ admin@toyo-kambocha.com    │ admin123");
    console.log("   HR       │ hr@toyo-kambocha.com       │ hr123");
    console.log("   Employee │ employee@toyo-kambocha.com │ emp123");
    console.log("   Manager  │ manager@toyo-kambocha.com │ mgr123");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  } catch (error) {
    console.error("❌ Seed failed:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

seed();
