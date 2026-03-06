<?php
/**
 * Main Plugin Class
 */

class ATE_Quote_Form_Plugin {

	/**
	 * Run the plugin
	 */
	public function run() {
		$this->register_hooks();
		$this->register_admin_hooks();
	}

	/**
	 * Register front-end hooks
	 */
	private function register_hooks() {
		// Enqueue scripts and styles
		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_scripts' ) );
		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_styles' ) );

		// AJAX handlers are registered via add_action in admin/settings.php
	}

	/**
	 * Register admin hooks
	 */
	private function register_admin_hooks() {
		add_action( 'admin_menu', array( $this, 'add_admin_menu' ) );
		add_action( 'admin_init', array( $this, 'register_settings' ) );
	}

	/**
	 * Add admin menu
	 */
	public function add_admin_menu() {
		add_menu_page(
			'ATE Quote Form Settings',
			'Quote Form',
			'manage_options',
			'ate-quote-form-settings',
			'ate_render_settings_page',
			'dashicons-wpforms',
			25
		);
	}

	/**
	 * Register plugin settings
	 */
	public function register_settings() {
		register_setting( 'ate_quote_form_settings', 'ate_quote_form_api_key' );
		register_setting( 'ate_quote_form_settings', 'ate_quote_form_api_endpoint' );
	}

	/**
	 * Enqueue front-end scripts
	 */
	public function enqueue_scripts() {
		wp_enqueue_script(
			'ate-quote-form-script',
			ATE_QUOTE_FORM_URL . 'assets/js/quote-form.js',
			array( 'jquery' ),
			ATE_QUOTE_FORM_VERSION,
			true
		);

		// Pass AJAX URL and nonce to JavaScript
		wp_localize_script(
			'ate-quote-form-script',
			'ateQuoteForm',
			array(
				'ajaxUrl' => admin_url( 'admin-ajax.php' ),
				'nonce'   => wp_create_nonce( 'ate_quote_form_nonce' ),
			)
		);
	}

	/**
	 * Enqueue front-end styles
	 */
	public function enqueue_styles() {
		wp_enqueue_style(
			'ate-quote-form-style',
			ATE_QUOTE_FORM_URL . 'assets/css/quote-form.css',
			array(),
			ATE_QUOTE_FORM_VERSION
		);
	}
}
