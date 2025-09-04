-- Add latitude and longitude fields to customers table
-- This will allow storing customer's current location for distance calculations

-- Add location columns to customers table
ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS last_location_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create index for location-based queries
CREATE INDEX IF NOT EXISTS idx_customers_location ON public.customers(latitude, longitude);

-- Create function to update customer location
CREATE OR REPLACE FUNCTION public.update_customer_location(
    p_customer_id UUID,
    p_latitude DOUBLE PRECISION,
    p_longitude DOUBLE PRECISION
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE public.customers
    SET
        latitude = p_latitude,
        longitude = p_longitude,
        last_location_updated = NOW(),
        updated_at = NOW()
    WHERE id = p_customer_id;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.update_customer_location TO authenticated;

-- Add comment
COMMENT ON COLUMN public.customers.latitude IS 'Customer current GPS latitude';
COMMENT ON COLUMN public.customers.longitude IS 'Customer current GPS longitude';
COMMENT ON COLUMN public.customers.last_location_updated IS 'When customer location was last updated';

-- Verify the changes
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'customers' 
AND table_schema = 'public'
AND column_name IN ('latitude', 'longitude', 'last_location_updated')
ORDER BY column_name;
