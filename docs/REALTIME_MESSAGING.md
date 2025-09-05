# Real-Time Messaging System

This document explains how the real-time messaging system works between customers and recyclers in the EcoWasteGo app.

## Overview

The messaging system enables real-time communication between customers and recyclers during waste pickup sessions. Messages are synchronized instantly across both parties' devices using Supabase real-time subscriptions.

## Architecture

### Database Schema

The messaging system uses the following database components:

1. **`messages` table**: Stores all messages between customers and recyclers
2. **`send_message()` function**: Handles message creation and validation
3. **`get_messages_for_request()` function**: Retrieves messages for a specific request
4. **`mark_messages_read()` function**: Marks messages as read
5. **Real-time triggers**: Notify clients when new messages are inserted

### Key Features

- ✅ **Real-time synchronization**: Messages appear instantly on both devices
- ✅ **Duplicate prevention**: Prevents duplicate messages from appearing
- ✅ **Read status tracking**: Tracks which messages have been read
- ✅ **User validation**: Ensures only authorized users can send/receive messages
- ✅ **Notification system**: Sends push notifications for new messages
- ✅ **Error handling**: Robust error handling and logging

## Implementation Details

### Customer Side (`TextRecyclerScreen.tsx`)

```typescript
// Real-time subscription setup
const channel = supabase
  .channel(`customer-messages-${params.requestId}`)
  .on('postgres_changes', 
    { 
      event: 'INSERT', 
      schema: 'public', 
      table: 'messages',
      filter: `request_id=eq.${params.requestId}`
    }, 
    (payload) => {
      // Process incoming messages from recycler
      // Only show messages not sent by current user
      // Mark messages as read automatically
    }
  )
  .subscribe();
```

### Recycler Side (`RecyclerTextUserScreen.tsx`)

```typescript
// Real-time subscription setup
const channel = supabase
  .channel(`recycler-messages-${params.requestId}`)
  .on('postgres_changes', 
    { 
      event: 'INSERT', 
      schema: 'public', 
      table: 'messages',
      filter: `request_id=eq.${params.requestId}`
    }, 
    (payload) => {
      // Process incoming messages from customer
      // Only show messages not sent by current user
      // Mark messages as read automatically
    }
  )
  .subscribe();
```

## Message Flow

1. **User types message** → Message appears immediately in sender's UI
2. **Message sent to database** → `send_message()` function validates and stores
3. **Database trigger fires** → Real-time notification sent to all subscribers
4. **Recipient receives message** → Message appears in recipient's UI
5. **Message marked as read** → Read status updated automatically

## Security Features

### Row Level Security (RLS)
- Customers can only view messages for their own requests
- Recyclers can only view messages for their assigned requests
- Users can only send messages for requests they're involved in

### Validation
- Sender ID validation ensures users can only send as themselves
- Request ID validation ensures messages are for valid requests
- User type validation ensures proper customer/recycler roles

## Error Handling

The system includes comprehensive error handling:

- **Network errors**: Graceful handling of connection issues
- **Permission errors**: Clear error messages for unauthorized access
- **Duplicate messages**: Prevention of duplicate message display
- **Subscription errors**: Automatic cleanup and reconnection

## Testing

To test the real-time messaging system:

```bash
# Run the test script
node tests/test_realtime_messaging.js
```

The test script will:
1. Set up a real-time subscription
2. Send test messages as both customer and recycler
3. Verify messages are received in real-time
4. Check message retrieval and unread counts
5. Clean up resources

## Troubleshooting

### Common Issues

1. **Messages not appearing**: Check subscription status and network connection
2. **Duplicate messages**: Ensure proper duplicate prevention logic
3. **Permission errors**: Verify user has access to the request
4. **Subscription not working**: Check channel naming and cleanup

### Debug Logging

The system includes extensive logging:
- Subscription setup and status
- Message sending and receiving
- Error conditions
- User actions

## Performance Considerations

- **Channel naming**: Unique channel names prevent conflicts
- **Message filtering**: Database-level filtering reduces unnecessary data transfer
- **Automatic cleanup**: Subscriptions are properly cleaned up on component unmount
- **Duplicate prevention**: Prevents UI performance issues from duplicate messages

## Future Enhancements

Potential improvements for the messaging system:

- **Message encryption**: End-to-end encryption for sensitive communications
- **File attachments**: Support for images and documents
- **Message reactions**: Emoji reactions to messages
- **Typing indicators**: Show when users are typing
- **Message search**: Search through message history
- **Offline support**: Queue messages when offline

## API Reference

### Database Functions

#### `send_message(request_id, sender_id, sender_type, message)`
Sends a new message and returns the message ID.

**Parameters:**
- `request_id`: UUID of the pickup request
- `sender_id`: UUID of the sender
- `sender_type`: 'customer' or 'recycler'
- `message`: Text content of the message

**Returns:** UUID of the created message

#### `get_messages_for_request(request_id, user_id, user_type)`
Retrieves all messages for a specific request.

**Parameters:**
- `request_id`: UUID of the pickup request
- `user_id`: UUID of the requesting user
- `user_type`: 'customer' or 'recycler'

**Returns:** Array of message objects with sender names

#### `mark_messages_read(request_id, user_id, user_type)`
Marks all unread messages as read for a specific user.

**Parameters:**
- `request_id`: UUID of the pickup request
- `user_id`: UUID of the user
- `user_type`: 'customer' or 'recycler'

**Returns:** Number of messages marked as read

#### `get_unread_message_count(request_id, user_id, user_type)`
Gets the count of unread messages for a user.

**Parameters:**
- `request_id`: UUID of the pickup request
- `user_id`: UUID of the user
- `user_type`: 'customer' or 'recycler'

**Returns:** Integer count of unread messages
