# ATE Quote Form - WordPress Plugin

## Project Overview

WordPress plugin for **Austin Tree Experts** (ATE), built by Keith Brown. Provides a smart quote request form with score-based duplicate detection for the public website. Integrates with the **DigitalArborist** CRM platform.

- **Production site**: https://www.AustinTreeExperts.com
- **Test site**: https://test.austintreeexperts.com
- **DigitalArborist app**: https://app.digitalarborist.com
- **API endpoint**: `https://app.digitalarborist.com/remoteAPI.cfc`

## FTP Deployment

### Credentials
- **Host**: `digitalarborist.com`
- **User**: `austintree`
- **Pass**: `Quercu$1077`

### Remote Paths
- **Test site plugin**: `/test.austintreeexperts.com/html/wp-content/plugins/ate-quote-form/`
- **Production site plugin**: `/austintreeexperts.com/html/wp-content/plugins/ate-quote-form/`
- **ColdFusion API** (shared): `/app.digitalarborist.com/html/` (e.g. `api/ProfileAPI.cfc`)

### Upload Command Pattern
```bash
SRC="/Users/keithbrown/Documents/ftp/wp-custom-plugin/ate-quote-form"
DEST="ftp://digitalarborist.com/test.austintreeexperts.com/html/wp-content/plugins/ate-quote-form"
CREDS='austintree:Quercu$1077'
curl -s --ftp-create-dirs -T "$SRC/<file>" "$DEST/<file>" --user "$CREDS"
```

## Architecture

### Plugin Files (`ate-quote-form/`)
- **`ate-quote-form.php`** — Main plugin file, constants, dependency loader
- **`includes/class-plugin.php`** — Plugin class: hooks, script/style enqueue, admin menu, AJAX registration
- **`includes/shortcode.php`** — `[ate_quote_form]` shortcode rendering + form HTML
- **`admin/settings.php`** — WP admin settings page + all AJAX handler functions (duplicate check, new client, existing client, email token)
- **`assets/js/quote-form.js`** — Client-side form logic (jQuery): single-page form, validation, dedup interstitial, AJAX calls
- **`assets/css/quote-form.css`** — Form styling, primary color `#2c5530`, responsive

### Legacy Implementation (`old/`)
- **`request.cfm`** — Old ColdFusion iframe-based form (deprecated)
- **`reqFormAPI.cfc`** — Old standalone API component (deprecated — all calls now go through `remoteAPI.cfc`)
- **`request.js`** — Old jQuery UI form with Google Maps geocoding (deprecated)

### Related Projects
- **`/Users/keithbrown/Documents/ftp/digarb-bs`** — DigitalArborist frontend (Bootstrap/Handlebars SPA)
- **`/Users/keithbrown/Documents/ftp/digarb-api`** — DigitalArborist ColdFusion API backend

## API Integration

All API calls route through `remoteAPI.cfc` → `ProfileAPI.cfc`. Authentication uses a widget key (`f_widget_key` in the `firms` table). The old `reqFormAPI.cfc` endpoint is deprecated.

### AJAX Handlers (in `admin/settings.php`)

| WP AJAX Action | CFC Method | Purpose |
|---|---|---|
| `ate_check_duplicates` | `checkForDuplicates` | Score-based duplicate detection (phone +40, email +40, address +35, name+ZIP +30, SOUNDEX +20, first name +15; threshold >= 40) |
| `ate_new_client_request` | `newClientRequest` | Create new user + address + web request; sends emails |
| `ate_existing_client_request` | `existingClientRequest` | Create web request for existing user |
| `ate_email_token` | `emailToken` | Send account access token email |

All handlers use nonce verification (`ate_quote_form_nonce`).

### Database Tables (MS SQL via ColdFusion datasource "austintreeexperts")
- `firms` — Company records, widget keys, default pay terms
- `users` — Client records (name, contact info, credentials)
- `address_details` — Client addresses, linked to users via `ad_user_fk`
- `web_request` — Service requests (`wr_customer_fk`, `wr_address_fk`, `wr_notes`, `wr_status`)
- `sales_tax_options` — Tax rates per firm

## Form Flow

1. **Single-page form** — name, company, email, phone(s), address, ZIP, gate code, services, project details
2. **Duplicate check** — sends profile JSON to `checkForDuplicates`; backend runs 6 scoring queries
3. **Interstitial** (if matches found) — shows match cards with reasons; user picks "That's Me", "I'm a New Customer", or "Back to Form"
4. **Submission** — either `newClientRequest` (new profile) or `existingClientRequest` (existing profile)
5. **Success page** — confirmation with phone number

## Conventions

- PHP: WordPress coding standards (tabs, snake_case functions, prefix with `ate_`)
- JavaScript: jQuery module pattern, `ATE` namespace object
- CSS: BEM-ish naming with `ate-` prefix
- All form IDs prefixed with `ate-`
- Plugin text domain: `ate-quote-form`
- XSS protection: `escapeHtml()` utility used for user-provided text in duplicate cards

## Development Notes

- Plugin requires WordPress 5.0+ and PHP 7.4+
- Frontend uses jQuery (WordPress bundled)
- AJAX goes through WordPress `admin-ajax.php` which proxies to ColdFusion API
- Widget key is stored in WP options, configured via admin settings page
- Nonce verification is implemented on all AJAX handlers
