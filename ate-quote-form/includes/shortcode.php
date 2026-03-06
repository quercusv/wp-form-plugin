<?php
/**
 * Quote Form Shortcode — Single-page form with duplicate detection
 */

add_shortcode( 'ate_quote_form', 'ate_render_quote_form' );

function ate_render_quote_form() {
	ob_start();
	?>
	<div id="ate-quote-form-wrapper" class="ate-quote-form-wrapper">
		<form id="ate-quote-form" class="ate-quote-form">

			<!-- Main Form (single page) -->
			<div class="ate-form-step" id="ate-step-form" data-step="form">
				<h2>Request a Quote</h2>
				<p>Tell us about your project and we'll get back to you with a free estimate.</p>

				<div class="ate-form-row">
					<div class="ate-form-group">
						<label for="ate-fname">First Name *</label>
						<input type="text" id="ate-fname" name="fname" required>
						<span class="ate-error-message" id="ate-fname-error"></span>
					</div>
					<div class="ate-form-group">
						<label for="ate-lname">Last Name *</label>
						<input type="text" id="ate-lname" name="lname" required>
						<span class="ate-error-message" id="ate-lname-error"></span>
					</div>
				</div>

				<div class="ate-form-group">
					<label for="ate-company">Company</label>
					<input type="text" id="ate-company" name="company">
				</div>

				<div class="ate-form-row">
					<div class="ate-form-group">
						<label for="ate-email">Email *</label>
						<input type="email" id="ate-email" name="email" required>
						<span class="ate-error-message" id="ate-email-error"></span>
					</div>
					<div class="ate-form-group">
						<label for="ate-phone">Phone *</label>
						<input type="tel" id="ate-phone" name="phone" placeholder="(555) 555-5555" required>
						<span class="ate-error-message" id="ate-phone-error"></span>
					</div>
				</div>

				<div class="ate-form-row">
					<div class="ate-form-group">
						<label for="ate-mobile">Mobile Phone</label>
						<input type="tel" id="ate-mobile" name="mobilePhone" placeholder="(555) 555-5555">
					</div>
					<div class="ate-form-group">
						<label for="ate-alt-phone">Alt Phone</label>
						<input type="tel" id="ate-alt-phone" name="altPhone" placeholder="(555) 555-5555">
					</div>
				</div>

				<div class="ate-form-row">
					<div class="ate-form-group">
						<label for="ate-address">Street Address *</label>
						<input type="text" id="ate-address" name="address" required>
						<span class="ate-error-message" id="ate-address-error"></span>
					</div>
					<div class="ate-form-group">
						<label for="ate-zip">ZIP Code *</label>
						<input type="text" id="ate-zip" name="zip" maxlength="5" required>
						<span class="ate-error-message" id="ate-zip-error"></span>
					</div>
				</div>

				<div class="ate-form-group">
					<label for="ate-gate-code">Gate Code</label>
					<input type="text" id="ate-gate-code" name="gateCode" placeholder="Enter gate code if applicable">
				</div>

				<h3>What services do you need?</h3>
				<div class="ate-services-grid">
					<label class="ate-service-checkbox">
						<input type="checkbox" name="services" value="pruning">
						<span>Pruning</span>
					</label>
					<label class="ate-service-checkbox">
						<input type="checkbox" name="services" value="removal">
						<span>Removal</span>
					</label>
					<label class="ate-service-checkbox">
						<input type="checkbox" name="services" value="stump removal">
						<span>Stump Removal</span>
					</label>
					<label class="ate-service-checkbox">
						<input type="checkbox" name="services" value="planting">
						<span>Planting</span>
					</label>
					<label class="ate-service-checkbox">
						<input type="checkbox" name="services" value="root services">
						<span>Root Services</span>
					</label>
					<label class="ate-service-checkbox">
						<input type="checkbox" name="services" value="treatment">
						<span>Treatment</span>
					</label>
					<label class="ate-service-checkbox">
						<input type="checkbox" name="services" value="consulting">
						<span>Consulting</span>
					</label>
					<label class="ate-service-checkbox">
						<input type="checkbox" name="services" value="oak wilt">
						<span>Oak Wilt</span>
					</label>
					<label class="ate-service-checkbox">
						<input type="checkbox" name="services" value="construction site">
						<span>Construction Site</span>
					</label>
				</div>

				<div class="ate-form-group">
					<label for="ate-request-notes">Project Details *</label>
					<textarea id="ate-request-notes" name="notes" placeholder="Please describe your project in detail..." rows="5" required></textarea>
					<span class="ate-error-message" id="ate-notes-error"></span>
				</div>

				<button type="submit" class="ate-btn ate-btn-primary" id="ate-submit-btn">
					Submit Request
				</button>
				<span class="ate-loading" id="ate-submit-loading" style="display: none;">
					<span class="ate-spinner"></span> Checking...
				</span>
			</div>

			<!-- Duplicate Detection Interstitial -->
			<div class="ate-form-step" id="ate-step-duplicates" data-step="duplicates" style="display: none;">
				<h2>We may already have your information</h2>
				<p>We found existing accounts that might be yours. Please select your account, or continue as a new customer.</p>

				<div id="ate-dup-matches" class="ate-dup-matches">
					<!-- Populated by JavaScript -->
				</div>

				<div class="ate-form-actions">
					<button type="button" class="ate-btn ate-btn-secondary" id="ate-dup-back">
						&larr; Back to Form
					</button>
					<button type="button" class="ate-btn ate-btn-primary" id="ate-dup-new-customer">
						I'm a New Customer
					</button>
				</div>
				<span class="ate-loading" id="ate-dup-submit-loading" style="display: none;">
					<span class="ate-spinner"></span> Submitting...
				</span>
			</div>

			<!-- Success Message -->
			<div class="ate-form-step ate-success-message" id="ate-success-step" style="display: none;">
				<div class="ate-success-content">
					<h2>Thank you!</h2>
					<p id="ate-success-text"></p>
					<p class="ate-success-contact">
						We'll be in touch shortly. In the meantime, feel free to call us at
						<a href="tel:512-996-9100">(512) 996-9100</a>
					</p>
				</div>
			</div>

		</form>
	</div>
	<?php
	return ob_get_clean();
}
