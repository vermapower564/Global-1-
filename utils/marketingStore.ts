export interface AdCampaign {
  id: string;
  name: string;
  platform: "Meta Ads" | "Google Search" | "LinkedIn B2B" | "YouTube Ads";
  budget: number;
  adSpend: number;
  leadsGenerated: number;
  cpl: number; // Cost Per Lead
  roas: number; // Return on Ad Spend
  ctr: string;  // Click Through Rate
  impressions: string;
  status: "Active" | "Paused" | "Completed";
}

export interface SeoKeyword {
  id: string;
  keyword: string;
  searchVolume: string;
  currentRank: number;
  previousRank: number;
  targetUrl: string;
  status: "Improving" | "Stable" | "Declining";
}

export const initialCampaigns: AdCampaign[] = [
  {
    id: "CAM-01",
    name: "Enterprise ERP Lead Gen Q3",
    platform: "Meta Ads",
    budget: 15000,
    adSpend: 8400,
    leadsGenerated: 210,
    cpl: 40.0,
    roas: 4.8,
    ctr: "3.45%",
    impressions: "245,000",
    status: "Active",
  },
  {
    id: "CAM-02",
    name: "Google High-Intent Search B2B",
    platform: "Google Search",
    budget: 20000,
    adSpend: 14200,
    leadsGenerated: 185,
    cpl: 76.75,
    roas: 5.2,
    ctr: "5.12%",
    impressions: "180,000",
    status: "Active",
  },
  {
    id: "CAM-03",
    name: "CTO & HR Director Outreach",
    platform: "LinkedIn B2B",
    budget: 10000,
    adSpend: 6500,
    leadsGenerated: 48,
    cpl: 135.4,
    roas: 3.6,
    ctr: "2.10%",
    impressions: "65,000",
    status: "Active",
  },
];

export const initialKeywords: SeoKeyword[] = [
  {
    id: "KW-01",
    keyword: "Operations Management System ERP",
    searchVolume: "14,500/mo",
    currentRank: 2,
    previousRank: 5,
    targetUrl: "/solutions/oms",
    status: "Improving",
  },
  {
    id: "KW-02",
    keyword: "Enterprise Workforce Tracking Software",
    searchVolume: "9,800/mo",
    currentRank: 1,
    previousRank: 2,
    targetUrl: "/employees",
    status: "Improving",
  },
  {
    id: "KW-03",
    keyword: "Automated HR Leave Management System",
    searchVolume: "22,000/mo",
    currentRank: 3,
    previousRank: 3,
    targetUrl: "/hr",
    status: "Stable",
  },
];

export function getStoredCampaigns(): AdCampaign[] {
  if (typeof window === "undefined") return initialCampaigns;
  const data = localStorage.getItem("oms_ad_campaigns");
  if (!data) {
    localStorage.setItem("oms_ad_campaigns", JSON.stringify(initialCampaigns));
    return initialCampaigns;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    return initialCampaigns;
  }
}

export function addStoredCampaign(campaign: Omit<AdCampaign, "id" | "status" | "cpl" | "roas">): AdCampaign {
  const current = getStoredCampaigns();
  const id = `CAM-0${current.length + 1}`;
  const cpl = campaign.leadsGenerated > 0 ? parseFloat((campaign.adSpend / campaign.leadsGenerated).toFixed(2)) : 0;
  const roas = 4.2; // Default ROAS estimate

  const newCampaign: AdCampaign = {
    ...campaign,
    id,
    cpl,
    roas,
    status: "Active",
  };

  const updated = [newCampaign, ...current];
  if (typeof window !== "undefined") {
    localStorage.setItem("oms_ad_campaigns", JSON.stringify(updated));
  }
  return newCampaign;
}

export function getStoredKeywords(): SeoKeyword[] {
  if (typeof window === "undefined") return initialKeywords;
  const data = localStorage.getItem("oms_seo_keywords");
  if (!data) {
    localStorage.setItem("oms_seo_keywords", JSON.stringify(initialKeywords));
    return initialKeywords;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    return initialKeywords;
  }
}

export function addStoredKeyword(kw: Omit<SeoKeyword, "id" | "previousRank" | "status">): SeoKeyword {
  const current = getStoredKeywords();
  const id = `KW-0${current.length + 1}`;
  const newKw: SeoKeyword = {
    ...kw,
    id,
    previousRank: kw.currentRank + 2,
    status: "Improving",
  };

  const updated = [newKw, ...current];
  if (typeof window !== "undefined") {
    localStorage.setItem("oms_seo_keywords", JSON.stringify(updated));
  }
  return newKw;
}
