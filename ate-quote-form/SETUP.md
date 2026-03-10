# Quick Start Guide

## Files Included

```
ate-quote-form/
├── ate-quote-form.php           # Main plugin file
├── README.md                      # Full documentation
├── admin/
│   └── settings.php              # Admin settings page and AJAX handlers
├── includes/
│   ├── class-plugin.php          # Main plugin class
│   └── shortcode.php             # Form HTML and shortcode registration
└── assets/
    ├── css/
    │   └── quote-form.css        # Form styling
    └── js/
        └── quote-form.js         # Form logic and AJAX calls
```

## Setup Steps

### 1. Transfer to Live Server

Via SFTP or command line:

```bash
# Navigate to your WordPress plugins directory
cd /path/to/wordpress/wp-content/plugins/

# Copy the entire folder
# Using SFTP, drag and drop the ate-quote-form folder here
# Or via terminal:
scp -r /path/to/ate-quote-form user@your-server:/path/to/wordpress/wp-content/plugins/
```

### 2. Activate Plugin

1. Log in to WordPress admin
2. Go to **Plugins**
3. Find "Austin Tree Experts Quote Form"
4. Click **Activate**

### 3. Configure Settings

1. Go to **Quote Form** (left sidebar in admin)
2. Enter your API settings:
   - **API Endpoint**: `https://app.digitalarborist.com/remoteAPI.cfc`
   - **API Key**: `h^qy8a81@3qCi5A8q7FPEpZrTmC9bXfc`
3. Click **Save Settings**

### 4. Create/Edit Quote Page

1. Go to **Pages** → **Add New** (or edit existing page)
2. Add a title: "Request a Quote"
3. In the content area, add: `[ate_quote_form]`
4. Publish the page
5. Update your navigation menus to link to this page

### 5. Remove Old Forms

Since we're consolidating to one form:
- Remove WPForms quote form from homepage and other pages
- Remove any old contact form shortcodes
- Update any "Get a Quote" buttons to link to the new dedicated page

## Testing

### On Your Local Machine (Before Uploading)

1. Open `/ate-quote-form/README.md` to understand the flow
2. Review `/assets/js/quote-form.js` to see the form logic
3. Check `/includes/shortcode.php` for HTML structure

### On Test Server

1. Navigate to the new quote page
2. Test address lookup:
   - Enter an existing address and ZIP code
   - Should return matching contacts
   - Or go to new client form if no match
3. Test new client flow:
   - Fill out all fields
   - Select services
   - Submit and verify in your database
4. Test existing client flow:
   - Use an address you know exists
   - Select a contact name
   - Update contact info
   - Submit and verify

### Check Browser Console

Press F12 in browser and check:
- **Console** tab for JavaScript errors
- **Network** tab to see AJAX requests to admin-ajax.php
- Watch the requests to ensure they're successful

## Debugging

If something isn't working:

### Enable WordPress Debug Logging

Add to your `wp-config.php`:

```php
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);
define('WP_DEBUG_DISPLAY', false);
```

Then check `/wp-content/debug.log` for errors.

### Check AJAX Responses

In browser console:
```javascript
// Manually test address lookup
jQuery.post(ateQuoteForm.ajaxUrl, {
  action: 'ate_address_lookup',
  address: '123 Main St',
  zip: '78704'
}, function(response) {
  console.log(response);
});
```

### Verify API Connection

Make sure your ColdFusion server:
- Is accessible from WordPress server
- CORS headers are set (if different domain)
- The API key matches exactly (case-sensitive)

## Customization After Launch

### Change Services List

Edit `/includes/shortcode.php` around line 280-310 to modify the checkbox options.

### Change Colors

Edit `/assets/css/quote-form.css` - primary color is `#2c5530`

### Change Required Fields

Edit validation in `/assets/js/quote-form.js` - look for `validateNewClientForm()` function

### Add New Form Fields

1. Add HTML in `/includes/shortcode.php`
2. Add validation in `/assets/js/quote-form.js`
3. Add to data object sent to API

## Performance Notes

- Form loads async with AJAX - no page reload needed
- All validation happens client-side first (fast)
- API calls are relatively quick (typically 1-2 seconds)
- CSS and JS are enqueued only on pages with shortcode

## Mobile Testing

Test on:
- iPhone (Safari)
- Android (Chrome)
- Tablet (landscape and portrait)

The form is fully responsive and works great on all devices.

## Need to Make Changes?

The JavaScript file (`/assets/js/quote-form.js`) has detailed comments explaining each section. The main flow is in the `bindEvents()` function.

When you want to make changes on your MacBook:
1. Pull the files from the server
2. Make edits locally
3. Test in browser
4. Upload back to server

Or you can edit directly in the server if you have SSH access.

---

That's it! Your form is live and ready to collect quotes. 🎉
