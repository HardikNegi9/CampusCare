'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, School, MapPin, Laptop, Users, Settings, Plus, FileText, Loader2} from 'lucide-react';
import { toast } from 'sonner';

interface AdminDashboardProps {
  onNavigate: (view: 'regions' | 'schools' | 'locations' | 'devices' | 'logs' | 'users') => void;
  onRegularDashboard: () => void;
}

interface DashboardCounts {
  regions: number;
  schools: number;
  locations: number;
  devices: number;
  users: number;
}

interface CachedData {
  counts: DashboardCounts;
  timestamp: number;
}

export function AdminDashboard({ onNavigate, onRegularDashboard }: AdminDashboardProps) {
  const [counts, setCounts] = useState<DashboardCounts>({
    regions: 0,
    schools: 0,
    locations: 0,
    devices: 0,
    users: 0
  });
  const [loading, setLoading] = useState(true);

  const CACHE_KEY = 'admin_dashboard_counts';
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

  const getCachedData = (): CachedData | null => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsedData = JSON.parse(cached) as CachedData;
        const now = Date.now();
        
        // Check if cache is still valid (within 5 minutes)
        if (now - parsedData.timestamp < CACHE_DURATION) {
          return parsedData;
        }
      }
    } catch (error) {
      console.error('Error reading cache:', error);
    }
    return null;
  };

  const setCachedData = (counts: DashboardCounts) => {
    try {
      const dataToCache: CachedData = {
        counts,
        timestamp: Date.now()
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(dataToCache));
    } catch (error) {
      console.error('Error setting cache:', error);
    }
  };

  const fetchCounts = async (useCache = true) => {
    // Check cache first
    if (useCache) {
      const cachedData = getCachedData();
      if (cachedData) {
        setCounts(cachedData.counts);
        setLoading(false);
        return;
      }
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Fetch all counts in parallel
      const [regionsRes, schoolsRes, locationsRes, devicesRes, usersRes] = await Promise.all([
        fetch('/api/region', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/schools', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/locations', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/devices', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/users', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      const newCounts: DashboardCounts = {
        regions: 0,
        schools: 0,
        locations: 0,
        devices: 0,
        users: 0
      };

      if (regionsRes.ok) {
        const regionsData = await regionsRes.json();
        newCounts.regions = regionsData.regions?.length || 0;
      }

      if (schoolsRes.ok) {
        const schoolsData = await schoolsRes.json();
        newCounts.schools = schoolsData.schools?.length || 0;
      }

      if (locationsRes.ok) {
        const locationsData = await locationsRes.json();
        newCounts.locations = locationsData.locations?.length || 0;
      }

      if (devicesRes.ok) {
        const devicesData = await devicesRes.json();
        newCounts.devices = devicesData.devices?.length || 0;
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        newCounts.users = usersData.users?.length || 0;
      }

      setCounts(newCounts);
      setCachedData(newCounts); // Cache the new data
    } catch (error) {
      console.error('Error fetching dashboard counts:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Function to manually refresh data (bypass cache)
  const refreshData = () => {
    fetchCounts(false);
  };

  useEffect(() => {
    fetchCounts(true); // Use cache on initial load
  }, []);

  const adminCards = [
    {
      title: 'Manage Regions',
      description: 'Add, edit, and delete geographical regions',
      icon: Building2,
      count: loading ? 'Loading...' : `${counts.regions} Regions`,
      action: () => onNavigate('regions'),
      color: 'bg-blue-500'
    },
    {
      title: 'Manage Schools',
      description: 'Add, edit, and delete schools within regions',
      icon: School,
      count: loading ? 'Loading...' : `${counts.schools} Schools`,
      action: () => onNavigate('schools'),
      color: 'bg-green-500'
    },
    {
      title: 'Manage Labs',
      description: 'Add, edit, and delete lab locations within schools',
      icon: MapPin,
      count: loading ? 'Loading...' : `${counts.locations} Locations`,
      action: () => onNavigate('locations'),
      color: 'bg-purple-500'
    },
    {
      title: 'Manage Devices',
      description: 'Add, edit, and delete devices across all locations',
      icon: Laptop,
      count: loading ? 'Loading...' : `${counts.devices} Devices`,
      action: () => onNavigate('devices'),
      color: 'bg-orange-500'
    },
    {
      title: 'Device Activity Logs',
      description: 'View and export device activity history and audit trails',
      icon: FileText,
      count: 'View Logs',
      action: () => onNavigate('logs'),
      color: 'bg-indigo-500'
    },
    {
      title: 'Manage Users',
      description: 'Add, edit, and manage user accounts and permissions',
      icon: Users,
      count: loading ? 'Loading...' : `${counts.users} Users`,
      action: () => onNavigate('users'),
      color: 'bg-red-500'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Manage all aspects of the Campus Care ERP system
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={refreshData} variant="ghost" size="sm">
            <Loader2 className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={onRegularDashboard} variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Regular Dashboard
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {adminCards.map((card, index) => (
          <Card 
            key={index} 
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={card.action}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className={`p-2 rounded-lg ${card.color} text-white w-fit`}>
                  <card.icon className="w-5 h-5" />
                </div>
                <Badge variant="secondary" className="flex items-center gap-1">
                  {loading && index !== 4 && <Loader2 className="w-3 h-3 animate-spin" />}
                  {card.count}
                </Badge>
              </div>
              <CardTitle className="text-lg">{card.title}</CardTitle>
              <CardDescription>{card.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={card.action}>
                <Plus className="w-4 h-4 mr-2" />
                Manage
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}