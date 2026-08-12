export interface OfficeLocation {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  isHeadquarters: boolean;
  phone: string;
  email: string;
}

export interface CompanyProfile {
  companyName: string;
  tagline: string;
  taxRegistrationCin: string;
  gstinNumber: string;
  primaryCurrency: string;
  headquartersAddress: string;
  headquartersCity: string;
  headquartersState: string;
  headquartersCountry: string;
  pincode: string;
  phone: string;
  supportEmail: string;
  officialWebsite: string;
  officeLocations: OfficeLocation[];
}

export const defaultCompanyProfile: CompanyProfile = {
  companyName: "OMS Enterprise Global Pvt. Ltd.",
  tagline: "Global Webify Operations & Enterprise Resource Platform",
  taxRegistrationCin: "L72200HR2026PTC099128",
  gstinNumber: "07AAAAA0000A1Z5",
  primaryCurrency: "INR (₹)",
  headquartersAddress: "DLF Cyber City, Tower B, 8th Floor, Phase 2",
  headquartersCity: "Gurugram",
  headquartersState: "Haryana",
  headquartersCountry: "India",
  pincode: "122002",
  phone: "+91 98765 43210",
  supportEmail: "support@globalwebify.com",
  officialWebsite: "www.globalwebify.com",
  officeLocations: [
    {
      id: "LOC-01",
      name: "Gurugram Headquarters (DLF Cyber City)",
      address: "DLF Cyber City, Tower B, 8th Floor, Phase 2",
      city: "Gurugram",
      state: "Haryana",
      country: "India",
      pincode: "122002",
      isHeadquarters: true,
      phone: "+91 98765 43210",
      email: "hq@globalwebify.com",
    },
    {
      id: "LOC-02",
      name: "Delhi Engineering & Innovation Hub",
      address: "Connaught Place, Inner Circle, Block C",
      city: "New Delhi",
      state: "Delhi",
      country: "India",
      pincode: "110001",
      isHeadquarters: false,
      phone: "+91 98765 11223",
      email: "delhi.tech@globalwebify.com",
    },
    {
      id: "LOC-03",
      name: "Mumbai Financial & Sales Center",
      address: "Bandra Kurla Complex (BKC), Financial Tower 4",
      city: "Mumbai",
      state: "Maharashtra",
      country: "India",
      pincode: "400051",
      isHeadquarters: false,
      phone: "+91 98765 99887",
      email: "mumbai.finance@globalwebify.com",
    },
    {
      id: "LOC-04",
      name: "Bengaluru R&D Tech Campus",
      address: "Outer Ring Road, Manyata Tech Park",
      city: "Bengaluru",
      state: "Karnataka",
      country: "India",
      pincode: "560045",
      isHeadquarters: false,
      phone: "+91 98765 77665",
      email: "bengaluru.dev@globalwebify.com",
    },
  ],
};

export function getStoredCompanyProfile(): CompanyProfile {
  if (typeof window === "undefined") return defaultCompanyProfile;
  const data = localStorage.getItem("oms_company_profile");
  if (!data) return defaultCompanyProfile;
  try {
    return JSON.parse(data);
  } catch (e) {
    return defaultCompanyProfile;
  }
}

export function saveCompanyProfile(profile: CompanyProfile): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("oms_company_profile", JSON.stringify(profile));
}
