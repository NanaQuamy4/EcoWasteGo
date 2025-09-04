// ===== PICKUP REQUEST STATUS MANAGEMENT =====
// This file provides utilities for managing pickup request status flow

export type PickupRequestStatus = 
  | 'pending'      // Initial state when request is created
  | 'assigned'     // When recycler is selected in SelectTruck
  | 'confirmed'    // When customer confirms in RecyclerProfileDetails
  | 'accepted'     // When recycler accepts in RecyclerRequests
  | 'in_progress'  // When recycler starts pickup
  | 'completed'    // When pickup is finished
  | 'cancelled'    // When customer cancels
  | 'rejected';    // When recycler rejects

// Status flow validation
export const STATUS_FLOW: Record<PickupRequestStatus, PickupRequestStatus[]> = {
  pending: ['assigned', 'confirmed', 'cancelled'], // Allow direct pending -> confirmed
  assigned: ['confirmed', 'cancelled'],
  confirmed: ['accepted', 'rejected', 'cancelled'],
  accepted: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: [], // Terminal state
  cancelled: [], // Terminal state
  rejected: []   // Terminal state
};

// Check if a status transition is valid
export const isValidStatusTransition = (
  currentStatus: PickupRequestStatus,
  newStatus: PickupRequestStatus
): boolean => {
  return STATUS_FLOW[currentStatus]?.includes(newStatus) || false;
};

// Get the next valid statuses for a given status
export const getNextValidStatuses = (currentStatus: PickupRequestStatus): PickupRequestStatus[] => {
  return STATUS_FLOW[currentStatus] || [];
};

// Check if a status is terminal (no further transitions possible)
export const isTerminalStatus = (status: PickupRequestStatus): boolean => {
  return ['completed', 'cancelled', 'rejected'].includes(status);
};

// Get user-friendly status description
export const getStatusDescription = (status: PickupRequestStatus): string => {
  const descriptions: Record<PickupRequestStatus, string> = {
    pending: 'Request created, waiting for recycler selection',
    assigned: 'Recycler selected, waiting for confirmation',
    confirmed: 'Confirmed by customer, waiting for recycler acceptance',
    accepted: 'Accepted by recycler, waiting for pickup start',
    in_progress: 'Pickup in progress',
    completed: 'Pickup completed successfully',
    cancelled: 'Request cancelled',
    rejected: 'Request rejected by recycler'
  };
  
  return descriptions[status] || 'Unknown status';
};

// Get status color for UI
export const getStatusColor = (status: PickupRequestStatus): string => {
  const colors: Record<PickupRequestStatus, string> = {
    pending: '#FFA500',      // Orange
    assigned: '#FFA500',     // Orange
    confirmed: '#FFA500',    // Orange
    accepted: '#4CAF50',     // Green
    in_progress: '#2196F3',  // Blue
    completed: '#4CAF50',    // Green
    cancelled: '#F44336',    // Red
    rejected: '#F44336'      // Red
  };
  
  return colors[status] || '#9E9E9E'; // Default gray
};

// Validate and update pickup request status
export const validateAndUpdateStatus = async (
  supabase: any,
  requestId: string,
  newStatus: PickupRequestStatus,
  currentStatus?: PickupRequestStatus
): Promise<{ success: boolean; error?: string }> => {
  try {
    // If current status is provided, validate the transition
    if (currentStatus && !isValidStatusTransition(currentStatus, newStatus)) {
      return {
        success: false,
        error: `Invalid status transition from ${currentStatus} to ${newStatus}`
      };
    }

    // Update the status in database
    const { error } = await supabase
      .from('pickup_requests')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId);

    if (error) {
      return {
        success: false,
        error: error.message
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};
