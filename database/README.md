# Database Scripts

This folder contains all SQL scripts for the EcoWasteGo project, organized by category.

## Folder Structure

### 📁 `/setup/`
Initial database setup scripts:
- `create_*.sql` - Table creation scripts
- `add_*.sql` - Column addition scripts  
- `setup_*.sql` - Initial setup scripts

### 🔧 `/fixes/`
Bug fixes and corrections:
- `fix_*.sql` - Various bug fix scripts
- `implement_customer_request_validation.sql` - Customer request validation
- `fix_all_issues_comprehensive.sql` - Comprehensive fixes

### 🧪 `/tests/`
Testing and debugging scripts:
- `test_*.sql` - Test scripts for various features
- `debug_*.sql` - Debugging scripts

### 👨‍💼 `/admin/`
Admin-related scripts:
- `*admin*.sql` - Admin panel and management scripts
- `grant_admin_permissions.sql` - Admin permission setup

### 🔔 `/notifications/`
Notification system scripts:
- `*notification*.sql` - Notification-related scripts
- `create_notification_triggers.sql` - Notification triggers

### ⚡ `/triggers/`
Database trigger scripts:
- `*trigger*.sql` - Database trigger creation and fixes

### 🔧 `/functions/`
Database function scripts:
- `*rpc*.sql` - Remote Procedure Call functions
- `*function*.sql` - Database function scripts

## Usage

1. **Setup**: Run scripts in `/setup/` first for initial database setup
2. **Fixes**: Apply relevant fixes from `/fixes/` as needed
3. **Testing**: Use scripts in `/tests/` to verify functionality
4. **Maintenance**: Use admin scripts for ongoing maintenance

## Important Scripts

### Critical Setup (Run First):
- `database/setup/create_pickup_requests_table.sql`
- `database/setup/create_customers_table.sql`
- `database/setup/create_help_messages_table.sql`

### Recent Fixes (Most Important):
- `database/fixes/implement_customer_request_validation.sql`
- `database/fixes/fix_all_issues_comprehensive.sql`
- `database/fixes/fix_database_status_trigger_cascade.sql`

### Testing:
- `database/tests/test_availability_system.sql`
- `database/tests/test_direct_status_update.sql`

## Notes

- Always backup your database before running scripts
- Test scripts in a development environment first
- Some scripts may have dependencies on others
- Check the script comments for specific usage instructions
