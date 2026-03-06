<cfif isdefined("url.key") >
	<cfset key = url.key />
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="utf-8"/>
    <link href="images/favicon.ico" rel="shortcut icon"/>
	<title>Online Request - Digital Arborist </title>
	<link type="text/css" rel="stylesheet" href="jquery-ui-1.9.1.custom.css"></link>
	<style>
		body {width:95%; height:100%;}
		#bodyWrap { width:100%; height:550px; }
		#theForm {  }
			#theForm input, #theForm label { display:inline-block; float:left; width:105px; }
		#container { width:100%; height:100%; visibility:hidden; }
			#contentTabs { height:98%; width:98%; overflow:hidden; }
				#address {}
					#addressForm { float:left; width:175px; }
					#addressMap { float:left; width:268px; height:290px; text-align:center; padding:40px; background-color:gray; }
				#details textarea,#details label, #details input { float:left }
				#contactForm label { display:inline-block; float:left; width:125px; }
				#contactForm input { display:inline-block; float:left; }
		#overlay { width:100%; height:100%; }
		#loading { width:100%; height:auto; padding-top:30%; }
		#loading img { display:block; margin:auto; }
	</style>
</head>
<body>
<div id="bodyWrap">
	
	<!-- main layout -->
	<div id="container">
		<div id="contentTabs">
			<ol id="processTabs">
				<li><a href="#address">address</a></li>
				<li><a href="#details">details</a></li>
				<li><a href="#contactInfo">contact info</a></li>
				<li><a href="#done">done</a></li>
			</ol>
			<div id="address">
				<h2>Let's start with your address.</h2>
<form id="theForm">
				<div id="addressForm">
					<input id="addressCoords" value="" type="hidden" />
					<label for="addressAddress">address:</label><br />
						<input type="text" id="addressAddress" value="" /><br />
					<label for="addressZip">zip code:</label><br />
						<input type="text" id="addressZip" value="" /><br />
					<br />
					<button id="geocodeButton" onclick="geocodeAddress();">continue</button><br /><br />
					<!-- hidden inputs -->
					<div id="addressHidden" class="ui-helper-hidden">
						<label for="addressCity">city:</label><br />
							<input type="text" id="addressCity" value="" /><br />
						<label for="addressState">state:</label><br />
							<input type="text" id="addressState" value="" /><br />
						<br />
						<button onclick="addressToDetails();">continue</button><br />
					</div>
				</div>
				<div id="addressMap">Please enter your address and zip code in the form to the left.  We're going to show a map of your house in this placeholder to confirm location.</div>
			</div>
			<div id="details">
				<h2>Tell us about the service you need.</h2>
				<label for="notes">Notes:</label><br />
				<textarea id="notes" rows="10" cols="30"></textarea>
				<input type="checkbox" value="Pruning" name="serviceOpt" /> Pruning<br />
				<input type="checkbox" value="Removal" name="serviceOpt" /> Removal<br />
				<input type="checkbox" value="Stump Removal" name="serviceOpt" /> Stump Removal<br />
				<input type="checkbox" value="Planting" name="serviceOpt" /> Planting<br />
				<input type="checkbox" value="Root Services" name="serviceOpt" /> Root Services<br />
				<input type="checkbox" value="Treatment" name="serviceOpt" /> Treatment<br />
				<input type="checkbox" value="Consulting" name="serviceOpt" /> Consulting<br />
				<input type="checkbox" value="Oak Wilt" name="serviceOpt" /> Oak Wilt<br />
				<input type="checkbox" value="Construction Site" name="serviceOpt" /> Construction Site<br />
				<br />
				<br />
				<br />
				<button style="clear:both;" onclick="detailsToContact();">continue</button>
			</div>
			<div id="contactInfo">
				<div id="contactForm">
					<h2>Your contact info:</h2>
					<label for="fname">first name:</label>
						<input type="text" id="fname" value="" /><br /><br />
					<label for="lname">last name:</label>
						<input type="text" id="lname" value="" /><br /><br />
					<label for="company">company:</label>
						<input type="text" id="company" value="" /><br /><br />
					<label for="email">email:</label>
						<input type="text" id="email" value="" /><br /><br />
					<label for="mobilePhone">mobile phone:</label>
						<input type="text" id="mobilePhone" value="" /><br /><br />
					<label for="mainPhone">main phone:</label>
						<input type="text" id="phone" value="" /><br /><br />
					<label for="altPhone">alt phone:</label>
						<input type="text" id="altPhone" value="" /><br /><br />
					<label for="gateCode">gate code:</label>
						<input type="text" id="gateCode" value="" />
					<button onclick="contactToFinish();" style="margin-left:20px;">Finish!</button>
				</div>
				<div id="existingClient">
					<h2>It looks like we've been to this house before.</h2>
					<h3>Is this you or someone who helps with your house?</h3>
					<div id="existingClientOptions">
						<button onclick="addressMatch();">No, please set up a new account for me.</button>
					</div>
				</div>
			</div>
</form>
			<div id="done">
				<div id="thankYou">
					<h2>Thank You!</h2>
					<p>
						Your request has been received.  We'll contact you shortly.
					</p>
					<p>
						If you have some photos that would be helpful to us, or if you have some documents (bid specifications, site plans, etc) you can upload them from your account.
						<br />
						<br />
						<button onclick="goToAccount();">go to account</button>
					</p>
				</div>
			</div>
		</div>
	</div>
	<!-- Loading overlay -->
	<div id="overlay" class="ui-widget-overlay">
		<div id="loading"><img src="images/loading-gears.gif" /></div>
		<noscript>
			<div class="ui-state-error" style="border:4px solid red; padding:20px; background-color:white; color:red; font-family:arial; font-size:12px; position:absolute; width:auto; height:auto;">
				<span class="ui-icon ui-icon-alert" style="float:left; padding-right:2px;"></span><span style="font-size:16px; font-weight:bold;">&nbsp;&nbsp;Warning:</span><br />Our website requires javascript to work properly.  Enable javascript and reload the page.
			</div>
		</noscript>
	</div>
	
	<!-- google maps -->
	<script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyABMCY5rqBm16vRZO7DR3L-VkH8hjFBwis&sensor=false"></script>
	<!-- jquery -->
	<script src="//ajax.googleapis.com/ajax/libs/jquery/1.8.3/jquery.min.js"></script>
	<script src="//ajax.googleapis.com/ajax/libs/jqueryui/1.9.2/jquery-ui.min.js"></script>
	<!-- my scripts -->
	<script src="combine/combine.cfm?files=../jsLibs/jquery.ui.touch-punch.min.js,../request.js" ></script>
	<script>
		window.key = '<cfoutput>#key#</cfoutput>';
		console.log(window.key);
	</script>
</div>
</body>
</html>
<cfelse>
	<h1> You don't have access to this page.</h1>
</cfif>