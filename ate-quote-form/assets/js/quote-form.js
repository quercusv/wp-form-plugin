/**
 * Austin Tree Experts Quote Form
 * Single-page form with duplicate detection interstitial
 */

(function($) {
	'use strict';

	var ATE = {
		formData: null,
		selectedMatch: null,

		init: function() {
			this.bindEvents();
		},

		bindEvents: function() {
			var self = this;

			// Form submission — validate then check duplicates
			$(document).on('submit', '#ate-quote-form', function(e) {
				e.preventDefault();
				self.handleSubmit();
			});

			// Duplicate interstitial: back to form
			$(document).on('click', '#ate-dup-back', function(e) {
				e.preventDefault();
				self.showStep('form');
			});

			// Duplicate interstitial: "I'm a New Customer" — create anyway
			$(document).on('click', '#ate-dup-new-customer', function(e) {
				e.preventDefault();
				$(this).prop('disabled', true);
				$('#ate-dup-submit-loading').show();
				self.submitNewClient();
			});

			// Duplicate interstitial: select existing match — "That's me"
			$(document).on('click', '.ate-dup-select-btn', function(e) {
				e.preventDefault();
				var userId = $(this).attr('data-user-id');
				var addressId = $(this).attr('data-address-id');
				$(this).prop('disabled', true).text('Submitting...');
				$('#ate-dup-submit-loading').show();
				self.submitExistingClient(userId, addressId);
			});
		},

		/**
		 * Main submit handler — validate, collect, check for duplicates
		 */
		handleSubmit: function() {
			if (!this.validateForm()) return;

			this.collectFormData();

			$('#ate-submit-btn').prop('disabled', true);
			$('#ate-submit-loading').show();

			var self = this;
			var profileForDupCheck = {
				fName: this.formData.fname,
				lName: this.formData.lname,
				email: this.formData.contactInfo.email,
				phone: this.formData.contactInfo.phone,
				addresses: [{
					street: this.formData.address,
					zip: this.formData.zip,
					city: ''
				}]
			};

			$.ajax({
				url: ateQuoteForm.ajaxUrl,
				type: 'POST',
				data: {
					action: 'ate_check_duplicates',
					nonce: ateQuoteForm.nonce,
					profile: JSON.stringify(profileForDupCheck)
				},
				success: function(response) {
					if (response.success && response.data.matches && response.data.matches.length > 0) {
						self.showDuplicates(response.data.matches);
					} else {
						// No duplicates — submit directly
						self.submitNewClient();
					}
				},
				error: function() {
					// Graceful degradation: if duplicate check fails, just submit
					self.submitNewClient();
				},
				complete: function() {
					$('#ate-submit-btn').prop('disabled', false);
					$('#ate-submit-loading').hide();
				}
			});
		},

		/**
		 * Validate form fields
		 */
		validateForm: function() {
			var isValid = true;

			// Clear previous errors
			$('.ate-error-message').text('').hide();

			var fname = $('#ate-fname').val().trim();
			var lname = $('#ate-lname').val().trim();
			var email = $('#ate-email').val().trim();
			var phone = $('#ate-phone').val().trim();
			var address = $('#ate-address').val().trim();
			var zip = $('#ate-zip').val().trim();
			var notes = $('#ate-request-notes').val().trim();
			var services = [];
			$('input[name="services"]:checked').each(function() {
				services.push($(this).val());
			});

			if (!fname) { this.showError('ate-fname-error', 'First name is required.'); isValid = false; }
			if (!lname) { this.showError('ate-lname-error', 'Last name is required.'); isValid = false; }
			if (!email) { this.showError('ate-email-error', 'Email is required.'); isValid = false; }
			else if (!this.isValidEmail(email)) { this.showError('ate-email-error', 'Please enter a valid email address.'); isValid = false; }
		if (!address) { this.showError('ate-address-error', 'Street address is required.'); isValid = false; }
			if (!zip) { this.showError('ate-zip-error', 'ZIP code is required.'); isValid = false; }
			if (!notes) { this.showError('ate-notes-error', 'Project details are required.'); isValid = false; }
			if (services.length === 0) { alert('Please select at least one service.'); isValid = false; }

			return isValid;
		},

		/**
		 * Collect all form data into formData object
		 */
		collectFormData: function() {
			var phone = this.digitsOnly($('#ate-phone').val());
			var mobilePhone = this.digitsOnly($('#ate-mobile').val());
			var altPhone = this.digitsOnly($('#ate-alt-phone').val());
			var services = [];
			$('input[name="services"]:checked').each(function() {
				services.push($(this).val());
			});

			this.formData = {
				fname: $('#ate-fname').val().trim(),
				lname: $('#ate-lname').val().trim(),
				company: $('#ate-company').val().trim(),
				address: $('#ate-address').val().trim(),
				zip: $('#ate-zip').val().trim(),
				contactInfo: {
					phone: phone,
					mobilePhone: mobilePhone,
					altPhone: altPhone,
					email: $('#ate-email').val().trim(),
					gateCode: $('#ate-gate-code').val().trim()
				},
				reqDet: {
					services: services.join(', '),
					notes: $('#ate-request-notes').val().trim()
				},
				addresses: [{
					street: $('#ate-address').val().trim(),
					city: '',
					state: 'TX',
					zip: $('#ate-zip').val().trim(),
					gps: ''
				}]
			};
		},

		/**
		 * Show duplicate matches interstitial
		 */
		showDuplicates: function(matches) {
			var html = '';
			for (var i = 0; i < matches.length; i++) {
				var m = matches[i];
				var addrHtml = '';
				if (m.addresses && m.addresses.length) {
					for (var j = 0; j < m.addresses.length; j++) {
						var a = m.addresses[j];
						addrHtml += '<div class="ate-dup-address">' + this.escapeHtml(a.address) + ', ' + this.escapeHtml(a.city) + ' ' + this.escapeHtml(a.state) + ' ' + this.escapeHtml(a.zip) + '</div>';
					}
				}

				var firstAddressId = (m.addresses && m.addresses.length) ? m.addresses[0].addressId : 0;

				html += '<div class="ate-dup-card">' +
					'<div class="ate-dup-card-header">' +
						'<strong>' + this.escapeHtml(m.firstName) + ' ' + this.escapeHtml(m.lastName) + '</strong>' +
					'</div>' +
					'<div class="ate-dup-card-body">' +
						(m.phone ? '<div>' + this.escapeHtml(m.phone) + '</div>' : '') +
						(m.email ? '<div>' + this.escapeHtml(m.email) + '</div>' : '') +
						addrHtml +
						'<div class="ate-dup-reasons">' + this.escapeHtml(m.reasons.join(', ')) + '</div>' +
						'<button type="button" class="ate-btn ate-btn-primary ate-dup-select-btn" data-user-id="' + m.userId + '" data-address-id="' + firstAddressId + '">' +
							"That's Me" +
						'</button>' +
					'</div>' +
				'</div>';
			}

			$('#ate-dup-matches').html(html);
			this.showStep('duplicates');
		},

		/**
		 * Submit as new client
		 */
		submitNewClient: function() {
			var self = this;

			$.ajax({
				url: ateQuoteForm.ajaxUrl,
				type: 'POST',
				data: {
					action: 'ate_new_client_request',
					nonce: ateQuoteForm.nonce,
					fname: this.formData.fname,
					lname: this.formData.lname,
					company: this.formData.company,
					addresses: JSON.stringify(this.formData.addresses),
					contactInfo: JSON.stringify(this.formData.contactInfo),
					reqDet: JSON.stringify(this.formData.reqDet)
				},
				success: function(response) {
					if (response.success) {
						self.showSuccess('Your request has been submitted! We\'ll review your information and get back to you with a quote.');
					} else {
						self.showError('ate-notes-error', response.data && response.data.message ? response.data.message : 'Failed to submit request.');
						self.showStep('form');
					}
				},
				error: function() {
					self.showError('ate-notes-error', 'An error occurred. Please try again.');
					self.showStep('form');
				},
				complete: function() {
					$('#ate-submit-btn').prop('disabled', false);
					$('#ate-submit-loading').hide();
					$('#ate-dup-new-customer').prop('disabled', false);
					$('#ate-dup-submit-loading').hide();
				}
			});
		},

		/**
		 * Submit as existing client
		 */
		submitExistingClient: function(userId, addressId) {
			var self = this;

			$.ajax({
				url: ateQuoteForm.ajaxUrl,
				type: 'POST',
				data: {
					action: 'ate_existing_client_request',
					nonce: ateQuoteForm.nonce,
					id: userId,
					address: addressId,
					contactInfo: JSON.stringify(this.formData.contactInfo),
					reqDet: JSON.stringify(this.formData.reqDet)
				},
				success: function(response) {
					if (response.success) {
						self.showSuccess('Welcome back! Your request has been submitted. We\'ll be in touch soon.');
					} else {
						self.showError('ate-notes-error', response.data && response.data.message ? response.data.message : 'Failed to submit request.');
						self.showStep('form');
					}
				},
				error: function() {
					self.showError('ate-notes-error', 'An error occurred. Please try again.');
					self.showStep('form');
				},
				complete: function() {
					$('#ate-dup-submit-loading').hide();
					$('.ate-dup-select-btn').prop('disabled', false).text("That's Me");
				}
			});
		},

		/**
		 * Show a form step
		 */
		showStep: function(step) {
			$('.ate-form-step').hide();
			$('#ate-step-' + step).show();
			$('html, body').animate({ scrollTop: $('#ate-quote-form-wrapper').offset().top - 100 }, 300);
		},

		/**
		 * Show success message
		 */
		showSuccess: function(message) {
			$('#ate-success-text').text(message);
			$('.ate-form-step').hide();
			$('#ate-success-step').show();
			$('html, body').animate({ scrollTop: $('#ate-quote-form-wrapper').offset().top - 100 }, 300);
		},

		showError: function(elementId, message) {
			$('#' + elementId).text(message).show();
		},

		isValidEmail: function(email) {
			return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
		},

		digitsOnly: function(val) {
			return (val || '').replace(/\D/g, '');
		},

		escapeHtml: function(str) {
			if (!str) return '';
			var div = document.createElement('div');
			div.appendChild(document.createTextNode(str));
			return div.innerHTML;
		}
	};

	$(document).ready(function() {
		ATE.init();
	});

})(jQuery);
