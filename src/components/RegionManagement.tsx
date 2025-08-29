'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,} from '@/components/ui/alert-dialog';
import { ArrowLeft, Plus, Edit, Trash2, Building2, Loader2 } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { useApiCall } from '@/hooks/useApiCall';
import { toast } from 'sonner';

interface Region {
  id: string;
  name: string;
  description?: string;
  schoolCount?: number;
}

interface RegionManagementProps {
  onBack: () => void;
}

export function RegionManagement({ onBack }: RegionManagementProps) {
  const { user } = useAuth();
  const { apiCall } = useApiCall();
  const queryClient = useQueryClient();
  
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  // React Query hook for fetching regions
  const { data: regions = [], isLoading: loading } = useQuery({
    queryKey: ['regions'],
    queryFn: async () => {
      const response = await apiCall('/api/region');
      if (!response.ok) throw new Error('Failed to fetch regions');
      const data = await response.json();
      return data.regions as Region[];
    },
  });

  // Mutations
  const createRegionMutation = useMutation({
    mutationFn: async (regionData: typeof formData) => {
      const response = await apiCall('/api/region', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regionData)
      });
      if (!response.ok) throw new Error('Failed to create region');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['regions'] });
      toast.success('Region created successfully');
      setShowAddDialog(false);
      setFormData({ name: '', description: '' });
    },
    onError: (error) => {
      console.error('Error creating region:', error);
      toast.error('Failed to create region');
    }
  });

  const updateRegionMutation = useMutation({
    mutationFn: async (regionData: typeof formData) => {
      const response = await apiCall(`/api/region/${selectedRegion?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regionData)
      });
      if (!response.ok) throw new Error('Failed to update region');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['regions'] });
      toast.success('Region updated successfully');
      setShowEditDialog(false);
      setFormData({ name: '', description: '' });
    },
    onError: (error) => {
      console.error('Error updating region:', error);
      toast.error('Failed to update region');
    }
  });

  const deleteRegionMutation = useMutation({
    mutationFn: async (regionId: string) => {
      const response = await apiCall(`/api/region/${regionId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete region');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['regions'] });
      toast.success('Region deleted successfully');
      setShowDeleteDialog(false);
      setSelectedRegion(null);
    },
    onError: (error) => {
      console.error('Error deleting region:', error);
      toast.error('Failed to delete region');
    }
  });

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Region name is required');
      return;
    }

    if (showEditDialog) {
      updateRegionMutation.mutate(formData);
    } else {
      createRegionMutation.mutate(formData);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!selectedRegion) return;
    deleteRegionMutation.mutate(selectedRegion.id);
  };

  // Open edit dialog
  const openEditDialog = (region: Region) => {
    setSelectedRegion(region);
    setFormData({
      name: region.name,
      description: region.description || ''
    });
    setShowEditDialog(true);
  };

  // Open delete dialog
  const openDeleteDialog = (region: Region) => {
    setSelectedRegion(region);
    setShowDeleteDialog(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading regions...</span>
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
            <h1 className="text-2xl font-bold">Region Management</h1>
            <p className="text-muted-foreground">Manage geographical regions</p>
          </div>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Region
        </Button>
      </div>

      {/* Regions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {regions.map((region) => (
          <Card key={region.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-500" />
                  <CardTitle className="text-lg">{region.name}</CardTitle>
                </div>
                <Badge variant="secondary">
                  {region.schoolCount || 0} Schools
                </Badge>
              </div>
              {region.description && (
                <CardDescription>{region.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => openEditDialog(region)}
                  className="flex-1"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => openDeleteDialog(region)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {regions.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No regions found</h3>
          <p className="text-muted-foreground mb-4">Get started by creating your first region</p>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add First Region
          </Button>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog || showEditDialog} onOpenChange={(open) => {
        if (!open) {
          setShowAddDialog(false);
          setShowEditDialog(false);
          setFormData({ name: '', description: '' });
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {showEditDialog ? 'Edit Region' : 'Add New Region'}
            </DialogTitle>
            <DialogDescription>
              {showEditDialog 
                ? 'Update the region information below.' 
                : 'Create a new geographical region for organizing schools.'
              }
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Region Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter region name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter region description (optional)"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setShowAddDialog(false);
                  setShowEditDialog(false);
                  setFormData({ name: '', description: '' });
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createRegionMutation.isPending || updateRegionMutation.isPending}>
                {(createRegionMutation.isPending || updateRegionMutation.isPending) && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {showEditDialog ? 'Update Region' : 'Create Region'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Region</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedRegion?.name}"? This action cannot be undone.
              All schools and devices in this region will also be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteRegionMutation.isPending}
            >
              {deleteRegionMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
