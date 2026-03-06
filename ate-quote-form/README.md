# Austin Tree Experts Quote Form Plugin

A multi-step quote request form that integrates with your ColdFusion API to manage client requests and database entries.

## Features

- **Address Lookup**: Validates addresses against your existing client database
- **Existing Client Recognition**: Displays matching contact names for recognized addresses
- **New Client Onboarding**: Collects full contact information for new clients
- **Service Selection**: Multi-select form for various tree services
- **Project Details**: Free-form text area for detailed project descriptions
- **Database Integration**: Writes directly to your MS SQL database via ColdFusion API
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Email Notifications**: Triggers emails via your existing ColdFusion system

## Installation

1. Upload the `ate-quote-form` folder to `/wp-content/plugins/` on your WordPress install
2. Go to WordPress admin → Plugins and activate "Austin Tree Experts Quote Form"
3. Navigate to "Quote Form" in the admin menu to configure settings

## Configuration

### Settings Page

Go to **Admin Dashboard → Quote Form** to configure:

- **API Endpoint**: The full URL to your `reqFormAPI.cfc` 
  - Default: `https://app.digitalarborist.com/reqFormAPI.cfc`
  - Update if your ColdFusion endpoint URL changes

- **API Key**: Your widget key for authentication
  - Default: `h^qy8a81@3qCi5A8q7FPEpZrTmC9bXfc`
  - This key is required for all API calls

### Using the Form

Add the shortcode to any WordPress page or post:

```
[ate_quote_form]
```

Or use it in a theme template file:

```php
<?php echo do_shortcode( '[ate_quote_form]' ); ?>
```

## How It Works

### Form Flow

1. **Step 1: Address Lookup**
   - User enters street address and ZIP code
   - Form validates against existing addresses in your database

2. **Step 2: Match Results** (if address found)
   - Shows all contact names associated with the address
   - User selects their name or chooses "None of these"

3. **Step 3: Contact Information** (if no match)
   - Collects first name, last name, company, phone numbers, email
   - Gate code field for security access

4. **Step 4: Contact Confirmation** (if existing client)
   - Allows user to update/confirm contact information
   - Validates email address

5. **Step 5: Service Details**
   - Multi-select checkboxes for services offered:
     - Pruning, Removal, Stump Removal, Planting
     - Root Services, Treatment, Consulting
     - Oak Wilt, Construction Site
   - Text area for detailed project description

### API Calls

The plugin makes the following API calls to your ColdFusion endpoint:

#### addressLookup
```
GET /reqFormAPI.cfc?method=addressLookup&address=&zip=&key=&returnformat=json
```
Returns existing addresses and associated contact names.

#### newClientRequest
```
POST /reqFormAPI.cfc?method=newClientRequest&key=&returnformat=json
```
Creates a new user, address, and web request record.

**Parameters:**
- `fname` - First name
- `lname` - Last name
- `company` - Company name
- `addresses` - JSON array of address objects
- `contactInfo` - JSON object with contact details
- `reqDet` - JSON object with request details (services, notes)

#### existingClientRequest
```
POST /reqFormAPI.cfc?method=existingClientRequest&key=&returnformat=json
```
Creates a web request for an existing client.

**Parameters:**
- `id` - User ID
- `address` - Address ID
- `contactInfo` - JSON object with contact details
- `reqDet` - JSON object with request details

## Data Structure

### Contact Info Object
```json
{
  "phone": "(555) 123-4567",
  "mobilePhone": "(555) 123-4567",
  "altPhone": "(555) 123-4567",
  "email": "user@example.com",
  "gateCode": "1234"
}
```

### Address Object
```json
{
  "street": "123 Main St",
  "city": "Austin",
  "state": "TX",
  "zip": "78704",
  "gps": ""
}
```

### Request Details Object
```json
{
  "services": "pruning, removal, planting",
  "notes": "Large oak tree needs pruning and assessment"
}
```

## Customization

### Styling

All styles are in `/assets/css/quote-form.css`. The form uses CSS variables for theming:

- Primary color: `#2c5530` (dark green)
- Secondary color: `#f5f5f5` (light gray)

You can override styles in your theme's CSS.

### Services List

To modify available services, edit the checkboxes in `/includes/shortcode.php` around line 280.

### Form Fields

To add or remove fields, modify:
- `/includes/shortcode.php` - HTML markup
- `/assets/js/quote-form.js` - JavaScript validation and data handling

## Troubleshooting

### Form Submissions Not Working

1. Check that API Endpoint and API Key are configured correctly in settings
2. Verify your ColdFusion server is accessible from your WordPress server
3. Check browser console (F12) for AJAX errors
4. Review WordPress error logs at `/wp-content/debug.log`

### Address Lookup Failing

1. Verify ZIP code format (5 digits)
2. Check that addresses exist in your database
3. Ensure `ad_active_flag = 1` in your address_details table

### Missing Phone Numbers

Phone numbers are optional but recommended. The form will format 10-digit numbers automatically.

## Security Considerations

- All form data is validated server-side before sending to ColdFusion
- The API key should be kept secure in WordPress settings
- Consider using HTTPS for form submissions
- CORS headers should be configured if API is on different domain

## Support

For issues or feature requests, contact your development team.

## Version History

- **1.0.0** - Initial release
