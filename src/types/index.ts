export interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "engineer" | "faculty";
  affiliatedSchool?: string;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

export interface Region {
  id: string;
  name: string;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface School {
  id: string;
  name: string;
  address: string;
  region: string; // ObjectId as string
  regionData?: Region; // populated region data
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Location {
  id: string;
  name: string;
  floor?: number;
  building?: string;
  school: string; // ObjectId as string
  schoolData?: School; // populated school data
}

export interface Device {
  id: string;
  name: string;
  deviceType: "cctv" | "printer" | "camera";
  location: string; // ObjectId as string
  status: "active" | "inactive";
  school: string; // ObjectId as string
  locationData?: Location; // populated location data
  schoolData?: School; // populated school data
  serialNumber?: string; // Optional serial number
  purchaseDate?: string; // Optional purchase date
  warrantyExpiry?: string; // Optional warranty expiry date
}

// Lab is essentially a Location with devices
export interface Lab extends Location {
  devices?: Device[];
}
