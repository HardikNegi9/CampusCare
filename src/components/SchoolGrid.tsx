import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, School as SchoolIcon, Monitor, Camera, Printer, Loader2, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Region, School } from '../types';
import { useApiCall } from '@/hooks/useApiCall';

interface SchoolGridProps {
  region: Region;
  onBack: () => void;
  onSchoolSelect: (school: School) => void;
}

export const SchoolGrid = ({ region, onBack, onSchoolSelect }: SchoolGridProps) => {
  const { apiCall } = useApiCall();

  const { data: schools = [], isLoading, error } = useQuery({
    queryKey: ['schools', region.id],
    queryFn: async () => {
      const response = await apiCall(`/api/region/${region.id}/schools`);
      if (!response.ok) {
        throw new Error('Failed to fetch schools');
      }
      const data = await response.json();
      return data.schools as School[];
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Regions
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{region.name}</h1>
            <p className="text-muted-foreground">Loading schools...</p>
          </div>
        </div>
        <div className="flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Regions
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{region.name}</h1>
          </div>
        </div>
        <Alert variant="destructive" className="max-w-md mx-auto">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load schools. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Regions
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{region.name}</h1>
          <p className="text-muted-foreground">{schools.length} schools in this region</p>
        </div>
      </div>

      {schools.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <SchoolIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground">No schools found</h3>
            <p className="text-sm text-muted-foreground mt-1">
              This region doesn't have any schools yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {schools.map((school) => (
            <Card 
              key={school.id}
              className="hover:shadow-lg transition-shadow cursor-pointer group"
              onClick={() => onSchoolSelect(school)}
            >
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <SchoolIcon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{school.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {school.address}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    Click to view locations and devices
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};