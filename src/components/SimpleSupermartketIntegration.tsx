import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

interface SimpleSupermartket {
  id: string;
  name: string;
  logo_url?: string | null;
  website?: string | null;
  is_active: boolean;
}

const SimpleSupermartketIntegration = () => {
  const [supermarkets, setSupermarkets] = useState<SimpleSupermartket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSupermarkets = async () => {
      try {
        const { data, error } = await supabase
          .from('supermarkets')
          .select('id, name, logo_url, website, is_active')
          .eq('is_active', true);
        
        if (error) throw error;
        setSupermarkets(data || []);
      } catch (err) {
        console.error('Error fetching supermarkets:', err);
        setError('Failed to load supermarkets.');
      } finally {
        setLoading(false);
      }
    };

    fetchSupermarkets();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, index) => (
          <Card key={index}>
            <CardHeader>
              <Skeleton className="h-32 w-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Supermarkets</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {supermarkets.map((supermarket) => (
          <Card key={supermarket.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              {supermarket.logo_url && (
                <img src={supermarket.logo_url} alt={supermarket.name} className="w-full h-32 object-contain" />
              )}
            </CardHeader>
            <CardContent>
              <h3 className="font-bold text-lg">{supermarket.name}</h3>
              {supermarket.website && (
                <a href={supermarket.website} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                  Visit Website
                </a>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default SimpleSupermartketIntegration;