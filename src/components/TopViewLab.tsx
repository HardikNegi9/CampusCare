import { ArrowLeft, Monitor, Camera, Printer, Server, AlertTriangle, CheckCircle2, Power } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { useState, useEffect } from 'react';
import { Lab, Device } from '../types';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from './ui/use-toast';

interface TopViewLabProps {
  lab: Lab;
  onBack: () => void;
}

interface DeactivationDialog {
  isOpen: boolean;
  device: Device | null;
  reason: string;
}

export const TopViewLab = ({ lab, onBack }: TopViewLabProps) => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingDevice, setUpdatingDevice] = useState<string | null>(null);
  const [deactivationDialog, setDeactivationDialog] = useState<DeactivationDialog>({
    isOpen: false,
    device: null,
    reason: ''
  });

  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/devices?locationId=${lab.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setDevices(data.devices || []);
        }
      } catch (error) {
        console.error('Error fetching devices:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDevices();
  }, [lab.id]);

  const toggleDeviceStatus = async (device: Device) => {
    if (!user || (user.role !== 'admin' && user.role !== 'engineer')) {
      toast({
        title: 'Permission Denied',
        description: 'Only admins and engineers can toggle device status.',
        variant: 'destructive',
      });
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
    await performStatusUpdate(device, newStatus);
  };

  const performStatusUpdate = async (device: Device, newStatus: 'active' | 'inactive', deactivationReason?: string) => {
    setUpdatingDevice(device.id);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/devices/${device.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          status: newStatus,
          deactivationReason 
        })
      });

      console.log('Response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('Update successful:', result);
        
        // Update local state
        setDevices(prevDevices => 
          prevDevices.map(d => 
            d.id === device.id 
              ? { ...d, status: newStatus as 'active' | 'inactive' }
              : d
          )
        );

        toast({
          title: 'Device Updated',
          description: `${device.name} is now ${newStatus}.`,
        });

        // Close dialog if it was open
        setDeactivationDialog({
          isOpen: false,
          device: null,
          reason: ''
        });
      } else {
        const errorData = await response.json();
        console.error('API Error:', response.status, errorData);
        throw new Error(`Server responded with ${response.status}: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error toggling device status:', error);
      toast({
        title: 'Update Failed',
        description: `Failed to update device status: ${error instanceof Error ? error.message : 'Please try again.'}`,
        variant: 'destructive',
      });
    } finally {
      setUpdatingDevice(null);
    }
  };

  const handleDeactivationSubmit = () => {
    if (!deactivationDialog.device) return;
    
    if (!deactivationDialog.reason.trim()) {
      toast({
        title: 'Reason Required',
        description: 'Please provide a reason for deactivation.',
        variant: 'destructive',
      });
      return;
    }

    performStatusUpdate(deactivationDialog.device, 'inactive', deactivationDialog.reason);
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType.toLowerCase()) {
      case 'computer':
      case 'pc':
      case 'desktop':
        return <Monitor className="h-4 w-4" />;
      case 'camera':
      case 'webcam':
        return <Camera className="h-4 w-4" />;
      case 'printer':
        return <Printer className="h-4 w-4" />;
      case 'server':
        return <Server className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': 
        return <CheckCircle2 className="h-3 w-3 text-green-600" />;
      case 'inactive': 
        return <AlertTriangle className="h-3 w-3 text-red-600" />;
      default: 
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Loading devices...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Deactivation Reason Dialog */}
      <Dialog open={deactivationDialog.isOpen} onOpenChange={(open) => 
        setDeactivationDialog(prev => ({ ...prev, isOpen: open }))
      }>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deactivate Device</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p>
              You are about to deactivate <strong>{deactivationDialog.device?.name}</strong>. 
              Please provide a reason for this action.
            </p>
            <div>
              <Label htmlFor="deactivation-reason">Reason for deactivation *</Label>
              <Textarea
                id="deactivation-reason"
                value={deactivationDialog.reason}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDeactivationDialog(prev => ({ 
                  ...prev, 
                  reason: e.target.value 
                }))}
                placeholder="Enter reason for deactivation..."
                className="mt-1 min-h-[100px]"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => setDeactivationDialog({
                isOpen: false,
                device: null,
                reason: ''
              })}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeactivationSubmit}
              disabled={!deactivationDialog.reason.trim()}
            >
              Deactivate Device
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Device Types
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{lab.name}</h1>
            <p className="text-muted-foreground">
              {lab.building ? `${lab.building} - Floor ${lab.floor || 'N/A'}` : 'Lab Location'}
            </p>
          </div>
        </div>

        {devices.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-16">
              <div className="text-center">
                <Monitor className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No devices found</h3>
                <p className="text-muted-foreground">
                  There are no devices assigned to this location yet.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {devices.map((device) => (
              <Card key={device.id} className="relative group hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getDeviceIcon(device.deviceType)}
                      <CardTitle className="text-sm font-medium truncate">
                        {device.name}
                      </CardTitle>
                    </div>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(device.status)}
                      <Badge variant={device.status === 'active' ? 'default' : 'destructive'} className="text-xs">
                        {device.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Type:</span>
                      <span className="font-medium">{device.deviceType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>ID:</span>
                      <span className="font-mono">{device.id.slice(-8)}</span>
                    </div>
                    {device.serialNumber && (
                      <div className="flex justify-between">
                        <span>Serial:</span>
                        <span className="font-mono text-xs">{device.serialNumber}</span>
                      </div>
                    )}
                  </div>
                  
                  {(user?.role === 'admin' || user?.role === 'engineer') && (
                    <div className="mt-4 pt-3 border-t">
                      <Button
                        size="sm"
                        variant={device.status === 'active' ? 'destructive' : 'default'}
                        className="w-full"
                        onClick={() => toggleDeviceStatus(device)}
                        disabled={updatingDevice === device.id}
                      >
                        <Power className="h-3 w-3 mr-1" />
                        {updatingDevice === device.id 
                          ? 'Updating...' 
                          : device.status === 'active' 
                            ? 'Deactivate' 
                            : 'Activate'
                        }
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
};
