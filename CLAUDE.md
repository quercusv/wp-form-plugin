# ATE Quote Form - WordPress Plugin

## Project Overview

This is a WordPress plugin for **Austin Tree Experts** (ATE), built by Keith Brown. It provides a smart contact/quote request form for potential clients on the public-facing website. The plugin integrates with the **DigitalArborist** software platform (also created by Keith Brown).

- **Production site**: https://www.AustinTreeExperts.com
- **Test site**: https://test.austintreeexperts.com (current testing phase)
- **DigitalArborist app**: https://app.digitalarborist.com
- **GitHub repo**: https://github.com/quercusv/wp-form-plugin

## Purpose

The form is designed to:
1. Help identify users who are **already ATE clients** via address lookup against the DigitalArborist database
2. Facilitate direct data entry into the DigitalArborist MS SQL database for new clients
3. Detect and prevent **duplicate entries** in the database
4. Collect service request details and contact information

## Architecture

### WordPress Plugin (`ate-quote-form/`)
- **`ate-quote-form.php`** - Main plugin file, defines constants, loads dependencies
- **`includes/class-plugin.php`** - Plugin class: hooks, script/style enqueue, admin menu, AJAX registration
- **`includes/shortcode.php`** - `[ate_quote_form]` shortcode rendering + all AJAX handler functions (address lookup, new client, existing client, email token)
- **`admin/settings.php`** - WP admin settings page for API endpoint and API key
- **`assets/js/quote-form.js`** - Client-side form logic (jQuery), multi-step flow, validation, AJAX calls
- **`assets/css/quote-form.css`** - Form styling, primary color `#2c5530` (dark green), responsive

### Legacy Implementation (`old/`)
- **`request.cfm`** - ColdFusion page with iframe-embedded form (the current live implementation at austintreeexperts.com/online-request.php)
- **`reqFormAPI.cfc`** - ColdFusion API component with all DB operations. This is the **canonical API reference** for understanding the data model and backend logic
- **`request.js`** - Legacy jQuery UI form logic with Google Maps geocoding

### Related Project
- **`/Documents/ftp/digarb-bs`** - The DigitalArborist Bootstrap project. The new form implementation in this plugin will be developed in cooperation with that project.

## API Integration

All API calls go through the ColdFusion endpoint at `app.digitalarborist.com/reqFormAPI.cfc`. Authentication uses a widget key (`f_widget_key` in the `firms` table).

### Endpoints
- **`addressLookup`** (GET) - Searches `users` + `address_details` tables for matching address/zip. Returns `{status, message, matches[{id, address, name}]}`
- **`newClientRequest`** (POST) - Creates user, address, and web_request records. Sends confirmation + notification emails
- **`existingClientRequest`** (POST) - Creates web_request for existing client. Updates email if missing. Sends emails
- **`emailToken`** (POST) - Sends account access token email to client

### Database Tables (MS SQL via ColdFusion datasource "austintreeexperts")
- `firms` - Company records, widget keys, default pay terms
- `users` - Client records (name, contact info, credentials)
- `address_details` - Client addresses, linked to users via `ad_user_fk`
- `web_request` - Service requests (`wr_customer_fk`, `wr_address_fk`, `wr_notes`, `wr_status`)
- `tree_history` - Tree records per address
- `tree_image_links` - Photos linked to trees
- `sales_tax_options` - Tax rates per firm

## Form Flow

1. **Address Lookup** - User enters street address + ZIP code
2. **Match Results** - If address found, shows associated contact names; user selects theirs or "None of these"
3. **New Client Info** - Collects name, company, phones, email, gate code (if no match)
4. **Existing Client Confirm** - Confirms/updates contact info (if match selected)
5. **Service Details** - Multi-select services (Pruning, Removal, Stump Removal, Planting, Root Services, Treatment, Consulting, Oak Wilt, Construction Site) + project notes
6. **Success** - Confirmation message with phone number (512) 996-9100

## Development Notes

- Plugin requires WordPress 5.0+ and PHP 7.4+
- Front-end uses jQuery (WordPress bundled)
- AJAX goes through WordPress `admin-ajax.php` which proxies to the ColdFusion API
- API key is stored in WP options, configured via admin settings page
- The legacy form uses Google Maps geocoding for address validation and city/state extraction - the new plugin does NOT yet have this feature
- Phone numbers: legacy form auto-prepends 512 area code to 7-digit numbers
- Gate codes: legacy API prepends 's' character to gate code values (`'s'+gateCode`)
- Nonce verification is commented out in AJAX handlers - needs to be implemented for security

## Conventions

- PHP: WordPress coding standards (tabs, snake_case functions, prefix with `ate_`)
- JavaScript: jQuery module pattern, `ATE` namespace object
- CSS: BEM-ish naming with `ate-` prefix
- All form IDs prefixed with `ate-`
- Plugin text domain: `ate-quote-form`
