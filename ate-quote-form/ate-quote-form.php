<?php
/**
 * Plugin Name: Austin Tree Experts Quote Form
 * Plugin URI: https://austintreeexperts.com
 * Description: Multi-step quote request form that integrates with ColdFusion API
 * Version: 2.0.1
 * Author: Austin Tree Experts
 * Author URI: https://austintreeexperts.com
 * Text Domain: ate-quote-form
 * Domain Path: /languages
 * Requires at least: 5.0
 * Requires PHP: 7.4
 */

// Prevent direct access
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// Define plugin constants
define( 'ATE_QUOTE_FORM_VERSION', '2.0.1' );
define( 'ATE_QUOTE_FORM_PATH', plugin_dir_path( __FILE__ ) );
define( 'ATE_QUOTE_FORM_URL', plugin_dir_url( __FILE__ ) );

// Load plugin files
require_once ATE_QUOTE_FORM_PATH . 'includes/class-plugin.php';
require_once ATE_QUOTE_FORM_PATH . 'includes/shortcode.php';
require_once ATE_QUOTE_FORM_PATH . 'admin/settings.php';

// Initialize the plugin
function ate_quote_form_init() {
	$plugin = new ATE_Quote_Form_Plugin();
	$plugin->run();
}
add_action( 'plugins_loaded', 'ate_quote_form_init' );

// Activation hook
register_activation_hook( __FILE__, 'ate_quote_form_activate' );
function ate_quote_form_activate() {
	// Add any activation tasks here
	// e.g., create default settings, add database tables, etc.
}

// Deactivation hook
register_deactivation_hook( __FILE__, 'ate_quote_form_deactivate' );
function ate_quote_form_deactivate() {
	// Add any deactivation cleanup here
}
