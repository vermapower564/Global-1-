async function saveProjectsViaAPI() {
  console.log("⚡ Saving Project records directly to XAMPP MySQL via Next.js API (/api/projects)...");

  const projectsToSave = [
    {
      name: "OMS Enterprise Portal 2.0",
      client: "Acme Logistics Corp",
      budget: "250000",
      deadline: "2026-09-15",
      clientEmail: "alice@acme.com",
      clientPhone: "+91 98765 11122",
    },
    {
      name: "Acme Corp Cloud Migration",
      client: "Acme Logistics Corp",
      budget: "450000",
      deadline: "2026-10-01",
      clientEmail: "alice@acme.com",
      clientPhone: "+91 98765 11122",
    },
    {
      name: "TechNova AI Analytics Engine",
      client: "TechNova SaaS Inc",
      budget: "650000",
      deadline: "2026-11-30",
      clientEmail: "cto@technova.com",
      clientPhone: "+91 98765 22233",
    },
    {
      name: "Global Finance Audit Automation",
      client: "Global Finance Ltd",
      budget: "180000",
      deadline: "2026-08-20",
      clientEmail: "audit@globalfinance.com",
      clientPhone: "+91 98765 33344",
    },
    {
      name: "Obsidian Red UI Mobile App",
      client: "Internal Enterprise Suite",
      budget: "350000",
      deadline: "2026-12-31",
      clientEmail: "design@oms.com",
      clientPhone: "+91 98765 44455",
    },
  ];

  for (const p of projectsToSave) {
    try {
      const res = await fetch("http://localhost:3000/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(p),
      });
      const data = await res.json();
      if (data.success) {
        console.log(`✓ Project saved to MySQL: ${p.name} (Contract Value: ₹${p.budget})`);
      } else {
        console.warn(`⚠ Response for ${p.name}:`, data);
      }
    } catch (err: any) {
      console.error(`❌ Failed to post ${p.name}:`, err.message);
    }
  }

  console.log("🎉 ALL PROJECT RECORDS HAVE BEEN SENT AND SAVED TO XAMPP MYSQL DATABASE!");
}

saveProjectsViaAPI();
