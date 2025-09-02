import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { ADMIN_EMAIL, isAdminUser } from '../lib/adminConfig';
import { supabase } from '../lib/supabase';

export default function SplashScreen() {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    console.log('SplashScreen: Component mounted - Starting fresh flow');
    console.log('SplashScreen: Router object:', router);
    console.log('SplashScreen: Router.push function:', typeof router.push);
    
    // Add a small delay to ensure everything is properly initialized
    const timer = setTimeout(() => {
      console.log('SplashScreen: Setting ready state to true');
      setIsReady(true);
    }, 100);

    return () => clearTimeout(timer);
  }, [router]);

  useEffect(() => {
    if (!isReady) {
      console.log('SplashScreen: Not ready yet, waiting...');
      return;
    }

    // Check if router is ready
    if (!router || typeof router.push !== 'function') {
      console.log('SplashScreen: Router not ready, waiting...');
      return;
    }

    console.log('SplashScreen: Ready, checking auth state...');

    // Check authentication state
    const checkAuthState = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('SplashScreen: Auth state check error:', error);
          // Continue to onboarding on error
          navigateToOnboarding();
          return;
        }

        console.log('SplashScreen: Auth state check result:', session ? 'Authenticated' : 'Not authenticated');

        if (session) {
          // User is authenticated, check if they need to complete password reset
          const { data: { user } } = await supabase.auth.getUser();
          
          if (user) {
            console.log('SplashScreen: User email:', user.email);
            console.log('SplashScreen: Admin email from config:', ADMIN_EMAIL);
            console.log('SplashScreen: Email comparison:', `"${user.email}" === "${ADMIN_EMAIL}"`);
            console.log('SplashScreen: Is admin user:', isAdminUser(user.email));
            console.log('SplashScreen: User metadata:', user.user_metadata);
            console.log('SplashScreen: User role from metadata:', user.user_metadata?.role);
            
            // IMMEDIATE ADMIN CHECK - This should override everything else
            console.log('SplashScreen: Checking if user is admin...');
            console.log('SplashScreen: User email:', user.email);
            console.log('SplashScreen: Admin email from config:', ADMIN_EMAIL);
            console.log('SplashScreen: Email comparison result:', isAdminUser(user.email));
            
            if (isAdminUser(user.email)) {
              console.log('SplashScreen: ADMIN USER DETECTED - OVERRIDING ALL OTHER LOGIC');
              console.log('SplashScreen: About to update user metadata...');
              
              try {
                // Update user metadata to ensure admin role is set
                const { error: updateError } = await supabase.auth.updateUser({
                  data: { role: 'admin' }
                });
                if (updateError) {
                  console.error('SplashScreen: Error updating admin user metadata:', updateError);
                } else {
                  console.log('SplashScreen: User metadata updated successfully');
                }
                
                console.log('SplashScreen: FORCE NAVIGATING TO ADMIN PORTAL');
                console.log('SplashScreen: Router object:', router);
                console.log('SplashScreen: Router.replace function:', typeof router.replace);
                console.log('SplashScreen: About to call router.replace("/admin-screens/AdminPortal")');
                
                router.replace('/admin-screens/AdminPortal');
                console.log('SplashScreen: Admin navigation command sent - EXITING');
                return;
              } catch (navError) {
                console.error('SplashScreen: Navigation error:', navError);
                console.log('SplashScreen: Trying fallback navigation...');
                // Fallback navigation
                router.push('/admin-screens/AdminPortal');
                return;
              }
            } else {
              console.log('SplashScreen: NOT an admin user, continuing with normal flow');
              console.log('SplashScreen: This should not happen for admin@ecowastego.com');
            }
            
            // Check if user has a role (but only if not admin)
            if (user.app_metadata?.provider === 'email' && user.user_metadata?.role) {
              // User is authenticated and has a role, navigate to appropriate dashboard
              const role = user.user_metadata.role;
              console.log('SplashScreen: User authenticated with role:', role);
              
              // Double-check: if this is an admin user, they should go to admin portal regardless of role
              if (isAdminUser(user.email)) {
                console.log('SplashScreen: Admin user detected in role check, redirecting to admin portal');
                router.replace('/admin-screens/AdminPortal');
                return;
              }
              
              if (role === 'recycler') {
                router.replace('/(recycler-tabs)');
              } else {
                router.replace('/(tabs)');
              }
            } else {
              // User authenticated but no role, go to role selection
              console.log('SplashScreen: User authenticated but no role, going to role selection');
              router.replace('/RoleSelectionScreen');
            }
          }
        } else {
          // No session, go to onboarding
          console.log('SplashScreen: No session, going to onboarding');
          navigateToOnboarding();
        }
      } catch (error) {
        console.error('SplashScreen: Error checking auth state:', error);
        // On error, continue to onboarding
        navigateToOnboarding();
      }
    };

    const navigateToOnboarding = () => {
      const navigationTimer = setTimeout(() => {
        console.log('SplashScreen: 3 seconds passed, navigating to onboarding...');
        try {
          router.replace('/OnboardingScreen');
        } catch (error) {
          console.error('SplashScreen: Navigation error:', error);
        }
      }, 3000); // 3 seconds for better splash experience
      
      return () => clearTimeout(navigationTimer);
    };

    checkAuthState();
  }, [router, isReady]);

  console.log('SplashScreen: Rendering, isReady:', isReady);

  return (
    <View style={styles.container}>
      <Image source={require('../assets/images/logo.png')} style={styles.logo} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#207E06',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
  },

}); 