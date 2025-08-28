import { Region, School, Location, Device } from '@/types/index';

// Temporary mock data for development
export const mockRegions: Region[] = [
  {
    id: '1',
    name: 'North Region',
    code: 'NR',
    description: 'Northern district schools'
  },
  {
    id: '2',
    name: 'South Region',
    code: 'SR',
    description: 'Southern district schools'
  },
  {
    id: '3',
    name: 'East Region',
    code: 'ER',
    description: 'Eastern district schools'
  },
  {
    id: '4',
    name: 'West Region',
    code: 'WR',
    description: 'Western district schools'
  }
];

export const mockSchools: School[] = [
  {
    id: '1',
    name: 'Lincoln High School',
    code: 'LHS',
    regionId: '1'
  },
  {
    id: '2',
    name: 'Washington Middle School',
    code: 'WMS',
    regionId: '1'
  },
  {
    id: '3',
    name: 'Jefferson Elementary',
    code: 'JES',
    regionId: '2'
  }
];

export const mockLocations: Location[] = [
  {
    id: '1',
    name: 'Computer Lab A',
    code: 'CLA',
    schoolId: '1'
  },
  {
    id: '2',
    name: 'Computer Lab B',
    code: 'CLB',
    schoolId: '1'
  }
];

export const mockDevices: Device[] = [
  {
    id: '1',
    name: 'Desktop PC #1',
    code: 'PC001',
    type: 'desktop',
    schoolId: '1',
    locationId: '1',
    status: 'active'
  },
  {
    id: '2',
    name: 'Desktop PC #2',
    code: 'PC002',
    type: 'desktop',
    schoolId: '1',
    locationId: '1',
    status: 'active'
  }
];
