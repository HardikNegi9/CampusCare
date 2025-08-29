'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue,} from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,} from '@/components/ui/alert-dialog';
import { ArrowLeft, Plus, Edit, Trash2, School, Loader2 } from 'lucide-react';
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
  description?: string;
  address?: string;
  region: string;
  regionName?: string;
  locationCount?: number;
}

interface SchoolManagementProps {
  onBack: () => void;
}

export function SchoolManagement({ onBack }: SchoolManagementProps) {
  const { user } = useAuth();
  const { apiCall } = useApiCall();
  const queryClient = useQueryClient();
  
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    region: ''
  });

  // React Query hooks for data fetching
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

  const loading = regionsLoading || schoolsLoading;

  // Mutations
  const createSchoolMutation = useMutation({
    mutationFn: async (schoolData: typeof formData) => {
      const response = await apiCall('/api/schools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(schoolData)
      });
      if (!response.ok) throw new Error('Failed to create school');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schools'] });
      toast.success('School created successfully');
      setShowAddDialog(false);
      setFormData({ name: '', description: '', address: '', region: '' });
    },
    onError: (error) => {
      console.error('Error creating school:', error);
      toast.error('Failed to create school');
    }
  });

  const updateSchoolMutation = useMutation({
    mutationFn: async (schoolData: typeof formData) => {
      const response = await apiCall(`/api/schools/${selectedSchool?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(schoolData)
      });
      if (!response.ok) throw new Error('Failed to update school');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schools'] });
      toast.success('School updated successfully');
      setShowEditDialog(false);
      setFormData({ name: '', description: '', address: '', region: '' });
    },
    onError: (error) => {
      console.error('Error updating school:', error);
      toast.error('Failed to update school');
    }
  });

  const deleteSchoolMutation = useMutation({
    mutationFn: async (schoolId: string) => {
      const response = await apiCall(`/api/schools/${schoolId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete school');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schools'] });
      toast.success('School deleted successfully');
      setShowDeleteDialog(false);
      setSelectedSchool(null);
    },
    onError: (error) => {
      console.error('Error deleting school:', error);
      toast.error('Failed to delete school');
    }
  });

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.region) {
      toast.error('School name and region are required');
      return;
    }

    if (showEditDialog) {
      updateSchoolMutation.mutate(formData);
    } else {
      createSchoolMutation.mutate(formData);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!selectedSchool) return;
    deleteSchoolMutation.mutate(selectedSchool.id);
  };

  // Open edit dialog
  const openEditDialog = (school: School) => {
    setSelectedSchool(school);
    setFormData({
      name: school.name,
      description: school.description || '',
      address: school.address || '',
      region: school.region
    });
    setShowEditDialog(true);
  };

  // Open delete dialog
  const openDeleteDialog = (school: School) => {
    setSelectedSchool(school);
    setShowDeleteDialog(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading schools...</span>
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
            <h1 className="text-2xl font-bold">School Management</h1>
            <p className="text-muted-foreground">Manage schools across all regions</p>
          </div>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add School
        </Button>
      </div>

      {/* Schools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {schools.map((school) => (
          <Card key={school.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <School className="w-5 h-5 text-green-500" />
                  <CardTitle className="text-lg">{school.name}</CardTitle>
                </div>
                <Badge variant="secondary">
                  {school.locationCount || 0} Locations
                </Badge>
              </div>
              {school.description && (
                <CardDescription>{school.description}</CardDescription>
              )}
              {school.address && (
                <CardDescription className="text-sm mt-1">
                  📍 {school.address}
                </CardDescription>
              )}
              <Badge variant="outline" className="w-fit">
                {school.regionName || 'Unknown Region'}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => openEditDialog(school)}
                  className="flex-1"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => openDeleteDialog(school)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {schools.length === 0 && (
        <div className="text-center py-12">
          <School className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No schools found</h3>
          <p className="text-muted-foreground mb-4">Get started by creating your first school</p>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add First School
          </Button>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog || showEditDialog} onOpenChange={(open) => {
        if (!open) {
          setShowAddDialog(false);
          setShowEditDialog(false);
          setFormData({ name: '', description: '', address: '', region: '' });
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {showEditDialog ? 'Edit School' : 'Add New School'}
            </DialogTitle>
            <DialogDescription>
              {showEditDialog 
                ? 'Update the school information below.' 
                : 'Create a new school within a region.'
              }
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">School Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter school name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="region">Region *</Label>
                <Select value={formData.region} onValueChange={(value) => setFormData({ ...formData, region: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a region" />
                  </SelectTrigger>
                  <SelectContent>
                    {regions.map((region) => (
                      <SelectItem key={region.id} value={region.id}>
                        {region.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Enter school address"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter school description (optional)"
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
                  setFormData({ name: '', description: '', address: '', region: '' });
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createSchoolMutation.isPending || updateSchoolMutation.isPending}>
                {(createSchoolMutation.isPending || updateSchoolMutation.isPending) && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {showEditDialog ? 'Update School' : 'Create School'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete School</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedSchool?.name}"? This action cannot be undone.
              All locations and devices in this school will also be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteSchoolMutation.isPending}
            >
              {deleteSchoolMutation.isPending && (
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
