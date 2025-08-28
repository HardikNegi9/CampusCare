'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  School, 
  MapPin, 
  Laptop, 
  Users, 
  Settings,
  Plus,
  FileText
} from 'lucide-react';

interface AdminDashboardProps {
  onNavigate: (view: 'regions' | 'schools' | 'locations' | 'devices' | 'logs' | 'users') => void;
  onRegularDashboard: () => void;
}

export function AdminDashboard({ onNavigate, onRegularDashboard }: AdminDashboardProps) {
  const adminCards = [
    {
      title: 'Manage Regions',
      description: 'Add, edit, and delete geographical regions',
      icon: Building2,
      count: '5 Regions',
      action: () => onNavigate('regions'),
      color: 'bg-blue-500'
    },
    {
      title: 'Manage Schools',
      description: 'Add, edit, and delete schools within regions',
      icon: School,
      count: '12 Schools',
      action: () => onNavigate('schools'),
      color: 'bg-green-500'
    },
    {
      title: 'Manage Locations',
      description: 'Add, edit, and delete lab locations within schools',
      icon: MapPin,
      count: '35 Locations',
      action: () => onNavigate('locations'),
      color: 'bg-purple-500'
    },
    {
      title: 'Manage Devices',
      description: 'Add, edit, and delete devices across all locations',
      icon: Laptop,
      count: '150 Devices',
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
      count: '25 Users',
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
                <Badge variant="secondary">{card.count}</Badge>
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
