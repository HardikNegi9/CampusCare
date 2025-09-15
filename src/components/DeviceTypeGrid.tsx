import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Monitor, Camera, Printer, Server, MapPin, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { School, Location, Device } from '../types';
import { useApiCall } from '@/hooks/useApiCall';

interface DeviceTypeGridProps {
  school: School;
  onBack: () => void;
  onLabSelect: (location: Location) => void;
}

export const DeviceTypeGrid = ({ school, onBack, onLabSelect }: DeviceTypeGridProps) => {
  const { apiCall } = useApiCall();

  // Fetch locations for this school
  const { data: locations = [], isLoading: locationsLoading } = useQuery({
    queryKey: ['locations', school.id],
    queryFn: async () => {
      const response = await apiCall(`/api/school/${school.id}/locations`);
      if (!response.ok) {
        throw new Error('Failed to fetch locations');
      }
      const data = await response.json();
      return data.locations as Location[];
    },
  });

  // Fetch devices for this school
  const { data: devices = [], isLoading: devicesLoading } = useQuery({
    queryKey: ['devices', school.id],
    queryFn: async () => {
      const response = await apiCall(`/api/devices?schoolId=${school.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch devices');
      }
      const data = await response.json();
      return data.devices as Device[];
    },
  });

  const isLoading = locationsLoading || devicesLoading;

  // Group devices by type and location
  const getLocationsForDeviceType = (deviceType: string) => {
    const relevantDevices = devices.filter(device => 
      device.deviceType === deviceType
    );
    
    const locationIds = [...new Set(relevantDevices.map(device => device.location))];
    return locations.filter(location => locationIds.includes(location.id));
  };

  const getDeviceCountForLocation = (locationId: string, deviceType: string) => {
    return devices.filter(device => 
      device.location === locationId && 
      device.deviceType === deviceType
    ).length;
  };

  const deviceTypes = [
    {
      type: 'desktop',
      icon: Monitor,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
      darkBgColor: 'dark:bg-blue-950',
      title: 'Computers Lab',
      description: 'Desktop computers and workstations',
      locations: getLocationsForDeviceType('desktop')
    },
    {
      type: 'cctv',
      icon: Camera,
      color: 'text-green-500',
      bgColor: 'bg-green-50',
      darkBgColor: 'dark:bg-green-950',
      title: 'Security Cameras',
      description: 'CCTV monitoring systems',
      locations: getLocationsForDeviceType('cctv')
    },
    {
      type: 'printer',
      icon: Printer,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50',
      darkBgColor: 'dark:bg-purple-950',
      title: 'Printers',
      description: 'Printing devices',
      locations: getLocationsForDeviceType('printer')
    },
    {
      type: 'server',
      icon: Server,
      color: 'text-orange-500',
      bgColor: 'bg-orange-50',
      darkBgColor: 'dark:bg-orange-950',
      title: 'Servers',
      description: 'Server infrastructure',
      locations: getLocationsForDeviceType('server')
    }
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Schools
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{school.name}</h1>
            <p className="text-muted-foreground">Loading locations and devices...</p>
          </div>
        </div>
        <div className="flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Schools
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{school.name}</h1>
          <p className="text-muted-foreground">Select device type to manage</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {deviceTypes.map((deviceType) => (
          <Card key={deviceType.type} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className={`p-3 rounded-lg ${deviceType.bgColor} ${deviceType.darkBgColor}`}>
                    <deviceType.icon className={`h-6 w-6 ${deviceType.color}`} />
                  </div>
                  <Badge variant="secondary">
                    {deviceType.locations.length} locations
                  </Badge>
                </div>

                <div>
                  <h3 className="font-semibold text-lg">{deviceType.title}</h3>
                  <p className="text-sm text-muted-foreground">{deviceType.description}</p>
                </div>

                {deviceType.locations.length > 0 ? (
                  <div className="space-y-2">
                    {deviceType.locations.map((location) => (
                      <Button
                        key={location.id}
                        variant="ghost"
                        className="w-full justify-start h-auto p-3"
                        onClick={() => onLabSelect(location)}
                      >
                        <div className="flex items-center gap-3 w-full">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <div className="text-left flex-1">
                            <div className="font-medium">{location.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {getDeviceCountForLocation(location.id, deviceType.type)} devices
                              {location.floor && ` • Floor ${location.floor}`}
                              {location.building && ` • ${location.building}`}
                            </div>
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">
                      No {deviceType.title.toLowerCase()} configured
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};