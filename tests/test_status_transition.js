// Test script to verify status transition logic
const { validateAndUpdateStatus, isValidStatusTransition } = require('./lib/pickupRequestStatus.ts');

console.log('Testing status transitions...');

// Test the specific transition that was failing
const canTransition = isValidStatusTransition('pending', 'confirmed');
console.log('Can transition from pending to confirmed:', canTransition);

// Test other valid transitions
console.log('Can transition from pending to assigned:', isValidStatusTransition('pending', 'assigned'));
console.log('Can transition from assigned to confirmed:', isValidStatusTransition('assigned', 'confirmed'));
console.log('Can transition from confirmed to accepted:', isValidStatusTransition('confirmed', 'accepted'));

// Test invalid transitions
console.log('Can transition from pending to accepted:', isValidStatusTransition('pending', 'accepted'));
console.log('Can transition from completed to pending:', isValidStatusTransition('completed', 'pending'));
