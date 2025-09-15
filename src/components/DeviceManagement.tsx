'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue,} from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog,AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,} from '@/components/ui/alert-dialog';
import { ArrowLeft, Plus, Edit, Trash2, Laptop,Loader2,Power,PowerOff} from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { useApiCall } from '@/hooks/useApiCall';
import { toast } from 'sonner';

interface Region {
  id: string;
  name: string;
}

interface School {
  id: string;
  name: string;
  region: string;
}

interface Location {
  id: string;
  name: string;
  school: string;
}

interface Device {
  id: string;
  name: string;
  deviceType: string;
  location: string;
  locationName?: string;
  school: string;
  schoolName?: string;
  status: 'active' | 'inactive';
}

interface DeviceManagementProps {
  onBack: () => void;
}

export function DeviceManagement({ onBack }: DeviceManagementProps) {
  const { user } = useAuth();
  const { apiCall } = useApiCall();
  const queryClient = useQueryClient();
  
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [deactivationDialog, setDeactivationDialog] = useState({
    isOpen: false,
    device: null as Device | null,
    reason: ''
  });
  const [formData, setFormData] = useState({
    name: '',
    deviceType: '',
    location: '',
    school: '',
    status: 'active' as 'active' | 'inactive'
  });

  const deviceTypes = [
    'desktop',
    'printer',
    'cctv',
    'server',
  ];

  // React Query hooks for data fetching
  const { data: devices = [], isLoading: devicesLoading } = useQuery({
    queryKey: ['devices'],
    queryFn: async () => {
      const response = await apiCall('/api/devices');
      if (!response.ok) throw new Error('Failed to fetch devices');
      const data = await response.json();
      return data.devices as Device[];
    },
  });

  const { data: regions = [], isLoading: regionsLoading } = useQuery({
    queryKey: ['regions'],
    queryFn: async () => {
      const response = await apiCall('/api/region');
      if (!response.ok) throw new Error('Failed to fetch regions');
      const data = await response.json();
      return data.regions as Region[];
    },
  });

  const { data: schools = [], isLoading: schoolsLoading } = useQuery({
    queryKey: ['schools'],
    queryFn: async () => {
      const response = await apiCall('/api/schools');
      if (!response.ok) throw new Error('Failed to fetch schools');
      const data = await response.json();
      return data.schools as School[];
    },
  });

  const { data: locations = [], isLoading: locationsLoading } = useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const response = await apiCall('/api/locations');
      if (!response.ok) throw new Error('Failed to fetch locations');
      const data = await response.json();
      return data.locations as Location[];
    },
  });

  const loading = devicesLoading || regionsLoading || schoolsLoading || locationsLoading;

  // Mutations
  const createDeviceMutation = useMutation({
    mutationFn: async (deviceData: typeof formData) => {
      const response = await apiCall('/api/devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deviceData)
      });
      if (!response.ok) throw new Error('Failed to create device');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      toast.success('Device created successfully');
      setShowAddDialog(false);
      setFormData({ name: '', deviceType: '', location: '', school: '', status: 'active' });
    },
    onError: (error) => {
      console.error('Error creating device:', error);
      toast.error('Failed to create device');
    }
  });

  const updateDeviceMutation = useMutation({
    mutationFn: async (deviceData: typeof formData) => {
      const response = await apiCall(`/api/devices/${selectedDevice?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deviceData)
      });
      if (!response.ok) throw new Error('Failed to update device');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      toast.success('Device updated successfully');
      setShowEditDialog(false);
      setFormData({ name: '', deviceType: '', location: '', school: '', status: 'active' });
    },
    onError: (error) => {
      console.error('Error updating device:', error);
      toast.error('Failed to update device');
    }
  });

  const deleteDeviceMutation = useMutation({
    mutationFn: async (deviceId: string) => {
      const response = await apiCall(`/api/devices/${deviceId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete device');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      toast.success('Device deleted successfully');
      setShowDeleteDialog(false);
      setSelectedDevice(null);
    },
    onError: (error) => {
      console.error('Error deleting device:', error);
      toast.error('Failed to delete device');
    }
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ deviceId, status, reason }: { deviceId: string; status: 'active' | 'inactive'; reason?: string }) => {
      const response = await apiCall(`/api/devices/${deviceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, deactivationReason: reason })
      });
      if (!response.ok) throw new Error('Failed to toggle device status');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      toast.success('Device status updated successfully');
      setDeactivationDialog({ isOpen: false, device: null, reason: '' });
    },
    onError: (error) => {
      console.error('Error toggling device status:', error);
      toast.error('Failed to update device status');
    }
  });

  // Filter locations by selected school
  const filteredLocations = locations.filter(loc => loc.school === formData.school);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.deviceType || !formData.location || !formData.school) {
      toast.error('All fields are required');
      return;
    }

    if (showEditDialog) {
      updateDeviceMutation.mutate(formData);
    } else {
      createDeviceMutation.mutate(formData);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!selectedDevice) return;
    deleteDeviceMutation.mutate(selectedDevice.id);
  };

  // Toggle device status
  const toggleDeviceStatus = async (device: Device) => {
    if (!user || (user.role !== 'admin' && user.role !== 'engineer')) {
      toast.error('Only admins and engineers can toggle device status.');
      return;
    }

    const newStatus = device.status === 'active' ? 'inactive' : 'active';
    
    // If deactivating, show dialog for reason
    if (newStatus === 'inactive') {
      setDeactivationDialog({
        isOpen: true,
        device,
        reason: ''
      });
      return;
    }

    // If activating, proceed directly
    toggleStatusMutation.mutate({
      deviceId: device.id,
      status: newStatus
    });
  };

  const handleDeactivation = () => {
    if (!deactivationDialog.device) return;
    
    toggleStatusMutation.mutate({
      deviceId: deactivationDialog.device.id,
      status: 'inactive',
      reason: deactivationDialog.reason
    });
  };

  // Open edit dialog
  const openEditDialog = (device: Device) => {
    setSelectedDevice(device);
    setFormData({
      name: device.name,
      deviceType: device.deviceType,
      location: device.location,
      school: device.school,
      status: device.status
    });
    setShowEditDialog(true);
  };

  // Open delete dialog
  const openDeleteDialog = (device: Device) => {
    setSelectedDevice(device);
    setShowDeleteDialog(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading devices...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Admin Dashboard
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Device Management</h1>
            <p className="text-muted-foreground">Manage devices across all schools and locations</p>
          </div>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Device
        </Button>
      </div>

      {/* Devices Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {devices.map((device) => (
          <Card key={device.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Laptop className="w-5 h-5 text-orange-500" />
                  <CardTitle className="text-lg">{device.name}</CardTitle>
                </div>
                <Badge variant={device.status === 'active' ? 'default' : 'secondary'}>
                  {device.status}
                </Badge>
              </div>
              <CardDescription>{device.deviceType.toUpperCase()}</CardDescription>
              <div className="space-y-1">
                <Badge variant="outline" className="text-xs">
                  🏫 {device.schoolName || 'Unknown School'}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  📍 {device.locationName || 'Unknown Location'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => toggleDeviceStatus(device)}
                  className={`flex-1 ${device.status === 'active' ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}
                >
                  {device.status === 'active' ? (
                    <>
                      <PowerOff className="w-4 h-4 mr-1" />
                      Deactivate
                    </>
                  ) : (
                    <>
                      <Power className="w-4 h-4 mr-1" />
                      Activate
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => openEditDialog(device)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => openDeleteDialog(device)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {devices.length === 0 && (
        <div className="text-center py-12">
          <Laptop className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No devices found</h3>
          <p className="text-muted-foreground mb-4">Get started by adding your first device</p>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add First Device
          </Button>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog || showEditDialog} onOpenChange={(open) => {
        if (!open) {
          setShowAddDialog(false);
          setShowEditDialog(false);
          setFormData({ name: '', deviceType: '', location: '', school: '', status: 'active' });
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {showEditDialog ? 'Edit Device' : 'Add New Device'}
            </DialogTitle>
            <DialogDescription>
              {showEditDialog 
                ? 'Update the device information below.' 
                : 'Create a new device in a specific location.'
              }
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Device Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter device name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="deviceType">Device Type *</Label>
                <Select value={formData.deviceType} onValueChange={(value) => setFormData({ ...formData, deviceType: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select device type" />
                  </SelectTrigger>
                  <SelectContent>
                    {deviceTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="school">School *</Label>
                <Select value={formData.school} onValueChange={(value) => setFormData({ ...formData, school: value, location: '' })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a school" />
                  </SelectTrigger>
                  <SelectContent>
                    {schools.map((school) => (
                      <SelectItem key={school.id} value={school.id}>
                        {school.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location *</Label>
                <Select value={formData.location} onValueChange={(value) => setFormData({ ...formData, location: value })} disabled={!formData.school}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a location" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredLocations.map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select value={formData.status} onValueChange={(value: 'active' | 'inactive') => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setShowAddDialog(false);
                  setShowEditDialog(false);
                  setFormData({ name: '', deviceType: '', location: '', school: '', status: 'active' });
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createDeviceMutation.isPending || updateDeviceMutation.isPending}>
                {(createDeviceMutation.isPending || updateDeviceMutation.isPending) && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {showEditDialog ? 'Update Device' : 'Create Device'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Device</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedDevice?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteDeviceMutation.isPending}
            >
              {deleteDeviceMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Device Deactivation Dialog */}
      <Dialog open={deactivationDialog.isOpen} onOpenChange={(open) => {
        if (!open) {
          setDeactivationDialog({ isOpen: false, device: null, reason: '' });
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deactivate Device</DialogTitle>
            <DialogDescription>
              Please provide a reason for deactivating "{deactivationDialog.device?.name}".
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="deactivation-reason">Reason for deactivation</Label>
              <Textarea
                id="deactivation-reason"
                value={deactivationDialog.reason}
                onChange={(e) => setDeactivationDialog(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Enter the reason for deactivating this device..."
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setDeactivationDialog({ isOpen: false, device: null, reason: '' })}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (!deactivationDialog.reason.trim()) {
                  toast.error('Please provide a reason for deactivation');
                  return;
                }
                handleDeactivation();
              }}
              className="bg-red-600 hover:bg-red-700"
              disabled={toggleStatusMutation.isPending}
            >
              {toggleStatusMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Deactivate Device
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
