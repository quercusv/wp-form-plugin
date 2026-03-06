var $tabs;
var requestType = 0;
var accountID;
$(document).ready(function(){
	
	$tabs = $('#contentTabs').tabs({
		disabled:[1,2,3],
		hide:{ effect:'slide', duration:500 },
		show:{ effect:'slide', duration:500 }
	});
	$('button, input[type=submit]').button().click(function(event){event.preventDefault();});
	$('#container').css({'visibility':'visible'});
	$('#overlay').hide();
});

function geocodeAddress() {
	var thisAddress = document.getElementById('addressAddress').value +', '+ document.getElementById('addressZip').value;
	var geocoder = new google.maps.Geocoder();
	geocoder.geocode(
		{'address': thisAddress},
		function(results,status){
			if (status == google.maps.GeocoderStatus.OK){
				var coords = results[0].geometry.location;
				$('#addressCoords').attr('value', coords.toUrlValue());
				var addressDetails = results[0].address_components;
				var numDetails = addressDetails.length;
				for (var a = 0; a < numDetails; a++){
					thisDetail = addressDetails[a];
					var numTypes = thisDetail.types.length;
					for(var t = 0; t < numTypes; t++){
						var thisType = thisDetail.types[t];
						if(thisType == "locality"){ $('#addressCity').attr('value', thisDetail.short_name)}
						if(thisType == "administrative_area_level_1"){ $('#addressState').attr('value', thisDetail.short_name)}
						if(thisType == "postal_code"){ $('#addressZip').blur().attr('value', thisDetail.short_name)}
					}
				}
				var map = new google.maps.Map(
					document.getElementById('addressMap'),
					{
						'center': results[0].geometry.location,
						'mapTypeId': google.maps.MapTypeId.ROADMAP,
						'zoom': 17
					}
				);
				var marker = new google.maps.Marker({
					'animation': google.maps.Animation.DROP,
					'clickable': false,
					'map': map,
					'position': results[0].geometry.location,
					'title': 'Your house'
				});
			} else {
				alert("Geocode was not successful for the following reason: " + status);
				$('#addressMap').html('The geocoding request that is necessary to map your address has failed for some reason.  Click continue to move on to the next step.');
			}
		}	
	);
	$('#addressHidden').show('slide');
	$('#geocodeButton span').html('try again');
}

function addressToDetails() {
	// call API to check for existing address
	$.post(
		'https://app.digitalarborist.com/reqFormAPI.cfc?method=addressLookup',
		{
			'address': document.getElementById('addressAddress').value,
			'zip': document.getElementById('addressZip').value,
			'key': window.key
		},
		function(results) {
			results = JSON.parse(results);
			if(results.status == 'ok') {
				if(results.matches.length > 0) {
					var matches = results.matches;
					var numMatches = matches.length;
					var options = '';
					for(var i = 0; i < numMatches; i++) {
						options += '<button onclick="addressMatch('+ matches[i].id +','+ matches[i].address +');" style="cursor:pointer;">'+ matches[i].name +'</button><br />';
					}
					$('#existingClientOptions').prepend(options);
					$('#contactForm').hide();
					$('#existingClient').show();
				} else {
					$('#existingClient').hide();
				}
			}
		}
	);
	
	$tabs.tabs('option', 'disabled', [0,2,3]);
	$tabs.tabs('option', 'active', 1);
}

function addressMatch(id,address) {
	if( id ) {
		requestType = 1;
		existingClientRequestId = id;
		existingClientRequestAddress = address;
		$('#fname').hide().prev().hide();
		$('#lname').hide().prev().hide();
		$('#company').hide().prev().hide();
	}	
	$('#existingClient').hide();
	$('#contactForm').show('slide', 500);
}

function detailsToContact() {
	$tabs.tabs('option', 'disabled', [0,1,3]);
	$tabs.tabs('option', 'active', 2);
}

function contactToFinish() {
	// build contactInfo, reqDet, etc...
	var phone = document.getElementById('phone').value.replace(/[^0-9]/g, '');
	if(phone.length == 7) { phone = '512'+phone; }
	var altPhone = document.getElementById('altPhone').value.replace(/[^0-9]/g, '');
	if(altPhone.length == 7) { altPhone = '512'+altPhone; }
	var mobilePhone = document.getElementById('mobilePhone').value.replace(/[^0-9]/g, '');
	if(mobilePhone.length ==7) { mobilePhone = '512'+mobilePhone; }
	var contactInfo = {
		'fname': document.getElementById('fname').value,
		'lname': document.getElementById('lname').value,
		'company': document.getElementById('company').value,
		'phone': phone,
		'altPhone': altPhone,
		'mobilePhone': mobilePhone,
		'email': document.getElementById('email').value,
		'gateCode': 's'+document.getElementById('gateCode').value,
	};
	var services = [];
	$('input[name="serviceOpt"]:checked').each(function(){
		services.push($(this).attr('value'));
	});
	var reqDet = {
		'notes': document.getElementById('notes').value,
		'services': services.join(', ')
	};
	if( requestType == 0 ) {
		// new customer
		var address = [{
			'street': document.getElementById('addressAddress').value,
			'city': document.getElementById('addressCity').value,
			'state': document.getElementById('addressState').value,
			'zip': document.getElementById('addressZip').value,
			'gps': document.getElementById('addressCoords').value
		}];
		$.post(
			'https://app.digitalarborist.com/reqFormAPI.cfc?method=newClientRequest',
			{
				'key': window.key,
				'fname': document.getElementById('fname').value,
				'lname': document.getElementById('lname').value,
				'company': document.getElementById('company').value,
				'addresses': JSON.stringify(address),
				'contactInfo': JSON.stringify(contactInfo),
				'reqDet': JSON.stringify(reqDet)
			},
			function(results) {
				results = JSON.parse(results);
				accountID = results.id;
				parent.postMessage('DA_SubmitSuccess', '*');
			}
		);
	} else {
		// existing customer
		$.post(
			'https://app.digitalarborist.com/reqFormAPI.cfc?method=existingClientRequest',
			{
				'key': window.key,
				'id': existingClientRequestId,
				'address': existingClientRequestAddress,
				'contactInfo': JSON.stringify(contactInfo),
				'reqDet': JSON.stringify(reqDet)
			},
			function(results) {
				results = JSON.parse(results);
				accountID = results.id;				
				parent.postMessage('DA_SubmitSuccess', '*');
			}
		);
	}
	// change tabs
	$tabs.tabs('option', 'disabled', [0,1,2]);
	$tabs.tabs('option', 'active', 3);
}

function goToAccount() {
	$('#overlay').fadeIn();
	$.post(
		'https://app.digitalarborist.com/reqFormAPI.cfc?method=emailToken',
		{
			'id':accountID,
			'email': document.getElementById('email').value,
			'key': window.key
		},
		function(results) {
			results = JSON.parse(results);
			$('#overlay').fadeOut();
			$('<div></div>').html(results.message).dialog({
				title: 'Account Access',
				modal: true,
				buttons: [
					{
						text: "ok",
						click: function() {
								$(this).dialog('close');
							}
					}
				]
			});
		}
	);
}