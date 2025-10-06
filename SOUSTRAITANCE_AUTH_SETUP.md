# Soustraitance Client Authentication Setup Guide

## 🎯 Overview
This setup enables soustraitance clients to login with their own credentials and access a restricted view of the application (only Stock and Produits Sous-traitance).

## 📋 Setup Steps

### 1. Run the Database Migration
Execute the setup script to add password fields to the database:

```bash
# Visit this URL in your browser:
https://luccibyey.com.tn/production/api/setup_soustraitance_auth.php
```

This will:
- Add `password` column to `production_soustraitance_clients` table
- Add `is_active` column (default: 1)
- Add `last_login` column
- Set default password `password123` for existing clients

### 2. Test the New Login System

**Regular Users:**
- Login URL: Your app login page
- Credentials: Use existing utilisateurs credentials
- Access: Full system access based on role

**Soustraitance Clients:**
- Login URL: Same login page
- Credentials: Client email + password
- Default Password: `password123` (for existing clients)
- Access: Limited to Stock and Produits Sous-traitance only

### 3. Add New Soustraitance Clients

When creating a new client via `/clients-soustraitance`:
1. Fill in client information (name, email, phone, address, website)
2. **REQUIRED**: Set a password for the client
3. Click "Ajouter" to create

### 4. Edit Existing Clients

When editing a client:
- Leave password field empty to keep existing password
- Enter a new password to update it
- Password will be automatically hashed and secured

## 🔐 Security Features

- ✅ Passwords are hashed using PHP's `password_hash()` with bcrypt
- ✅ Separate authentication tokens for regular users vs soustraitance clients
- ✅ Role-based access control (sous_traitance role)
- ✅ Active status check (`is_active` column)
- ✅ Last login tracking

## 🎨 User Experience

### For Soustraitance Clients:
When a soustraitance client logs in, they see:
- ✅ Dashboard
- ✅ Stock (full access)
- ✅ Produits Sous-traitance (full access)
- ❌ No access to: Productions, Produits, Transactions, etc.

### Sidebar Menu:
The sidebar automatically adapts based on user type, showing only authorized sections.

## 🛠️ API Endpoints

### Authentication APIs (New):
- **POST** `/production/api/auth_login.php` - Unified login for all users
- **POST** `/production/api/auth_verify.php` - Token verification

### Client Management:
- **GET** `/production/api/soustraitance_clients.php` - List all clients
- **GET** `/production/api/soustraitance_clients.php?id={id}` - Get single client
- **POST** `/production/api/soustraitance_clients.php` - Create client (with password)
- **PUT** `/production/api/soustraitance_clients.php` - Update client (optional password)
- **DELETE** `/production/api/soustraitance_clients.php?id={id}` - Delete client

## 📝 Testing Checklist

- [ ] Run setup script successfully
- [ ] Login as regular user (admin/production) - should work normally
- [ ] Create new soustraitance client with password
- [ ] Login as soustraitance client with email + password
- [ ] Verify soustraitance client sees only Stock and Produits Sous-traitance
- [ ] Verify soustraitance client cannot access other sections
- [ ] Edit client password
- [ ] Test login with updated password

## 🚨 Important Notes

1. **Default Password**: All existing clients have password `password123`
   - Clients should change this on first login
   - Consider implementing password change functionality

2. **Email is Username**: Soustraitance clients login using their email address

3. **User Type Detection**: The system automatically detects user type:
   - Regular users: `user_type: 'regular'`
   - Soustraitance clients: `user_type: 'sous_traitance'` with `role: 'sous_traitance'`

4. **Token Format**:
   - Regular: `base64(id:email:timestamp)`
   - Soustraitance: `base64(id:email:sous_traitance:timestamp)`

## 🔄 Future Enhancements

Consider implementing:
- [ ] Password change functionality for clients
- [ ] Password reset via email
- [ ] Password strength requirements
- [ ] Account activation/deactivation UI
- [ ] Login history/audit trail
- [ ] Two-factor authentication

## 📞 Support

If you encounter issues:
1. Check browser console for errors
2. Verify database migration completed successfully
3. Ensure API endpoints are accessible
4. Check user credentials are correct
5. Verify client `is_active` status is 1
