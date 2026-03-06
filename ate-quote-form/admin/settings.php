<?php
/**
 * Admin Settings Page
 */

/**
 * Render the settings page
 */
function ate_render_settings_page() {
	if ( ! current_user_can( 'manage_options' ) ) {
		wp_die( 'Unauthorized' );
	}
	?>
	<div class="wrap">
		<h1>ATE Quote Form Settings</h1>
		<p>Configure your ColdFusion API credentials and endpoint.</p>

		<form method="post" action="options.php">
			<?php settings_fields( 'ate_quote_form_settings' ); ?>
			<?php do_settings_sections( 'ate_quote_form_settings' ); ?>

			<table class="form-table">
				<tr>
					<th scope="row">
						<label for="ate_quote_form_api_endpoint">API Endpoint</label>
					</th>
					<td>
						<input 
							type="url" 
							id="ate_quote_form_api_endpoint" 
							name="ate_quote_form_api_endpoint"
							value="<?php echo esc_attr( get_option( 'ate_quote_form_api_endpoint', 'https://app.digitalarborist.com/reqFormAPI.cfc' ) ); ?>"
							class="regular-text"
							required
						>
						<p class="description">The URL to your ColdFusion reqFormAPI.cfc component</p>
					</td>
				</tr>
				<tr>
					<th scope="row">
						<label for="ate_quote_form_api_key">API Key</label>
					</th>
					<td>
						<input 
							type="password" 
							id="ate_quote_form_api_key" 
							name="ate_quote_form_api_key"
							value="<?php echo esc_attr( get_option( 'ate_quote_form_api_key', '' ) ); ?>"
							class="regular-text"
							required
						>
						<p class="description">The widget key used to authenticate with your ColdFusion API</p>
					</td>
				</tr>
			</table>

			<?php submit_button(); ?>
		</form>
	</div>
	<?php
}

/**
 * Register the AJAX handlers
 */

function ate_handle_address_lookup() {
	// Verify nonce - we'll add this from JavaScript
	// check_ajax_referer( 'ate_quote_form_nonce', 'nonce' );

	$address = isset( $_POST['address'] ) ? sanitize_text_field( $_POST['address'] ) : '';
	$zip = isset( $_POST['zip'] ) ? sanitize_text_field( $_POST['zip'] ) : '';

	if ( empty( $address ) || empty( $zip ) ) {
		wp_send_json_error( array( 'message' => 'Address and ZIP code are required.' ) );
	}

	// Call the ColdFusion API
	$api_endpoint = get_option( 'ate_quote_form_api_endpoint' );
	$api_key = get_option( 'ate_quote_form_api_key' );

	$url = add_query_arg(
		array(
			'method' => 'addressLookup',
			'address' => $address,
			'zip' => $zip,
			'key' => $api_key,
			'returnformat' => 'json',
		),
		$api_endpoint
	);

	$response = wp_remote_get(
		$url,
		array(
			'timeout' => 10,
			'sslverify' => true,
		)
	);

	if ( is_wp_error( $response ) ) {
		wp_send_json_error( array( 'message' => 'Failed to connect to the API. Please try again.' ) );
	}

	$body = wp_remote_retrieve_body( $response );
	$data = json_decode( $body, true );

	if ( isset( $data['status'] ) && $data['status'] === 'ok' ) {
		wp_send_json_success( $data );
	} else {
		wp_send_json_error( array( 'message' => 'Failed to lookup address.' ) );
	}
}
add_action( 'wp_ajax_nopriv_ate_address_lookup', 'ate_handle_address_lookup' );
add_action( 'wp_ajax_ate_address_lookup', 'ate_handle_address_lookup' );


function ate_handle_new_client_request() {
	$fname = isset( $_POST['fname'] ) ? sanitize_text_field( $_POST['fname'] ) : '';
	$lname = isset( $_POST['lname'] ) ? sanitize_text_field( $_POST['lname'] ) : '';
	$company = isset( $_POST['company'] ) ? sanitize_text_field( $_POST['company'] ) : '';
	$addresses = isset( $_POST['addresses'] ) ? wp_kses_post( $_POST['addresses'] ) : '';
	$contactInfo = isset( $_POST['contactInfo'] ) ? wp_kses_post( $_POST['contactInfo'] ) : '';
	$reqDet = isset( $_POST['reqDet'] ) ? wp_kses_post( $_POST['reqDet'] ) : '';

	if ( empty( $fname ) || empty( $lname ) || empty( $contactInfo ) || empty( $reqDet ) ) {
		wp_send_json_error( array( 'message' => 'Required fields are missing.' ) );
	}

	$api_endpoint = get_option( 'ate_quote_form_api_endpoint' );
	$api_key = get_option( 'ate_quote_form_api_key' );

	$url = add_query_arg(
		array(
			'method' => 'newClientRequest',
			'returnformat' => 'json',
			'key' => $api_key,
		),
		$api_endpoint
	);

	$response = wp_remote_post(
		$url,
		array(
			'method' => 'POST',
			'timeout' => 10,
			'sslverify' => true,
			'body' => array(
				'fname' => $fname,
				'lname' => $lname,
				'company' => $company,
				'addresses' => $addresses,
				'contactInfo' => $contactInfo,
				'reqDet' => $reqDet,
			),
		)
	);

	if ( is_wp_error( $response ) ) {
		wp_send_json_error( array( 'message' => 'Failed to submit request. Please try again.' ) );
	}

	$body = wp_remote_retrieve_body( $response );
	$data = json_decode( $body, true );

	if ( isset( $data['status'] ) && $data['status'] === 'ok' ) {
		wp_send_json_success( $data );
	} else {
		wp_send_json_error( array( 'message' => 'Failed to submit request.' ) );
	}
}
add_action( 'wp_ajax_nopriv_ate_new_client_request', 'ate_handle_new_client_request' );
add_action( 'wp_ajax_ate_new_client_request', 'ate_handle_new_client_request' );


function ate_handle_existing_client_request() {
	$id = isset( $_POST['id'] ) ? intval( $_POST['id'] ) : 0;
	$address = isset( $_POST['address'] ) ? intval( $_POST['address'] ) : 0;
	$contactInfo = isset( $_POST['contactInfo'] ) ? wp_kses_post( $_POST['contactInfo'] ) : '';
	$reqDet = isset( $_POST['reqDet'] ) ? wp_kses_post( $_POST['reqDet'] ) : '';

	if ( empty( $id ) || empty( $address ) || empty( $contactInfo ) || empty( $reqDet ) ) {
		wp_send_json_error( array( 'message' => 'Required fields are missing.' ) );
	}

	$api_endpoint = get_option( 'ate_quote_form_api_endpoint' );
	$api_key = get_option( 'ate_quote_form_api_key' );

	$url = add_query_arg(
		array(
			'method' => 'existingClientRequest',
			'returnformat' => 'json',
			'key' => $api_key,
		),
		$api_endpoint
	);

	$response = wp_remote_post(
		$url,
		array(
			'method' => 'POST',
			'timeout' => 10,
			'sslverify' => true,
			'body' => array(
				'id' => $id,
				'address' => $address,
				'contactInfo' => $contactInfo,
				'reqDet' => $reqDet,
			),
		)
	);

	if ( is_wp_error( $response ) ) {
		wp_send_json_error( array( 'message' => 'Failed to submit request. Please try again.' ) );
	}

	$body = wp_remote_retrieve_body( $response );
	$data = json_decode( $body, true );

	if ( isset( $data['status'] ) && $data['status'] === 'ok' ) {
		wp_send_json_success( $data );
	} else {
		wp_send_json_error( array( 'message' => 'Failed to submit request.' ) );
	}
}
add_action( 'wp_ajax_nopriv_ate_existing_client_request', 'ate_handle_existing_client_request' );
add_action( 'wp_ajax_ate_existing_client_request', 'ate_handle_existing_client_request' );


function ate_handle_email_token() {
	$id = isset( $_POST['id'] ) ? intval( $_POST['id'] ) : 0;
	$email = isset( $_POST['email'] ) ? sanitize_email( $_POST['email'] ) : '';

	if ( empty( $id ) ) {
		wp_send_json_error( array( 'message' => 'User ID is required.' ) );
	}

	$api_endpoint = get_option( 'ate_quote_form_api_endpoint' );
	$api_key = get_option( 'ate_quote_form_api_key' );

	$url = add_query_arg(
		array(
			'method' => 'emailToken',
			'returnformat' => 'json',
			'key' => $api_key,
		),
		$api_endpoint
	);

	$response = wp_remote_post(
		$url,
		array(
			'method' => 'POST',
			'timeout' => 10,
			'sslverify' => true,
			'body' => array(
				'id' => $id,
				'email' => $email,
			),
		)
	);

	if ( is_wp_error( $response ) ) {
		wp_send_json_error( array( 'message' => 'Failed to send email token.' ) );
	}

	$body = wp_remote_retrieve_body( $response );
	$data = json_decode( $body, true );

	if ( isset( $data['status'] ) && $data['status'] === 'ok' ) {
		wp_send_json_success( $data );
	} else {
		wp_send_json_error( array( 'message' => 'Failed to send email token.' ) );
	}
}
add_action( 'wp_ajax_nopriv_ate_email_token', 'ate_handle_email_token' );
add_action( 'wp_ajax_ate_email_token', 'ate_handle_email_token' );
