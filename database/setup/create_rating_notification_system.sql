-- Create Rating Notification System
-- This handles notifications when customers rate recyclers

-- Create function to notify recycler when they receive a rating
CREATE OR REPLACE FUNCTION notify_recycler_rating_received()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger if rating is being set (not null) and it's different from before
  IF NEW.customer_rating IS NOT NULL AND (OLD.customer_rating IS NULL OR OLD.customer_rating != NEW.customer_rating) THEN
    -- Insert notification for the recycler
    INSERT INTO notifications (
      user_id,
      title,
      message,
      type,
      data,
      created_at
    ) VALUES (
      NEW.recycler_id,
      '⭐ New Rating Received!',
      'You received a ' || NEW.customer_rating || '/5 star rating from a customer. ' || 
      CASE 
        WHEN NEW.recycler_notes IS NOT NULL THEN 'Customer comment: "' || LEFT(NEW.recycler_notes, 100) || '"'
        ELSE 'Keep up the great work!'
      END,
      'rating_received',
      jsonb_build_object(
        'pickup_id', NEW.id,
        'rating', NEW.customer_rating,
        'comment', NEW.recycler_notes,
        'customer_id', NEW.customer_id,
        'recycler_id', NEW.recycler_id
      ),
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for rating notifications
DROP TRIGGER IF EXISTS trigger_notify_recycler_rating ON pickup_requests;
CREATE TRIGGER trigger_notify_recycler_rating
  AFTER UPDATE ON pickup_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_recycler_rating_received();

-- Create function to get recycler rating statistics
CREATE OR REPLACE FUNCTION get_recycler_rating_stats(p_recycler_id UUID)
RETURNS TABLE (
  total_ratings INTEGER,
  average_rating DECIMAL(3,2),
  five_star_count INTEGER,
  four_star_count INTEGER,
  three_star_count INTEGER,
  two_star_count INTEGER,
  one_star_count INTEGER,
  recent_ratings JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_ratings,
    ROUND(AVG(customer_rating), 2) as average_rating,
    COUNT(CASE WHEN customer_rating = 5 THEN 1 END)::INTEGER as five_star_count,
    COUNT(CASE WHEN customer_rating = 4 THEN 1 END)::INTEGER as four_star_count,
    COUNT(CASE WHEN customer_rating = 3 THEN 1 END)::INTEGER as three_star_count,
    COUNT(CASE WHEN customer_rating = 2 THEN 1 END)::INTEGER as two_star_count,
    COUNT(CASE WHEN customer_rating = 1 THEN 1 END)::INTEGER as one_star_count,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'rating', customer_rating,
          'comment', recycler_notes,
          'date', updated_at,
          'customer_id', customer_id
        ) ORDER BY updated_at DESC
      ) FILTER (WHERE customer_rating IS NOT NULL),
      '[]'::jsonb
    ) as recent_ratings
  FROM pickup_requests
  WHERE recycler_id = p_recycler_id
  AND customer_rating IS NOT NULL
  AND status = 'completed';
END;
$$ LANGUAGE plpgsql;

-- Create function to get recycler leaderboard by ratings
CREATE OR REPLACE FUNCTION get_recycler_rating_leaderboard()
RETURNS TABLE (
  recycler_id UUID,
  recycler_name TEXT,
  total_ratings INTEGER,
  average_rating DECIMAL(3,2),
  rank INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH rating_stats AS (
    SELECT 
      pr.recycler_id,
      r.full_name as recycler_name,
      COUNT(*)::INTEGER as total_ratings,
      ROUND(AVG(pr.customer_rating), 2) as average_rating
    FROM pickup_requests pr
    JOIN recyclers r ON pr.recycler_id = r.id
    WHERE pr.customer_rating IS NOT NULL
    AND pr.status = 'completed'
    GROUP BY pr.recycler_id, r.full_name
    HAVING COUNT(*) >= 3  -- Minimum 3 ratings to appear on leaderboard
  )
  SELECT 
    rs.recycler_id,
    rs.recycler_name,
    rs.total_ratings,
    rs.average_rating,
    ROW_NUMBER() OVER (ORDER BY rs.average_rating DESC, rs.total_ratings DESC)::INTEGER as rank
  FROM rating_stats rs
  ORDER BY rs.average_rating DESC, rs.total_ratings DESC
  LIMIT 20;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION notify_recycler_rating_received() TO authenticated;
GRANT EXECUTE ON FUNCTION get_recycler_rating_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_recycler_rating_leaderboard() TO authenticated;

-- Create index for better performance on rating queries
CREATE INDEX IF NOT EXISTS idx_pickup_requests_rating ON pickup_requests(recycler_id, customer_rating) WHERE customer_rating IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pickup_requests_rating_date ON pickup_requests(updated_at) WHERE customer_rating IS NOT NULL;
