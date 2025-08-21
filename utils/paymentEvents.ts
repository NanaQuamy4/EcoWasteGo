import eventEmitter from './eventEmitter';

// Payment event types
export interface PaymentData {
  amount: number;
  pickupId?: string;
  collection_id?: string;
  customer_name?: string;
  customer?: string;
  waste_type?: string;
  wasteType?: string;
  weight?: number;
}

export interface PickupData {
  pickupId: string;
  status: string;
  completedAt: Date;
}

// Emit payment received event
export const emitPaymentReceived = (paymentData: PaymentData) => {
  console.log('Emitting payment received event:', paymentData);
  eventEmitter.emit('paymentReceived', paymentData);
};

// Emit pickup completed event
export const emitPickupCompleted = (pickupData: PickupData) => {
  console.log('Emitting pickup completed event:', pickupData);
  eventEmitter.emit('pickupCompleted', pickupData);
};

// Example usage in pickup process:
// When recycler marks payment as received:
/*
import { emitPaymentReceived } from '../utils/paymentEvents';

const handlePaymentReceived = () => {
  const paymentData = {
    amount: 25.50,
    pickupId: 'pickup_123',
    customer_name: 'John Doe',
    waste_type: 'Mixed Waste',
    weight: 8.5
  };
  
  emitPaymentReceived(paymentData);
};
*/

// When pickup is marked as complete:
/*
import { emitPickupCompleted } from '../utils/paymentEvents';

const handlePickupCompleted = () => {
  const pickupData = {
    pickupId: 'pickup_123',
    status: 'completed',
    completedAt: new Date()
  };
  
  emitPickupCompleted(pickupData);
};
*/
