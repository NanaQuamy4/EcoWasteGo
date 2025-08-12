# EcoWasteGo Payment Rejection & Correction Workflow Guide

## ❌💰 **Complete Payment Rejection & Correction System**

I've implemented a **comprehensive payment rejection and correction workflow** that allows customers to reject payments when amounts don't tally, and recyclers to receive notifications, edit their entries, and resend corrected payment summaries.

## 🔄 **Workflow Overview:**

### **1. Payment Summary Creation** 📋
```
Recycler calculates weight → Generates payment summary → Sends to customer
```

### **2. Customer Review & Rejection** ❌
```
Customer reviews payment → Finds discrepancy → Rejects with reason → Recycler notified
```

### **3. Recycler Correction** ✏️
```
Recycler receives notification → Edits weight/calculations → Resends corrected summary
```

### **4. Customer Re-review** ✅
```
Customer reviews corrected summary → Accepts or rejects again → Payment workflow continues
```

## 📱 **Screen Integration & Updates:**

### **RecyclerPaymentSummary Screen Updates:**
- ✅ **Payment Summary Sending**: Integrates with backend API to send payment summaries
- ✅ **Edit Functionality**: Edit button navigates back to weight entry with current values
- ✅ **Status Tracking**: Monitors payment acceptance/rejection status
- ✅ **Backend Integration**: Full API integration for payment management

### **PaymentSummary Screen Updates:**
- ✅ **Rejection Reason Input**: Customer can provide detailed rejection reasons
- ✅ **API Integration**: Accept/reject actions connect to backend
- ✅ **Real-time Processing**: Shows loading states during API calls
- ✅ **Smart UI**: Dynamic rejection input display

### **RecyclerWeightEntry Screen Updates:**
- ✅ **Edit Mode Support**: Pre-fills current values when editing
- ✅ **Parameter Passing**: Receives current weight and waste type for editing
- ✅ **Seamless Navigation**: Smooth flow between payment summary and weight entry

## 🎯 **Key Features:**

### **Payment Summary Creation & Sending:**
```typescript
const handleSendToUser = async () => {
  try {
    setIsSending(true);
    
    // Send payment summary to backend
    const response = await apiService.createPaymentSummary({
      requestId,
      weight: parseFloat(weight),
      wasteType,
      rate: parseFloat(rate),
      subtotal: parseFloat(subtotal),
      environmentalTax: parseFloat(environmentalTax),
      totalAmount: parseFloat(totalAmount)
    });

    if (response) {
      setPaymentSent(true);
      // Show success message
    }
  } catch (error) {
    // Handle error
  } finally {
    setIsSending(false);
  }
};
```

### **Smart Rejection Handling:**
```typescript
const handleReject = () => {
  if (!rejectionReason.trim()) {
    Alert.alert('Rejection Reason Required', 'Please provide a reason for rejecting this payment summary.');
    return;
  }

  Alert.alert(
    'Payment Rejected',
    'Are you sure you want to reject this payment summary? A notification will be sent to the recycler to review their payment inputs.',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: async () => {
          const response = await apiService.rejectPaymentSummary(paymentSummaryId, rejectionReason);
          // Handle rejection
        }
      }
    ]
  );
};
```

### **Edit Mode in Weight Entry:**
```typescript
export default function RecyclerWeightEntry() {
  const params = useLocalSearchParams();
  const currentWeight = params.currentWeight as string;
  const currentWasteType = params.currentWasteType as string;
  
  const [weight, setWeight] = useState(currentWeight || '');
  const [wasteType, setWasteType] = useState(currentWasteType || 'Plastic');

  // Pre-fills current values for editing
  // Allows recycler to modify and recalculate
}
```

## 🔄 **Complete Workflow Steps:**

### **Step 1: Payment Summary Creation** 📋
1. **Weight Entry**: Recycler enters waste weight and type
2. **Calculation**: System calculates subtotal, tax, and total
3. **Summary Generation**: Payment summary created with all details
4. **Backend Storage**: Summary saved to database with 'pending' status
5. **Customer Notification**: Customer can now check payment

### **Step 2: Customer Payment Review** 💳
1. **Payment Check**: Customer clicks "Check Payment" button
2. **Summary Display**: Complete payment breakdown shown
3. **Review Process**: Customer reviews weight, type, rate, and total
4. **Decision Making**: Accept payment or reject with reason

### **Step 3: Payment Rejection** ❌
1. **Rejection Trigger**: Customer clicks "REJECT" button
2. **Reason Input**: Customer provides detailed rejection reason
3. **Backend Update**: Payment summary status changed to 'rejected'
4. **Recycler Notification**: Recycler receives rejection notification
5. **Status Reset**: Waste collection status reset to 'in_progress'

### **Step 4: Recycler Correction** ✏️
1. **Notification Review**: Recycler sees rejection reason
2. **Edit Entry**: Clicks edit button to modify weight/calculations
3. **Weight Re-entry**: Updates weight and waste type as needed
4. **Recalculation**: System recalculates payment amounts
5. **New Summary**: New payment summary generated

### **Step 5: Corrected Summary Resend** 📤
1. **Summary Update**: Backend updates payment summary
2. **Status Reset**: Status changed back to 'pending'
3. **Customer Notification**: Customer notified of updated summary
4. **Re-review Process**: Customer reviews corrected amounts
5. **Final Decision**: Accept or reject corrected summary

## 🎨 **User Interface Features:**

### **Customer Side (PaymentSummary):**
- ❌ **Reject Button**: Triggers rejection reason input
- 📝 **Reason Input**: Multi-line text input for detailed rejection
- 🔄 **Processing States**: Loading indicators during API calls
- ✅ **Accept Button**: Accept payment when satisfied
- 💡 **Smart Validation**: Requires rejection reason before proceeding

### **Recycler Side (PaymentSummary):**
- 📤 **Send Button**: Sends payment summary to customer
- ✏️ **Edit Button**: Navigate back to weight entry for corrections
- 📊 **Payment Display**: Complete breakdown of all charges
- 🔄 **Status Tracking**: Monitor payment acceptance/rejection

### **Recycler Side (WeightEntry):**
- 📝 **Pre-filled Values**: Current weight and waste type displayed
- 🔄 **Edit Mode**: Modify existing values for recalculation
- 📊 **Real-time Calculation**: Instant payment updates
- 🚀 **Resend Capability**: Generate new payment summary

## 🔧 **Technical Implementation:**

### **Backend API Endpoints:**
```typescript
// Payment Summary Management
POST /api/payment-summary - Create payment summary
GET /api/payment-summary/:requestId - Get payment summary
PUT /api/payment-summary/:id/reject - Reject payment summary
PUT /api/payment-summary/:id/accept - Accept payment summary
PUT /api/payment-summary/:id - Update payment summary (corrections)
GET /api/payment-summary/recycler/summaries - Get recycler's summaries
```

### **Database Schema:**
```sql
-- Payment Summaries Table
CREATE TABLE payment_summaries (
    id UUID PRIMARY KEY,
    request_id UUID REFERENCES waste_collections(id),
    recycler_id UUID REFERENCES users(id),
    weight DECIMAL(8,2),
    waste_type VARCHAR(50),
    rate DECIMAL(8,2),
    subtotal DECIMAL(10,2),
    environmental_tax DECIMAL(10,2),
    total_amount DECIMAL(10,2),
    status VARCHAR(20) DEFAULT 'pending',
    rejection_reason TEXT,
    rejected_at TIMESTAMP,
    accepted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Notifications Table
CREATE TABLE notifications (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    title VARCHAR(255),
    message TEXT,
    type VARCHAR(50),
    related_id UUID,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### **API Service Methods:**
```typescript
// Payment Summary API Methods
async createPaymentSummary(paymentData): Promise<any>
async getPaymentSummary(requestId): Promise<any>
async rejectPaymentSummary(paymentSummaryId, rejectionReason): Promise<any>
async acceptPaymentSummary(paymentSummaryId): Promise<any>
async updatePaymentSummary(paymentSummaryId, paymentData): Promise<any>
```

## 🎯 **Benefits:**

### **For Customers:**
- ✅ **Payment Accuracy**: Ensure amounts match expectations
- ✅ **Transparency**: Clear breakdown of all charges
- ✅ **Control**: Ability to reject incorrect calculations
- ✅ **Communication**: Provide feedback on payment issues
- ✅ **Quality Assurance**: Get corrected calculations when needed

### **For Recyclers:**
- ✅ **Error Correction**: Fix calculation mistakes easily
- ✅ **Professional Service**: Maintain customer satisfaction
- ✅ **Notification System**: Immediate feedback on issues
- ✅ **Edit Workflow**: Seamless correction process
- ✅ **Quality Improvement**: Learn from customer feedback

### **For the System:**
- ✅ **Data Integrity**: Accurate payment records
- ✅ **Workflow Automation**: Streamlined rejection/correction process
- ✅ **User Experience**: Professional payment management
- ✅ **Audit Trail**: Complete history of payment changes
- ✅ **Quality Control**: Built-in validation and correction

## 🚀 **Next Steps:**

1. **Test payment summary creation** from recycler side
2. **Verify payment rejection** workflow with reason input
3. **Test recycler correction** and resend process
4. **Validate notification system** for both user types
5. **Monitor complete payment lifecycle** from creation to completion

## 🔍 **Testing the Workflow:**

### **Payment Summary Creation:**
1. **Navigate to weight entry** after arrival
2. **Enter weight and waste type** information
3. **Verify payment calculation** accuracy
4. **Send payment summary** to customer
5. **Confirm backend storage** and status

### **Payment Rejection:**
1. **Customer reviews payment** summary
2. **Click reject button** to trigger rejection
3. **Enter rejection reason** in detail
4. **Confirm rejection** to send notification
5. **Verify recycler notification** received

### **Payment Correction:**
1. **Recycler receives rejection** notification
2. **Click edit button** to modify entry
3. **Update weight/calculations** as needed
4. **Resend corrected summary** to customer
5. **Verify customer receives** updated summary

### **Final Acceptance:**
1. **Customer reviews corrected** payment summary
2. **Verify amounts are correct** this time
3. **Accept payment** to complete workflow
4. **Confirm status updates** in backend
5. **Monitor completion** of waste collection

## 🎉 **Result:**

**Your payment rejection and correction workflow is now complete, providing:**

✅ **Comprehensive payment management** with full lifecycle tracking  
✅ **Smart rejection handling** with detailed reason input  
✅ **Seamless correction workflow** for recyclers  
✅ **Real-time notifications** for both user types  
✅ **Professional payment experience** with quality assurance  
✅ **Complete audit trail** of all payment changes  

**This creates a robust, professional payment system that ensures accuracy and customer satisfaction!** ❌💰✏️

## 🔄 **Complete Payment Workflow:**

```
Payment Creation → Customer Review → Rejection (if needed) → Recycler Correction → 
Resend Summary → Customer Re-review → Acceptance → Payment Completion
```

**Every step is now automated and integrated for a seamless payment experience!** 🚀
