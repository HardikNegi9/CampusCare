'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { UserProfile } from '@/components/UserProfile';
import { RegionGrid } from '@/components/RegionGrid';
import { SchoolGrid } from '@/components/SchoolGrid';
import { DeviceTypeGrid } from '@/components/DeviceTypeGrid';
import { TopViewLab } from '@/components/TopViewLab';
import { AdminDashboard } from '@/components/AdminDashboard';
import { RegionManagement } from '@/components/RegionManagement';
import { SchoolManagement } from '@/components/SchoolManagement';
import { DeviceManagement } from '@/components/DeviceManagement';
import DeviceLogsManagement from '@/components/admin/DeviceLogsManagement';
import LocationManagement from '@/components/admin/LocationManagement';
import UserManagement from '@/components/admin/UserManagement';
import { Region, School, Location } from '@/types/index';
import { Loader2 } from 'lucide-react';

type DashboardView = 'regions' | 'schools' | 'deviceTypes' | 'labView' | 'admin' | 'adminRegions' | 'adminSchools' | 'adminLocations' | 'adminDevices' | 'adminLogs' | 'adminUsers';

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  
  const [currentView, setCurrentView] = useState<DashboardView>(
    (searchParams.get('view') as DashboardView) || 'regions'
  );
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  // Show loading while checking authentication
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  const updateUrl = (view: DashboardView, params?: URLSearchParams) => {
    const url = new URLSearchParams(searchParams);
    url.set('view', view);
    if (params) {
      params.forEach((value, key) => url.set(key, value));
    }
    router.push(`/dashboard?${url.toString()}`);
  };

  const handleRegionSelect = (region: Region) => {
    setSelectedRegion(region);
    setCurrentView('schools');
    updateUrl('schools', new URLSearchParams([['regionId', region.id]]));
  };

  const handleSchoolSelect = (school: School) => {
    setSelectedSchool(school);
    setCurrentView('deviceTypes');
    updateUrl('deviceTypes', new URLSearchParams([['schoolId', school.id]]));
  };

  const handleLabSelect = (location: Location) => {
    setSelectedLocation(location);
    setCurrentView('labView');
    updateUrl('labView', new URLSearchParams([['locationId', location.id]]));
  };

  const handleBackToRegions = () => {
    setCurrentView('regions');
    setSelectedRegion(null);
    setSelectedSchool(null);
    setSelectedLocation(null);
    router.push('/dashboard');
  };

  const handleBackToSchools = () => {
    setCurrentView('schools');
    setSelectedSchool(null);
    setSelectedLocation(null);
    updateUrl('schools', new URLSearchParams([['regionId', selectedRegion?.id || '']]));
  };

  const handleBackToDeviceTypes = () => {
    setCurrentView('deviceTypes');
    setSelectedLocation(null);
    updateUrl('deviceTypes', new URLSearchParams([['schoolId', selectedSchool?.id || '']]));
  };

  const handleAdminView = () => {
    setCurrentView('admin');
    router.push('/dashboard?view=admin');
  };

  const handleAdminNavigate = (view: 'regions' | 'schools' | 'locations' | 'devices' | 'logs' | 'users') => {
    const adminView = `admin${view.charAt(0).toUpperCase() + view.slice(1)}` as DashboardView;
    setCurrentView(adminView);
    updateUrl(adminView);
  };

  const handleBackToAdmin = () => {
    setCurrentView('admin');
    updateUrl('admin');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <button 
            onClick={handleBackToRegions}
            className="text-xl font-bold text-primary hover:text-primary/80 transition-colors"
          >
            School ERP System
          </button>
          <div className="flex items-center gap-4">
            {user?.role === 'admin' && currentView !== 'admin' && !currentView.startsWith('admin') && (
              <button 
                onClick={handleAdminView}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Admin Panel
              </button>
            )}
            <UserProfile />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Admin Views */}
        {currentView === 'admin' && user?.role === 'admin' && (
          <AdminDashboard 
            onNavigate={handleAdminNavigate}
            onRegularDashboard={handleBackToRegions}
          />
        )}

        {currentView === 'adminRegions' && user?.role === 'admin' && (
          <RegionManagement onBack={handleBackToAdmin} />
        )}

        {currentView === 'adminSchools' && user?.role === 'admin' && (
          <SchoolManagement onBack={handleBackToAdmin} />
        )}

        {currentView === 'adminDevices' && user?.role === 'admin' && (
          <DeviceManagement onBack={handleBackToAdmin} />
        )}

        {currentView === 'adminLocations' && user?.role === 'admin' && (
          <LocationManagement onBack={handleBackToAdmin} />
        )}

        {currentView === 'adminUsers' && user?.role === 'admin' && (
          <UserManagement onBack={handleBackToAdmin} />
        )}

        {currentView === 'adminLogs' && user?.role === 'admin' && (
          <div className="container mx-auto p-6">
            <div className="mb-4">
              <button
                onClick={handleBackToAdmin}
                className="text-blue-600 hover:text-blue-800 mb-4 flex items-center"
              >
                ← Back to Admin Dashboard
              </button>
            </div>
            <DeviceLogsManagement />
          </div>
        )}

        {/* Regular Dashboard Views */}
        {currentView === 'regions' && (
          <RegionGrid onRegionSelect={handleRegionSelect} />
        )}

        {currentView === 'schools' && selectedRegion && (
          <SchoolGrid 
            region={selectedRegion}
            onBack={handleBackToRegions}
            onSchoolSelect={handleSchoolSelect}
          />
        )}

        {currentView === 'deviceTypes' && selectedSchool && (
          <DeviceTypeGrid
            school={selectedSchool}
            onBack={handleBackToSchools}
            onLabSelect={handleLabSelect}
          />
        )}

        {currentView === 'labView' && selectedLocation && (
          <TopViewLab
            lab={selectedLocation}
            onBack={handleBackToDeviceTypes}
          />
        )}
      </main>
    </div>
  );
}