import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface RecyclerVerificationData {
  id: string;
  verification_status: string | null;
  profile_completed: boolean | null;
  full_name: string | null;
  company_name: string | null;
  residential_address: string | null;
  truck_size: string | null;
  truck_number_plate: string | null;
  profile_photo_url: string | null;
  email?: string;
  phone?: string;
  created_at?: string;
}

interface UseRecyclerVerificationReturn {
  verificationData: RecyclerVerificationData | null;
  isLoading: boolean;
  error: string | null;
  isVerified: boolean;
  verificationStatus: string;
  refreshVerification: () => Promise<void>;
}

export const useRecyclerVerification = (): UseRecyclerVerificationReturn => {
  const [verificationData, setVerificationData] = useState<RecyclerVerificationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVerificationData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get current authenticated user
      const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();

      if (authError) {
        throw new Error(`Auth error: ${authError.message}`);
      }

      if (!currentUser) {
        throw new Error('No authenticated user found');
      }

      console.log('useRecyclerVerification: Fetching data for user:', currentUser.id);

      // Fetch recycler data from database
      const { data: recyclerData, error: recyclerError } = await supabase
        .from('recyclers')
        .select('verification_status, full_name, company_name, residential_address, truck_size, truck_number_plate, profile_photo_url, profile_completed')
        .eq('id', currentUser.id)
        .single();

      if (recyclerError) {
        console.error('useRecyclerVerification: Database error:', recyclerError);
        
        // Try alternative query without .single()
        const { data: altData, error: altError } = await supabase
          .from('recyclers')
          .select('verification_status, full_name, company_name, residential_address, truck_size, truck_number_plate, profile_photo_url, profile_completed')
          .eq('id', currentUser.id);
          
        if (altError) {
          throw new Error(`Database error: ${altError.message}`);
        } else if (altData && altData.length > 0) {
          const combinedData = {
            id: currentUser.id,
            ...altData[0],
            email: currentUser.email,
            phone: currentUser.user_metadata?.phone || '',
            created_at: currentUser.created_at,
          };
          setVerificationData(combinedData);
        } else {
          throw new Error('No recycler data found');
        }
      } else {
        const combinedData = {
          id: currentUser.id,
          ...recyclerData,
          email: currentUser.email,
          phone: currentUser.user_metadata?.phone || '',
          created_at: currentUser.created_at,
        };
        setVerificationData(combinedData);
      }

      console.log('useRecyclerVerification: Data fetched successfully:', recyclerData);

    } catch (err: any) {
      console.error('useRecyclerVerification: Error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshVerification = useCallback(async () => {
    console.log('useRecyclerVerification: Force refresh triggered');
    await fetchVerificationData();
  }, [fetchVerificationData]);

  useEffect(() => {
    fetchVerificationData();
  }, [fetchVerificationData]);

  // Force refresh on mount to ensure we get latest data
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchVerificationData();
    }, 1000); // Refresh after 1 second to ensure auth is ready
    
    return () => clearTimeout(timer);
  }, []);

  // Computed values
  const isVerified = verificationData?.verification_status === 'approved';
  const verificationStatus = verificationData?.verification_status || 'incomplete';

  return {
    verificationData,
    isLoading,
    error,
    isVerified,
    verificationStatus,
    refreshVerification,
  };
};
