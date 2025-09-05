import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../constants';
import { supabase } from '../lib/supabase';

// ===== REAL NOTIFICATION SERVICE =====
// This handles actual notification counts from the database

const notificationService = {
  getUnreadCount: async (): Promise<number> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;

      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) {
        console.error('Error fetching unread count:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return 0;
    }
  }
};

interface NotificationBadgeProps {
  size?: 'small' | 'medium' | 'large';
  showCount?: boolean;
}

export default function NotificationBadge({ 
  size = 'medium', 
  showCount = true 
}: NotificationBadgeProps) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const count = await notificationService.getUnreadCount();
        setUnreadCount(count);
      } catch (error) {
        console.error('Error fetching unread count:', error);
        setUnreadCount(0);
      }
    };

    fetchUnreadCount();

    // Refresh count every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);

    return () => clearInterval(interval);
  }, []);

  if (unreadCount === 0) {
    return null;
  }

  const getBadgeSize = () => {
    switch (size) {
      case 'small':
        return { width: 16, height: 16, fontSize: 10 };
      case 'large':
        return { width: 24, height: 24, fontSize: 14 };
      default: // medium
        return { width: 20, height: 20, fontSize: 12 };
    }
  };

  const badgeSize = getBadgeSize();

  return (
    <View style={[styles.badge, { width: badgeSize.width, height: badgeSize.height }]}>
      {showCount && (
        <Text style={[styles.count, { fontSize: badgeSize.fontSize }]}>
          {unreadCount > 99 ? '99+' : unreadCount.toString()}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: COLORS.red,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: -5,
    right: -5,
    minWidth: 20,
    minHeight: 20,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  count: {
    color: COLORS.white,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

