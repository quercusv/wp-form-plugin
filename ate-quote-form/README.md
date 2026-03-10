# Austin Tree Experts Quote Form Plugin

A WordPress plugin that provides a smart quote request form with **score-based duplicate detection**, integrating with the DigitalArborist CRM via ColdFusion API.

## Features

- **Duplicate Detection**: Score-based matching against existing clients (phone, email, name, address, SOUNDEX)
- **Duplicate Interstitial**: Shows matching profiles with match reasons; user can claim existing profile or proceed as new
- **New Client Onboarding**: Collects full contact information and creates user + address + web request records
- **Existing Client Requests**: Creates web request linked to existing profile
- **Service Selection**: Multi-select checkboxes for tree services
- **Responsive Design**: Single-page form works on desktop, tablet, and mobile
- **Email Notifications**: Triggers confirmation and staff notification emails
- **Nonce Verification**: All AJAX handlers use WordPress nonce for CSRF protection

## Installation

1. Upload the `ate-quote-form` folder to `/wp-content/plugins/` on your WordPress install
2. Go to WordPress admin → Plugins and activate "Austin Tree Experts Quote Form"
3. Navigate to "Quote Form" in the admin menu to configure settings

## Configuration

### Settings Page

Go to **Admin Dashboard → Quote Form** to configure:

- **API Endpoint**: The URL to your ColdFusion `remoteAPI.cfc`
  - Default: `https://app.digitalarborist.com/remoteAPI.cfc`
- **Widget Key**: Your firm's widget key for authentication (stored in `firms.f_widget_key`)

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

1. **Single-Page Form**
   - User fills out: name, company, email, phone(s), address, ZIP, gate code, services, project details
   - Client-side validation runs on submit

2. **Duplicate Check**
   - Form data is sent to `checkForDuplicates` via `remoteAPI.cfc`
   - Backend runs 6 scoring queries (phone +40, email +40, address +35, last name+ZIP +30, SOUNDEX +20, first name bonus +15)
   - Matches with score >= 40 are returned

3. **Duplicate Interstitial** (if matches found)
   - Yellow-highlighted cards show each match with name, phone, email, addresses, and match reasons
   - User chooses:
     - **"That's Me"** → submits as existing client (`existingClientRequest`)
     - **"I'm a New Customer"** → overrides and creates new profile (`newClientRequest`)
     - **"Back to Form"** → return to edit

4. **No Matches** → proceeds directly to new client creation

5. **Success Page** — confirmation with phone number for follow-up

### API Calls

All calls go through WordPress AJAX (`admin-ajax.php`) which proxies to the ColdFusion backend at `remoteAPI.cfc`.

#### checkForDuplicates
```
POST remoteAPI.cfc?method=checkForDuplicates&returnformat=json
Body: profile (JSON string), widgetKey
```
Returns scored matches with reasons (e.g., "Phone number match", "Email match").

#### newClientRequest
```
POST remoteAPI.cfc?method=newClientRequest&returnformat=json
Body: fname, lname, company, addresses (JSON), contactInfo (JSON), reqDet (JSON), widgetKey
```
Creates new user, address, and web request records. Sends confirmation + notification emails.

#### existingClientRequest
```
POST remoteAPI.cfc?method=existingClientRequest&returnformat=json
Body: id (user ID), address (address ID), contactInfo (JSON), reqDet (JSON), widgetKey
```
Creates web request for an existing client.

#### emailToken
```
POST remoteAPI.cfc?method=emailToken&returnformat=json
Body: id (user ID), email, widgetKey
```
Sends account access token email to client.

## Data Structures

### Profile Object (sent to checkForDuplicates)
```json
{
  "fName": "John",
  "lName": "Smith",
  "email": "john@example.com",
  "phone": "5551234567",
  "addresses": [
    { "street": "123 Main St", "zip": "78704", "city": "Austin" }
  ]
}
```

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

### Request Details Object
```json
{
  "services": "pruning, removal, planting",
  "notes": "Large oak tree needs pruning and assessment"
}
```

## Customization

### Styling

All styles are in `/assets/css/quote-form.css`. Key colors:
- Primary: `#2c5530` (dark green)
- Secondary: `#f5f5f5` (light gray)
- Duplicate cards: `#e0c97f` (warm gold)

### Services List

To modify available services, edit the checkboxes in `/includes/shortcode.php`.

### Form Fields

To add or remove fields, modify:
- `/includes/shortcode.php` — HTML markup
- `/assets/js/quote-form.js` — validation and data handling

## Troubleshooting

### Form Submissions Not Working

1. Check that API Endpoint and Widget Key are configured correctly in settings
2. Verify your ColdFusion server is accessible from your WordPress server
3. Check browser console (F12) for AJAX errors
4. Review WordPress error logs at `/wp-content/debug.log`

### Duplicate Check Not Finding Matches

1. Ensure `checkForDuplicates` method exists in `ProfileAPI.cfc` and is routed via `remoteAPI.cfc`
2. Check that the widget key matches a `f_widget_key` value in the `firms` table
3. Scoring threshold is 40 — a single phone or email match will qualify

## Version History

- **2.0.0** — Rewrite: single-page form with score-based duplicate detection via `remoteAPI.cfc`, nonce verification, XSS protection
- **1.0.0** — Initial release: multi-step address-lookup flow via `reqFormAPI.cfc`
