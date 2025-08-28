'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Filter, Download, Eye } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface DeviceLog {
  id: string;
  device: {
    id: string;
    name: string;
    deviceType: string;
  };
  action: string;
  description: string;
  deactivationReason?: string;
  oldValues?: {
    status?: string;
    location?: string;
    deviceType?: string;
    name?: string;
  };
  newValues?: {
    status?: string;
    location?: string;
    deviceType?: string;
    name?: string;
  };
  performedBy: {
    id: string;
    username: string;
    email: string;
    role: string;
  };
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
}

export default function DeviceLogsManagement() {
  const [filters, setFilters] = useState({
    action: 'all',
    deviceId: '',
    startDate: '',
    endDate: '',
    page: 1
  });
  const [selectedLog, setSelectedLog] = useState<DeviceLog | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  // Fetch device logs
  const { data: logsData, isLoading, refetch } = useQuery({
    queryKey: ['device-logs', filters],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      
      if (filters.action !== 'all') params.append('action', filters.action);
      if (filters.deviceId) params.append('deviceId', filters.deviceId);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      params.append('page', filters.page.toString());
      params.append('limit', '20');

      const response = await fetch(`/api/device-logs?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch device logs');
      return response.json();
    }
  });

  const handleFilterChange = (key: string, value: string | number) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key !== 'page' ? 1 : typeof value === 'string' ? Number(value) : value // Reset page when other filters change
    }));
  };

  const clearFilters = () => {
    setFilters({
      action: 'all',
      deviceId: '',
      startDate: '',
      endDate: '',
      page: 1
    });
  };

  const exportLogs = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      
      if (filters.action !== 'all') params.append('action', filters.action);
      if (filters.deviceId) params.append('deviceId', filters.deviceId);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      params.append('limit', '1000'); // Export more records

      const response = await fetch(`/api/device-logs?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to export device logs');
      
      const data = await response.json();
      
      // Convert to CSV
      const csvContent = [
        ['Timestamp', 'Device', 'Action', 'Description', 'Deactivation Reason', 'Performed By', 'IP Address'].join(','),
        ...data.logs.map((log: DeviceLog) => [
          new Date(log.timestamp).toLocaleString(),
          `"${log.device.name}"`,
          log.action,
          `"${log.description}"`,
          log.deactivationReason ? `"${log.deactivationReason}"` : 'N/A',
          log.performedBy.username,
          log.ipAddress || 'N/A'
        ].join(','))
      ].join('\n');
      
      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `device-logs-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast.success('Device logs exported successfully');
    } catch (error) {
      toast.error('Failed to export device logs');
    }
  };

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'activated': return 'bg-green-100 text-green-800';
      case 'deactivated': return 'bg-red-100 text-red-800';
      case 'mounted': return 'bg-blue-100 text-blue-800';
      case 'unmounted': return 'bg-orange-100 text-orange-800';
      case 'moved': return 'bg-purple-100 text-purple-800';
      case 'created': return 'bg-cyan-100 text-cyan-800';
      case 'updated': return 'bg-yellow-100 text-yellow-800';
      case 'deleted': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const logs: DeviceLog[] = logsData?.logs || [];
  const pagination = logsData?.pagination || {};

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Device Activity Logs</CardTitle>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={exportLogs}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="outline" onClick={() => refetch()}>
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="action-filter">Action</Label>
            <Select value={filters.action} onValueChange={(value) => handleFilterChange('action', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="activated">Activated</SelectItem>
                <SelectItem value="deactivated">Deactivated</SelectItem>
                <SelectItem value="mounted">Mounted</SelectItem>
                <SelectItem value="unmounted">Unmounted</SelectItem>
                <SelectItem value="moved">Moved</SelectItem>
                <SelectItem value="created">Created</SelectItem>
                <SelectItem value="updated">Updated</SelectItem>
                <SelectItem value="deleted">Deleted</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="start-date">Start Date</Label>
            <Input
              id="start-date"
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="end-date">End Date</Label>
            <Input
              id="end-date"
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <Button variant="outline" onClick={clearFilters}>
              <Filter className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          </div>
        </div>

        {/* Logs Table */}
        {isLoading ? (
          <div>Loading device logs...</div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Performed By</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-sm">
                      {new Date(log.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{log.device.name}</div>
                        <div className="text-sm text-gray-500">{log.device.deviceType}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getActionBadgeColor(log.action)}>
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div title={log.description}>
                        <p className="truncate">{log.description}</p>
                        {log.deactivationReason && (
                          <p className="text-xs text-red-600 mt-1 truncate" title={log.deactivationReason}>
                            Reason: {log.deactivationReason}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{log.performedBy.username}</div>
                        <div className="text-sm text-gray-500">{log.performedBy.role}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedLog(log);
                          setIsDetailDialogOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {logs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      No device logs found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-between items-center mt-4">
                <div className="text-sm text-gray-500">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.totalCount)} of{' '}
                  {pagination.totalCount} logs
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!pagination.hasPrev}
                    onClick={() => handleFilterChange('page', pagination.page - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!pagination.hasNext}
                    onClick={() => handleFilterChange('page', pagination.page + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>

      {/* Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Device Log Details</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Device</Label>
                  <p className="text-sm">{selectedLog.device.name} ({selectedLog.device.deviceType})</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Action</Label>
                  <Badge className={getActionBadgeColor(selectedLog.action)}>
                    {selectedLog.action}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Timestamp</Label>
                  <p className="text-sm font-mono">{new Date(selectedLog.timestamp).toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Performed By</Label>
                  <p className="text-sm">{selectedLog.performedBy.username} ({selectedLog.performedBy.role})</p>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Description</Label>
                <p className="text-sm">{selectedLog.description}</p>
              </div>

              {selectedLog.deactivationReason && (
                <div>
                  <Label className="text-sm font-medium">Deactivation Reason</Label>
                  <p className="text-sm bg-red-50 p-2 rounded border">{selectedLog.deactivationReason}</p>
                </div>
              )}

              {selectedLog.oldValues && (
                <div>
                  <Label className="text-sm font-medium">Previous Values</Label>
                  <pre className="text-xs bg-gray-100 p-2 rounded">
                    {JSON.stringify(selectedLog.oldValues, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.newValues && (
                <div>
                  <Label className="text-sm font-medium">New Values</Label>
                  <pre className="text-xs bg-gray-100 p-2 rounded">
                    {JSON.stringify(selectedLog.newValues, null, 2)}
                  </pre>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">IP Address</Label>
                  <p className="text-sm font-mono">{selectedLog.ipAddress || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">User Agent</Label>
                  <p className="text-xs text-gray-500 break-all">{selectedLog.userAgent || 'N/A'}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
