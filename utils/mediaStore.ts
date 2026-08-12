export interface MediaShootLog {
  id: string;
  name?: string;
  projectTitle: string;
  clientName: string;
  shootLocation: string;
  shootDate: string;
  cameraOperator: string;
  editorAssigned: string;
  equipmentUsed: string;
  rawDriveLink: string;
  renderStatus: "Raw Logged" | "In Editing" | "Color Graded" | "Rendered" | "Delivered";
  deliveryVersion: string;
}

export const initialMediaShoots: MediaShootLog[] = [
  {
    id: "SHT-201",
    name: "Acme Corporate Brand Video 4K",
    projectTitle: "Acme Corp Brand Identity",
    clientName: "Acme Corp",
    shootLocation: "Main Corporate HQ, Studio A",
    shootDate: "2026-08-01",
    cameraOperator: "Mohit Sen (Camera Team Lead)",
    editorAssigned: "Rahul Sharma (Video Editor)",
    equipmentUsed: "Sony FX6 4K, G-Master Lenses, Wireless Mic Kit, Aputure 600d",
    rawDriveLink: "drive.google.com/raw-footage-acme-4k",
    renderStatus: "In Editing",
    deliveryVersion: "v1.2 Draft",
  },
  {
    id: "SHT-202",
    name: "TechNova Product Demo Teaser",
    projectTitle: "TechNova SaaS Showcase",
    clientName: "TechNova Inc",
    shootLocation: "TechNova Innovation Hub",
    shootDate: "2026-08-02",
    cameraOperator: "Mohit Sen (Camera Team Lead)",
    editorAssigned: "Rahul Sharma (Video Editor)",
    equipmentUsed: "RED Komodo 6K, Ronin RS3 Gimbal, Cine Lenses",
    rawDriveLink: "drive.google.com/raw-technova-6k",
    renderStatus: "Rendered",
    deliveryVersion: "v2.0 Final Render",
  },
  {
    id: "SHT-203",
    name: "Global Health Corporate Documentary",
    projectTitle: "Healthcare Innovation 2026",
    clientName: "Global Health Systems",
    shootLocation: "City Hospital & Research Lab",
    shootDate: "2026-08-05",
    cameraOperator: "Mohit Sen (Camera Team Lead)",
    editorAssigned: "Rahul Sharma (Video Editor)",
    equipmentUsed: "Sony FX6 4K Dual Camera Setup, DJI Transmission Wireless Monitor",
    rawDriveLink: "drive.google.com/raw-globalhealth-docu",
    renderStatus: "Color Graded",
    deliveryVersion: "v1.0 Fine Cut",
  },
];

export function getStoredMediaShoots(): MediaShootLog[] {
  if (typeof window === "undefined") return initialMediaShoots;
  const data = localStorage.getItem("oms_media_shoots");
  if (!data) {
    localStorage.setItem("oms_media_shoots", JSON.stringify(initialMediaShoots));
    return initialMediaShoots;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    return initialMediaShoots;
  }
}
