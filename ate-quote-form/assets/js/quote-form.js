/**
 * Austin Tree Experts Quote Form
 * Handles multi-step form flow and API integration
 */

(function($) {
	'use strict';

	const ATE = {
		currentStep: 1,
		formData: {
			address: null,
			zip: null,
			matches: [],
			selectedClient: null,
			selectedAddress: null,
			fname: null,
			lname: null,
			company: null,
			contactInfo: {},
			services: [],
			notes: null
		},

		/**
		 * Initialize the form
		 */
		init: function() {
			this.cacheDOM();
			this.bindEvents();
		},

		/**
		 * Cache DOM elements
		 */
		cacheDOM: function() {
			this.$form = $('#ate-quote-form');
			this.$wrapper = $('#ate-quote-form-wrapper');
			this.$addressInput = $('#ate-address');
			this.$zipInput = $('#ate-zip');
			this.$lookupBtn = $('#ate-lookup-btn');
			this.$matchResults = $('#ate-match-results');
		},

		/**
		 * Bind events
		 */
		bindEvents: function() {
			const self = this;

			// Step 1: Address lookup
			$(document).on('click', '#ate-lookup-btn', function(e) {
				e.preventDefault();
				self.handleAddressLookup();
			});

			// Back to address from matches
			$(document).on('click', '#ate-back-to-address', function(e) {
				e.preventDefault();
				self.goToStep(1);
			});

			// No match - go to new client form
			$(document).on('click', '#ate-no-match-btn', function(e) {
				e.preventDefault();
				self.goToStep(3);
			});

			// Back to address from contact info
			$(document).on('click', '#ate-back-to-address-2', function(e) {
				e.preventDefault();
				self.goToStep(1);
			});

			// Continue from new client info
			$(document).on('click', '#ate-continue-to-services', function(e) {
				e.preventDefault();
				if (self.validateNewClientForm()) {
					self.goToStep(5);
				}
			});

			// Back to matches from existing client
			$(document).on('click', '#ate-back-to-matches', function(e) {
				e.preventDefault();
				self.goToStep(2);
			});

			// Continue from existing client
			$(document).on('click', '#ate-continue-from-existing', function(e) {
				e.preventDefault();
				if (self.validateExistingClientForm()) {
					self.goToStep(5);
				}
			});

			// Back to contact from services
			$(document).on('click', '#ate-back-to-contact', function(e) {
				e.preventDefault();
				if (self.formData.selectedClient) {
					self.goToStep(4);
				} else {
					self.goToStep(3);
				}
			});

			// Form submission
			$(document).on('submit', '#ate-quote-form', function(e) {
				e.preventDefault();
				self.handleFormSubmit();
			});

			// Client match selection
			$(document).on('change', 'input[name="client_match"]', function() {
				const matchId = $(this).val();
				const match = self.formData.matches.find(m => m.id == matchId);
				if (match) {
					self.formData.selectedClient = match;
					self.goToStep(4);
				}
			});
		},

		/**
		 * Handle address lookup
		 */
		handleAddressLookup: function() {
			const address = this.$addressInput.val().trim();
			const zip = this.$zipInput.val().trim();

			// Validate
			if (!address || !zip) {
				this.showError('ate-address-error', 'Both address and ZIP code are required.');
				return;
			}

			// Disable button and show loading
			this.$lookupBtn.prop('disabled', true);
			$('#ate-lookup-loading').show();

			const self = this;

			$.ajax({
				url: ateQuoteForm.ajaxUrl,
				type: 'POST',
				data: {
					action: 'ate_address_lookup',
					address: address,
					zip: zip
				},
				success: function(response) {
					if (response.success) {
						self.formData.address = address;
						self.formData.zip = zip;
						self.formData.matches = response.data.matches || [];

						if (self.formData.matches.length > 0) {
							self.displayMatches(self.formData.matches);
							self.goToStep(2);
						} else {
							// No matches, go to new client form
							self.goToStep(3);
						}
					} else {
						self.showError('ate-address-error', response.data?.message || 'Failed to lookup address.');
					}
				},
				error: function() {
					self.showError('ate-address-error', 'An error occurred. Please try again.');
				},
				complete: function() {
					self.$lookupBtn.prop('disabled', false);
					$('#ate-lookup-loading').hide();
				}
			});
		},

		/**
		 * Display address matches
		 */
		displayMatches: function(matches) {
			let html = '<div class="ate-match-list">';
			
			matches.forEach((match, index) => {
				html += `
					<label class="ate-match-option">
						<input type="radio" name="client_match" value="${match.id}">
						<span class="ate-match-name">${match.name}</span>
					</label>
				`;
			});

			html += '</div>';
			this.$matchResults.html(html);
		},

		/**
		 * Validate new client form
		 */
		validateNewClientForm: function() {
			let isValid = true;
			const fname = $('#ate-fname').val().trim();
			const lname = $('#ate-lname').val().trim();
			const email = $('#ate-email').val().trim();
			const phone = $('#ate-phone').val().trim();
			const mobilePhone = $('#ate-mobile').val().trim();
			const altPhone = $('#ate-alt-phone').val().trim();

			// Clear previous errors
			$('.ate-error-message').text('');

			if (!fname) {
				this.showError('ate-fname-error', 'First name is required.');
				isValid = false;
			}

			if (!lname) {
				this.showError('ate-lname-error', 'Last name is required.');
				isValid = false;
			}

			if (!email) {
				this.showError('ate-email-error', 'Email is required.');
				isValid = false;
			} else if (!this.isValidEmail(email)) {
				this.showError('ate-email-error', 'Please enter a valid email address.');
				isValid = false;
			}

			// At least one phone number is recommended but not required
			if (!phone && !mobilePhone && !altPhone) {
				this.showWarning('Please provide at least one phone number.');
			}

			this.formData.fname = fname;
			this.formData.lname = lname;
			this.formData.company = $('#ate-company').val().trim();
			this.formData.contactInfo = {
				phone: this.formatPhoneNumber(phone) || '',
				mobilePhone: this.formatPhoneNumber(mobilePhone) || '',
				altPhone: this.formatPhoneNumber(altPhone) || '',
				email: email,
				gateCode: $('#ate-gate-code').val().trim() || ''
			};

			return isValid;
		},

		/**
		 * Validate existing client form
		 */
		validateExistingClientForm: function() {
			let isValid = true;
			const email = $('#ate-existing-email').val().trim();

			$('.ate-error-message').text('');

			if (email && !this.isValidEmail(email)) {
				this.showError('ate-existing-email-error', 'Please enter a valid email address.');
				isValid = false;
			}

			this.formData.contactInfo = {
				phone: this.formatPhoneNumber($('#ate-existing-phone').val()) || '',
				mobilePhone: this.formatPhoneNumber($('#ate-existing-mobile').val()) || '',
				altPhone: this.formatPhoneNumber($('#ate-existing-alt-phone').val()) || '',
				email: email,
				gateCode: $('#ate-existing-gate-code').val().trim() || ''
			};

			return isValid;
		},

		/**
		 * Handle form submission
		 */
		handleFormSubmit: function() {
			const self = this;
			const notes = $('#ate-request-notes').val().trim();
			const services = [];

			$('input[name="services"]:checked').each(function() {
				services.push($(this).val());
			});

			// Validate
			if (!notes) {
				this.showError('ate-notes-error', 'Project details are required.');
				return;
			}

			if (services.length === 0) {
				alert('Please select at least one service.');
				return;
			}

			this.formData.services = services;
			this.formData.notes = notes;

			// Show loading
			$('#ate-submit-loading').show();
			$('#ate-submit-btn').prop('disabled', true);

			const reqDet = {
				services: services.join(', '),
				notes: notes
			};

			const addresses = [{
				street: this.formData.address,
				city: '', // We'll need to extract this or ask for it
				state: 'TX', // Default to Texas
				zip: this.formData.zip,
				gps: ''
			}];

			if (this.formData.selectedClient) {
				// Existing client request
				$.ajax({
					url: ateQuoteForm.ajaxUrl,
					type: 'POST',
					data: {
						action: 'ate_existing_client_request',
						id: this.formData.selectedClient.id,
						address: this.formData.selectedClient.address,
						contactInfo: JSON.stringify(this.formData.contactInfo),
						reqDet: JSON.stringify(reqDet)
					},
					success: function(response) {
						if (response.success) {
							self.showSuccess('Thank you for your request! We\'ll be in touch soon.');
						} else {
							self.showError('ate-notes-error', response.data?.message || 'Failed to submit request.');
						}
					},
					error: function() {
						self.showError('ate-notes-error', 'An error occurred. Please try again.');
					},
					complete: function() {
						$('#ate-submit-loading').hide();
						$('#ate-submit-btn').prop('disabled', false);
					}
				});
			} else {
				// New client request
				$.ajax({
					url: ateQuoteForm.ajaxUrl,
					type: 'POST',
					data: {
						action: 'ate_new_client_request',
						fname: this.formData.fname,
						lname: this.formData.lname,
						company: this.formData.company,
						addresses: JSON.stringify(addresses),
						contactInfo: JSON.stringify(this.formData.contactInfo),
						reqDet: JSON.stringify(reqDet)
					},
					success: function(response) {
						if (response.success) {
							self.showSuccess('Thank you for your request! We\'ll be in touch soon.');
						} else {
							self.showError('ate-notes-error', response.data?.message || 'Failed to submit request.');
						}
					},
					error: function() {
						self.showError('ate-notes-error', 'An error occurred. Please try again.');
					},
					complete: function() {
						$('#ate-submit-loading').hide();
						$('#ate-submit-btn').prop('disabled', false);
					}
				});
			}
		},

		/**
		 * Go to specific step
		 */
		goToStep: function(stepNum) {
			$('.ate-form-step').hide();
			$('#ate-step-' + stepNum).show();
			this.currentStep = stepNum;

			// Scroll to top of form
			$('html, body').animate({
				scrollTop: this.$wrapper.offset().top - 100
			}, 300);
		},

		/**
		 * Show success message
		 */
		showSuccess: function(message) {
			$('#ate-success-text').text(message);
			$('.ate-form-step').hide();
			$('#ate-success-step').show();

			$('html, body').animate({
				scrollTop: this.$wrapper.offset().top - 100
			}, 300);
		},

		/**
		 * Show error message
		 */
		showError: function(elementId, message) {
			$('#' + elementId).text(message).show();
		},

		/**
		 * Show warning message
		 */
		showWarning: function(message) {
			alert(message);
		},

		/**
		 * Validate email
		 */
		isValidEmail: function(email) {
			const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			return re.test(email);
		},

		/**
		 * Format phone number
		 */
		formatPhoneNumber: function(phone) {
			if (!phone) return '';
			
			// Remove all non-digits
			const cleaned = phone.replace(/\D/g, '');
			
			// Format as (XXX) XXX-XXXX if it's 10 digits
			if (cleaned.length === 10) {
				return cleaned.substring(0, 3) + cleaned.substring(3, 6) + cleaned.substring(6, 10);
			}
			
			// Return as-is if not 10 digits
			return cleaned;
		}
	};

	// Initialize when DOM is ready
	$(document).ready(function() {
		ATE.init();
	});

})(jQuery);
