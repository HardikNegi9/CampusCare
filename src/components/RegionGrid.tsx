'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Building2, ChevronRight, MoreHorizontal, Loader2, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Region } from '@/types/index';
import { useApiCall } from '@/hooks/useApiCall';

interface RegionGridProps {
  onRegionSelect: (region: Region) => void;
}

export const RegionGrid = ({ onRegionSelect }: RegionGridProps) => {
  const [showAll, setShowAll] = useState(false);
  const { apiCall } = useApiCall();

  const { data: regions = [], isLoading, error } = useQuery({
    queryKey: ['regions'],
    queryFn: async () => {
      const response = await apiCall('/api/region');
      if (!response.ok) {
        throw new Error('Failed to fetch regions');
      }
      const data = await response.json();
      console.log('Regions fetched:', data.regions); // Debug log
      return data.regions as Region[];
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground">School Device Management</h1>
          <p className="text-muted-foreground mt-2">Loading regions...</p>
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
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground">School Device Management</h1>
          <p className="text-muted-foreground mt-2">Select a region to manage devices</p>
        </div>
        <Alert variant="destructive" className="max-w-md mx-auto">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load regions. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  const visibleRegions = showAll ? (regions || []) : (regions || []).slice(0, 4);
  const hasMore = (regions || []).length > 4;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground">School Device Management</h1>
        <p className="text-muted-foreground mt-2">Select a region to manage devices</p>
      </div>

      {/* Main 2x2 Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {visibleRegions.slice(0, 4).map((region, index) => (
          <Card 
            key={region.id || `region-${index}`}
            className="hover:shadow-lg transition-shadow cursor-pointer group"
            onClick={() => onRegionSelect(region)}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{region.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {region.description || 'Region'}
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* More Regions Carousel */}
      {hasMore && (
        <div className="text-center">
          {!showAll ? (
            <Button 
              variant="outline" 
              onClick={() => setShowAll(true)}
              className="gap-2"
            >
              <MoreHorizontal className="h-4 w-4" />
              Show More Regions
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-6xl mx-auto">
                {(regions || []).slice(4).map((region, index) => (
                  <Card 
                    key={region.id || `region-more-${index}`}
                    className="hover:shadow-md transition-shadow cursor-pointer group"
                    onClick={() => onRegionSelect(region)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Building2 className="h-5 w-5 text-primary" />
                          <div>
                            <h4 className="font-medium">{region.name}</h4>
                            <p className="text-xs text-muted-foreground">
                              {region.description || 'Region'}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <Button 
                variant="ghost" 
                onClick={() => setShowAll(false)}
              >
                Show Less
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};