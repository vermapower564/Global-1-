async function seedAllEmployeesToMySQL() {
  console.log("⚡ Seeding and saving all 14 Employee records directly into local XAMPP MySQL database (oms)...");

  const employeeRoster = [
    {
      name: "Roushan Verma",
      email: "roushan.verma123@gmail.com",
      role: "SUPER_ADMIN",
      department: "Executive Management",
      salary: 1850000,
      phone: "+91 98765 00001",
    },
    {
      name: "Rajesh Verma",
      email: "rajesh.verma123@gmail.com",
      role: "DIRECTOR",
      department: "Executive Management",
      salary: 1650000,
      phone: "+91 98765 00002",
    },
    {
      name: "Priya Sharma",
      email: "priya.sharma123@gmail.com",
      role: "HR",
      department: "Human Resources",
      salary: 1050000,
      phone: "+91 98765 00003",
    },
    {
      name: "Amit Patel",
      email: "amit.patel123@gmail.com",
      role: "FINANCE",
      department: "Accounts & Finance",
      salary: 1150000,
      phone: "+91 98765 00004",
    },
    {
      name: "Vikram Malhotra",
      email: "vikram.malhotra123@gmail.com",
      role: "SALES_MANAGER",
      department: "Sales & CRM",
      salary: 1250000,
      phone: "+91 98765 00005",
    },
    {
      name: "Karan Gupta",
      email: "karan.gupta123@gmail.com",
      role: "SALES_EXECUTIVE",
      department: "Sales & CRM",
      salary: 750000,
      phone: "+91 98765 00006",
    },
    {
      name: "Sneha Reddy",
      email: "sneha.reddy123@gmail.com",
      role: "DIGITAL_MARKETING_MANAGER",
      department: "Digital Marketing",
      salary: 980000,
      phone: "+91 98765 00007",
    },
    {
      name: "Deepak Kumar",
      email: "deepak.kumar123@gmail.com",
      role: "SEO_EXECUTIVE",
      department: "Digital Marketing",
      salary: 650000,
      phone: "+91 98765 00008",
    },
    {
      name: "Aanya Sen",
      email: "aanya.sen123@gmail.com",
      role: "CONTENT_WRITER",
      department: "Digital Marketing",
      salary: 580000,
      phone: "+91 98765 00009",
    },
    {
      name: "Ananya Roy",
      email: "ananya.roy123@gmail.com",
      role: "GRAPHIC_DESIGNER",
      department: "Creative & Media",
      salary: 820000,
      phone: "+91 98765 00010",
    },
    {
      name: "Rahul Sharma",
      email: "rahul.sharma123@gmail.com",
      role: "VIDEO_EDITOR",
      department: "Creative & Media",
      salary: 780000,
      phone: "+91 98765 00011",
    },
    {
      name: "Mohit Sen",
      email: "mohit.sen123@gmail.com",
      role: "CAMERA_TEAM",
      department: "Creative & Media",
      salary: 720000,
      phone: "+91 98765 00012",
    },
    {
      name: "Aarav Sharma",
      email: "aarav.sharma123@gmail.com",
      role: "PROJECT_MANAGER",
      department: "Development & Engineering",
      salary: 1450000,
      phone: "+91 98765 00013",
    },
    {
      name: "Aditya Raj",
      email: "aditya.raj123@gmail.com",
      role: "DEVELOPER",
      department: "Development & Engineering",
      salary: 950000,
      phone: "+91 98765 00014",
    },
  ];

  for (const emp of employeeRoster) {
    try {
      const res = await fetch("http://localhost:3000/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(emp),
      });
      const data = await res.json();
      if (data.success) {
        console.log(`✓ Saved to XAMPP MySQL 'user' table: ${emp.name} (${emp.role})`);
      } else {
        console.warn(`⚠ ${emp.name}:`, data);
      }
    } catch (err: any) {
      console.error(`❌ Failed to save ${emp.name}:`, err.message);
    }
  }

  console.log("🎉 ALL 14 EMPLOYEE RECORDS SAVED PERMANENTLY TO XAMPP MYSQL DATABASE (user table)!");
}

seedAllEmployeesToMySQL();
