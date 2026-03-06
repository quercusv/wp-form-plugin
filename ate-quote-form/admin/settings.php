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
							value="<?php echo esc_attr( get_option( 'ate_quote_form_api_endpoint', 'https://app.digitalarborist.com/remoteAPI.cfc' ) ); ?>"
							class="regular-text"
							required
						>
						<p class="description">The URL to your ColdFusion remoteAPI.cfc component</p>
					</td>
				</tr>
				<tr>
					<th scope="row">
						<label for="ate_quote_form_api_key">Widget Key</label>
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
 * Helper: build API URL with common params
 */
function ate_build_api_url( $method, $extra_params = array() ) {
	$params = array_merge(
		array(
			'method'       => $method,
			'returnformat' => 'json',
		),
		$extra_params
	);
	return add_query_arg( $params, get_option( 'ate_quote_form_api_endpoint' ) );
}

/**
 * Helper: make API POST request
 */
function ate_api_post( $method, $body = array() ) {
	$url = ate_build_api_url( $method );
	$body['widgetKey'] = get_option( 'ate_quote_form_api_key' );

	$response = wp_remote_post(
		$url,
		array(
			'method'    => 'POST',
			'timeout'   => 15,
			'sslverify' => true,
			'body'      => $body,
		)
	);

	if ( is_wp_error( $response ) ) {
		return null;
	}

	return json_decode( wp_remote_retrieve_body( $response ), true );
}

/**
 * AJAX: Check for duplicate profiles
 */
function ate_handle_check_duplicates() {
	check_ajax_referer( 'ate_quote_form_nonce', 'nonce' );
	$profile = isset( $_POST['profile'] ) ? wp_unslash( $_POST['profile'] ) : '';

	if ( empty( $profile ) ) {
		wp_send_json_error( array( 'message' => 'Profile data is required.' ) );
	}

	$url = ate_build_api_url( 'checkForDuplicates' );

	$response = wp_remote_post(
		$url,
		array(
			'method'    => 'POST',
			'timeout'   => 15,
			'sslverify' => true,
			'body'      => array(
				'profile'   => $profile,
				'widgetKey' => get_option( 'ate_quote_form_api_key' ),
			),
		)
	);

	if ( is_wp_error( $response ) ) {
		wp_send_json_error( array( 'message' => 'Failed to check for duplicates.' ) );
	}

	$data = json_decode( wp_remote_retrieve_body( $response ), true );

	if ( isset( $data['status'] ) && $data['status'] === 'ok' ) {
		wp_send_json_success( $data );
	} else {
		wp_send_json_error( array( 'message' => 'Duplicate check failed.' ) );
	}
}
add_action( 'wp_ajax_nopriv_ate_check_duplicates', 'ate_handle_check_duplicates' );
add_action( 'wp_ajax_ate_check_duplicates', 'ate_handle_check_duplicates' );

/**
 * AJAX: New client request
 */
function ate_handle_new_client_request() {
	check_ajax_referer( 'ate_quote_form_nonce', 'nonce' );
	$fname       = isset( $_POST['fname'] ) ? sanitize_text_field( $_POST['fname'] ) : '';
	$lname       = isset( $_POST['lname'] ) ? sanitize_text_field( $_POST['lname'] ) : '';
	$company     = isset( $_POST['company'] ) ? sanitize_text_field( $_POST['company'] ) : '';
	$addresses   = isset( $_POST['addresses'] ) ? wp_unslash( $_POST['addresses'] ) : '';
	$contactInfo = isset( $_POST['contactInfo'] ) ? wp_unslash( $_POST['contactInfo'] ) : '';
	$reqDet      = isset( $_POST['reqDet'] ) ? wp_unslash( $_POST['reqDet'] ) : '';

	if ( empty( $fname ) || empty( $lname ) || empty( $contactInfo ) || empty( $reqDet ) ) {
		wp_send_json_error( array( 'message' => 'Required fields are missing.' ) );
	}

	$data = ate_api_post( 'newClientRequest', array(
		'fname'       => $fname,
		'lname'       => $lname,
		'company'     => $company,
		'addresses'   => $addresses,
		'contactInfo' => $contactInfo,
		'reqDet'      => $reqDet,
	) );

	if ( $data && isset( $data['status'] ) && $data['status'] === 'ok' ) {
		wp_send_json_success( $data );
	} else {
		wp_send_json_error( array( 'message' => 'Failed to submit request.' ) );
	}
}
add_action( 'wp_ajax_nopriv_ate_new_client_request', 'ate_handle_new_client_request' );
add_action( 'wp_ajax_ate_new_client_request', 'ate_handle_new_client_request' );

/**
 * AJAX: Existing client request
 */
function ate_handle_existing_client_request() {
	check_ajax_referer( 'ate_quote_form_nonce', 'nonce' );
	$id          = isset( $_POST['id'] ) ? intval( $_POST['id'] ) : 0;
	$address     = isset( $_POST['address'] ) ? intval( $_POST['address'] ) : 0;
	$contactInfo = isset( $_POST['contactInfo'] ) ? wp_unslash( $_POST['contactInfo'] ) : '';
	$reqDet      = isset( $_POST['reqDet'] ) ? wp_unslash( $_POST['reqDet'] ) : '';

	if ( empty( $id ) || empty( $address ) || empty( $contactInfo ) || empty( $reqDet ) ) {
		wp_send_json_error( array( 'message' => 'Required fields are missing.' ) );
	}

	$data = ate_api_post( 'existingClientRequest', array(
		'id'          => $id,
		'address'     => $address,
		'contactInfo' => $contactInfo,
		'reqDet'      => $reqDet,
	) );

	if ( $data && isset( $data['status'] ) && $data['status'] === 'ok' ) {
		wp_send_json_success( $data );
	} else {
		wp_send_json_error( array( 'message' => 'Failed to submit request.' ) );
	}
}
add_action( 'wp_ajax_nopriv_ate_existing_client_request', 'ate_handle_existing_client_request' );
add_action( 'wp_ajax_ate_existing_client_request', 'ate_handle_existing_client_request' );

/**
 * AJAX: Email access token
 */
function ate_handle_email_token() {
	check_ajax_referer( 'ate_quote_form_nonce', 'nonce' );
	$id    = isset( $_POST['id'] ) ? intval( $_POST['id'] ) : 0;
	$email = isset( $_POST['email'] ) ? sanitize_email( $_POST['email'] ) : '';

	if ( empty( $id ) ) {
		wp_send_json_error( array( 'message' => 'User ID is required.' ) );
	}

	$data = ate_api_post( 'emailToken', array(
		'id'    => $id,
		'email' => $email,
	) );

	if ( $data && isset( $data['status'] ) && $data['status'] === 'ok' ) {
		wp_send_json_success( $data );
	} else {
		wp_send_json_error( array( 'message' => 'Failed to send email token.' ) );
	}
}
add_action( 'wp_ajax_nopriv_ate_email_token', 'ate_handle_email_token' );
add_action( 'wp_ajax_ate_email_token', 'ate_handle_email_token' );
