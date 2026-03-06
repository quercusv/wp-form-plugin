<cfcomponent displayname="reqFormAPI">
    <cfparam name="attributes.datasource" default="austintreeexperts">
	<cfif StructKeyExists(FORM,"key") >
		<cfset key = FORM.key />
		<cfquery name="getFirm" datasource="#attributes.datasource#">
			SELECT f_id, f_website
			FROM firms
			WHERE f_widget_key = <cfqueryparam cfsqltype="cf_sql_varchar" value="#key#">
		</cfquery>
		<cfif getFirm.RecordCount EQ 1>
			<cfparam name="attributes.firm" default="#getFirm.f_id#" />
		</cfif>
	</cfif>
	
<!--- ***********************************************************************************************************************
LOOK FOR EXISTING ADDRESS MATCHES IN DB
************************************************************************************************************************ --->	
	<cffunction name="addressLookup" access="remote" returnformat="JSON" output="false" hint="I look for existing address matches.">
		<cfargument name="address" type="string" required="true">
		<cfargument name="zip" type="string" required="true">
		
		<cfif !isDefined("attributes.firm")>
			<cfset result = 'Permission Denied' />
			<cfreturn result />
		</cfif>
		
		<cfquery name="addressMatch" datasource="#attributes.datasource#">
			SELECT u_id, u_fname, u_lname, ad_id
			FROM users
			INNER JOIN address_details
				ON ad_user_fk = u_id
			WHERE ad_address_1 LIKE '%' + <cfqueryparam cfsqltype="cf_sql_varchar" value="#arguments.address#"> + '%'
				AND ad_zip = <cfqueryparam cfsqltype="cf_sql_varchar" value="#arguments.zip#">
				AND ad_firm_fk = <cfqueryparam cfsqltype="cf_sql_integer" value="#attributes.firm#">
				AND ad_active_flag = <cfqueryparam cfsqltype="cf_sql_integer" value="1">
		</cfquery>
		<cfset result = StructNew() />
		<cfset matches = ArrayNew(1) />
		<cfset match = StructNew() />
		<cfoutput query="addressMatch" group="u_id">
			<cfscript>
				match = StructNew();
				match["id"] = addressMatch.u_id;
				match["address"] = addressMatch.ad_id;
				match["name"] = addressMatch.u_fname &' '& addressMatch.u_lname;
				ArrayAppend(matches,match);
			</cfscript>
		</cfoutput>
		<cfscript>
			result["status"] = 'ok';
			result["message"] = 'Address check executed successfullly.';
			result["matches"] = matches;
			return result;
		</cfscript>
	</cffunction>

<!--- ************************************************************************************************************************
NEW-CLIENT REQUEST fname,lname,company,contactInfo,reqDet
************************************************************************************************************************* --->
	<cffunction name="newClientRequest" access="remote" returnformat="JSON" output="false" hint="I save new client profiles.">
		<cfargument name="fname" type="string" required="true">
		<cfargument name="lname" type="string" required="true">
		<cfargument name="company" type="string" required="true">
		<cfargument name="addresses" type="string" required="true">
		<cfargument name="contactInfo" type="string" required="true">
		<cfargument name="reqDet" type="string" required="true">
		<cfscript>
			var result = StructNew();
			var request = DeserializeJSON(arguments.reqDet);
			var c = DeserializeJSON(arguments.contactInfo);
			var a = DeserializeJSON(arguments.addresses);
			var obj = CreateObject('component','remoteAPI');
			var passWord = obj.tempPassword();
			var hashedPassWord = Hash(passWord, "SHA");
			var userName = arguments.fname & Right(c.phone, 4);
			var thisPhone = '(' & Left(c.phone, 3) & ') ' & Mid(c.phone, 4, 3) & '-' & Right(c.phone, 4);
			var thisAltPhone = '(' & Left(c.altPhone, 3) & ') ' & Mid(c.altPhone, 4, 3) & '-' & Right(c.altPhone, 4);
			var thisMobilePhone = '(' & Left(c.mobilePhone, 3) & ') ' & Mid(c.mobilePhone, 4, 3) & '-' & Right(c.mobilePhone, 4);
			var notes = '<b>This is a request from a new client from the online web-form</b><br />' & request.notes & '<br><br>Selected these options: ' & request.services &'<br /><br />';
			if(!isDefined("attributes.firm")) {
				result = 'Permission Denied';
				return result;
			}
			result["status"] = 'ok';
		</cfscript>
		
		<cfquery name="getFirm" datasource="#attributes.datasource#">
			SELECT f_default_job_pay_due AS payTermsDur, f_default_job_pay_terms AS payTerms, st_percent AS salesTax
			FROM firms
			INNER JOIN sales_tax_options
				ON st_firm_fk = <cfqueryparam cfsqltype="cf_sql_integer" value="#attributes.firm#">
			WHERE f_id = <cfqueryparam cfsqltype="cf_sql_integer" value="#attributes.firm#">
			AND st_default = <cfqueryparam cfsqltype="cf_sql_integer" value="1">
		</cfquery>
		
		<cfquery name="addUser" datasource="#attributes.datasource#">
			INSERT INTO users
			(
				u_fname,
				u_lname,
				u_company,
				u_phone,
				u_alt_phone,
				u_mobile_phone,
				u_email,
				u_active_flag,
				u_date_created,
				u_date_modified,
				u_username,
				u_password,
				u_type,
				u_contact_method,
				u_firm_fk,
				u_sales_tax,
				u_pay_terms,
				u_pay_terms_dur
			)
			VALUES
			(
				<cfqueryparam value="#arguments.fname#" CFSQLType="cf_sql_varchar">,
				<cfqueryparam value="#arguments.lname#" CFSQLType="cf_sql_varchar">,
				<cfqueryparam value="#arguments.company#" CFSQLType="cf_sql_varchar">,
				<cfqueryparam value="#thisPhone#" CFSQLType="cf_sql_varchar">,
				<cfqueryparam value="#thisAltPhone#" CFSQLType="cf_sql_varchar">,
				<cfqueryparam value="#thisMobilePhone#" CFSQLType="cf_sql_varchar">,
				<cfqueryparam value="#c.email#" CFSQLType="cf_sql_varchar">,
				<cfqueryparam value="1" CFSQLType="cf_sql_integer">,
				<cfqueryparam value="#createodbcdatetime(now())#" CFSQLType="cf_sql_date">,
				<cfqueryparam value="#createodbcdatetime(now())#" CFSQLType="cf_sql_date">,
				<cfqueryparam value="#userName#" CFSQLType="cf_sql_varchar">,
				<cfqueryparam value="#hashedPassWord#" CFSQLType="cf_sql_varchar">,
				<cfqueryparam value="customer" CFSQLType="cf_sql_varchar">,
				<cfqueryparam value="email" CFSQLType="cf_sql_varchar">,
				<cfqueryparam value="#attributes.firm#" CFSQLType="CF_SQL_INTEGER">,
				<cfqueryparam value="#getFirm.salesTax#" CFSQLType="CF_SQL_INTEGER">,
				<cfqueryparam value="#getFirm.payTerms#" CFSQLType="cf_sql_varchar">,
				<cfqueryparam value="#getFirm.payTermsDur#" CFSQLType="CF_SQL_INTEGER">
			)
			
			SELECT
			SCOPE_IDENTITY()
			AS newUserId
		</cfquery>
		
		<cfquery name="newAddress" datasource="#attributes.datasource#">
			INSERT INTO address_details
			(
				ad_address_1,
				ad_city,
				ad_state,
				ad_zip,
				ad_gps,
				ad_billing_address,
				ad_user_fk,
				ad_date_created,
				ad_active_flag,
				ad_gate_code,
				ad_firm_fk,
				ad_sales_tax,
				ad_pay_terms,
				ad_pay_terms_dur
			)
			VALUES
			(
				<cfqueryparam value="#a[1].street#" CFSQLType="cf_sql_varchar">,
				<cfqueryparam value="#a[1].city#" CFSQLType="cf_sql_varchar">,
				<cfqueryparam value="#a[1].state#" CFSQLType="cf_sql_varchar">,
				<cfqueryparam value="#a[1].zip#" CFSQLType="cf_sql_varchar">,
				<cfqueryparam value="#a[1].gps#" CFSQLType="cf_sql_varchar">,
				<cfqueryparam value="1" CFSQLType="CF_SQL_INTEGER">,
				<cfqueryparam value="#addUser.newUserId#" CFSQLType="CF_SQL_INTEGER">,
				<cfqueryparam value="#createodbcdatetime(now())#" CFSQLType="cf_sql_date">,
				<cfqueryparam value="1" CFSQLType="CF_SQL_INTEGER">,
				<cfqueryparam value="#RemoveChars(c.gateCode,1,1)#" CFSQLType="cf_sql_varchar">,
				<cfqueryparam value="#attributes.firm#" CFSQLType="CF_SQL_INTEGER">,
				<cfqueryparam value="#getFirm.salesTax#" CFSQLType="cf_sql_varchar">,
				<cfqueryparam value="#getFirm.payTerms#" CFSQLType="cf_sql_varchar">,
				<cfqueryparam value="#getFirm.payTermsDur#" CFSQLType="CF_SQL_INTEGER">
			)
			
			SELECT
			SCOPE_IDENTITY()
			AS newAddressId
		</cfquery>
		
		<cfquery name="createRequest" datasource="#attributes.datasource#">
			INSERT INTO web_request
			(
				wr_customer_fk,
				wr_address_fk,
				wr_type,
				wr_notes,
				wr_status,
				wr_date_created,
				wr_firm_fk
			)
			VALUES
			(
				<cfqueryparam cfsqltype="cf_sql_integer" value="#addUser.newUserId#">,
				<cfqueryparam cfsqltype="cf_sql_integer" value="#newAddress.newAddressId#">,
				<cfqueryparam cfsqltype="cf_sql_varchar" value="new request">,
				<cfqueryparam cfsqltype="cf_sql_varchar" value="#notes#">,
				<cfqueryparam cfsqltype="cf_sql_integer" value="0">,
				<cfqueryparam cfsqltype="cf_sql_date" value="#now()#">,
				<cfqueryparam cfsqltype="cf_sql_integer" value="#attributes.firm#">
			)
		</cfquery>
		
		<cfscript>
			obj.emailClientConfirmation(addUser.newUserId);
			obj.emailEmployeeContactNotification(addUser.newUserId, newAddress.newAddressId, notes, 'new request', attributes.firm);
			result["message"] = 'New profile successfully created and request successfully submitted.';
			result["id"] = addUser.newUserId;
			result["address"] = newAddress.newAddressId;
			return result;
		</cfscript>
		
	</cffunction>
	
<!--- ************************************************************************************************************************
REQUEST FROM EXISTING CLIENT
************************************************************************************************************************* --->
	<cffunction name="existingClientRequest" access="remote" returnformat="JSON" output="false" hint="I submit a request from existing clients.">
		<cfargument name="id" type="numeric" required="true">
		<cfargument name="address" type="numeric" required="true">
		<cfargument name="contactInfo" type="string" required="true">
		<cfargument name="reqDet" type="string" required="true">
		<cfscript>
			var result = StructNew();
			var c = DeserializeJSON(arguments.contactInfo);
			var request = DeserializeJSON(arguments.reqDet);
			var notes = '<b>This is a request from an existing client from the online web-form</b><br />' &request.notes & '<br><br>Selected these options: ' & request.services & '<br><br>Submitted this contact info:<br>phone: '& c.phone &'<br>alt phone: '& c.altPhone &'<br>mobile phone: '& c.mobilePhone &'<br>email: '& c.email &'<br />';
			var obj = CreateObject('component','remoteAPI');
			var checkEmail = '';
			if(!isDefined("attributes.firm")) {
				result = 'Permission Denied';
				return result;
			}
			result["status"] = 'ok';
		</cfscript>
		
		<cfquery name="checkEmail" datasource="#attributes.datasource#">
			SELECT u_email
			FROM users
			WHERE u_id = <cfqueryparam cfsqltype="cf_sql_integer" value="#arguments.id#">
		</cfquery>
		<cfscript>
			if(checkEmail.u_email == '') {
				obj.editUser(arguments.id,c.email,'email');
			}
		</cfscript>
		<cfquery name="createRequest" datasource="#attributes.datasource#">
			INSERT INTO web_request
			(
				wr_customer_fk,
				wr_address_fk,
				wr_type,
				wr_notes,
				wr_status,
				wr_date_created,
				wr_firm_fk
			)
			VALUES
			(
				<cfqueryparam cfsqltype="cf_sql_integer" value="#arguments.id#">,
				<cfqueryparam cfsqltype="cf_sql_integer" value="#arguments.address#">,
				<cfqueryparam cfsqltype="cf_sql_varchar" value="new request">,
				<cfqueryparam cfsqltype="cf_sql_varchar" value="#notes#">,
				<cfqueryparam cfsqltype="cf_sql_integer" value="0">,
				<cfqueryparam cfsqltype="cf_sql_date" value="#now()#">,
				<cfqueryparam cfsqltype="cf_sql_integer" value="#attributes.firm#">
			)
		</cfquery>
		
		<cfscript>
			obj.emailClientConfirmation(arguments.id);
			obj.emailEmployeeContactNotification(arguments.id, arguments.address, notes, 'new request', attributes.firm);
			result["message"] = 'New request successfully submitted for existing client.';
			result["id"] = arguments.id;
			result["address"] = arguments.address;
			return result;
		</cfscript>
		
	</cffunction>

<!--- ***************************************************************************************************
EMAIL ACCOUNT ACCESS TOKEN
******************************************************************************************************* --->
	<cffunction name="emailToken" access="remote" returnformat="JSON" output="false" hint="Send an email account access token to the new requestor.">
		<cfargument name="id" type="numeric" required="true">
		<cfargument name="email" type="string" required="true">
		<cfscript>
			var result = StructNew();
			var obj = CreateObject('component','remoteAPI');
			var token = obj.createNewAuthToken(arguments.id);
			var checkEmail = '';
			if(!isDefined("attributes.firm")) {
				result = 'Permission Denied';
				return result;
			}
			result["status"] = 'ok';
			result["message"] = 'Oh no! Something has gone wrong.  We were not able to email you access to your account.  Please contact the office.';
		</cfscript>
		<cfquery name="checkEmail" datasource="#attributes.datasource#">
			SELECT u_email
			FROM users
			WHERE u_id = <cfqueryparam cfsqltype="cf_sql_varchar" value="#arguments.id#">
				AND u_firm_fk = <cfqueryparam cfsqltype="cf_sql_integer" value="#attributes.firm#">
		</cfquery>
		<cfscript>
			if(arguments.email != '' && checkEmail.u_email == arguments.email) {
				// send the email
				obj.emailClientAccessToken(token,arguments.email,attributes.firm);
				result["message"] = 'We have emailed you instructions to access your account.';
			} else if (arguments.email == '' && checkEmail.u_email != '' ) {
				// send the email
				obj.emailClientAccessToken(token,checkEmail.u_email,attributes.firm);
				result["message"] = 'We have emailed you instructions to access your account using the email address we have on file.';
			} else if (arguments.email != '' && checkEmail.u_email != '' && arguments.email != checkEmail.u_email ) {
				// send email to address on file
				obj.emailClientAccessToken(token,checkEmail.u_email,attributes.firm);
				result["message"] = 'We sent an email with instructions to access your account to the address we have on file, however the email you provided did not match what we have on file.  Please check your email to see if you received a message from us about accessing your account.  If not, you need to contact the office to regain access to your account.';
			} else if (arguments.email != '' && checkEmail.u_email == '') {
				// save email to file
				obj.editUser(arguments.id,arguments.email,'email');
				obj.emailClientAccessToken(token,arguments.email,attributes.firm);
				result["message"] = 'We have saved your provided email and sent you an email with instructions to access your account.';
			}
			
			return result;
		</cfscript>
	</cffunction>
<!--- *************************************************************************************************************************
SAVE NEW TREE
************************************************************************************************************************** --->	
	<cffunction name="saveNewTree" access="remote" returnformat="JSON" output="false" hint="I save a new tree to the database.">
		<cfargument name="id" type="numeric" required="true">
		<cfargument name="address" type="numeric" required="true">
		<cfargument name="species" type="string" required="true">
		<cfargument name="gps" type="string" required="true">
		<cfscript>
			var result = StructNew();
			if(!isDefined("attributes.firm")) {
				result = 'Permission Denied';
				return result;
			}
			result["status"] = 'ok';
		</cfscript>
		
		<cfset coordsArray = ListToArray(arguments.gps) />
		<cfset lat = coordsArray[1] />
		<cfset lng = coordsArray[2] />
		<cfset newGPS = lng & ',' & lat />
		<cfquery name="get_ad" datasource="#attributes.datasource#">
			SELECT ad_address_1,MAX(th_number) AS my_num
			FROM address_details 
			LEFT OUTER JOIN tree_history ON th_address_fk = ad_address_1
			WHERE ad_id = <cfqueryparam value="#Val(arguments.address)#" CFSQLType="CF_SQL_INTEGER">
			GROUP BY address_details.ad_address_1
		</cfquery>
		<cfset maxNum = Val(get_ad.my_num) +1 />
		<cfquery name="saveTree" datasource="#attributes.datasource#">
			INSERT INTO tree_history
			(
				th_customer_fk,
				th_date_created,
				th_address_fk,
				th_number,
				th_species,
				th_gps
			)
			VALUES
			(
				<cfqueryparam value="#arguments.id#" CFSQLType="CF_SQL_INTEGER">,
				<cfqueryparam value="#Now()#" CFSQLType="cf_sql_date">,
				<cfqueryparam value="#get_ad.ad_address_1#" CFSQLType="cf_sql_varchar">,
				<cfqueryparam value="#maxNum#" CFSQLType="CF_SQL_INTEGER">,
				<cfqueryparam value="#arguments.species#" CFSQLType="cf_sql_varchar">,
				<cfqueryparam value="#newGPS#" CFSQLType="cf_sql_varchar">
			)
			
			SELECT
			SCOPE_IDENTITY()
			AS newTreeId
		</cfquery>
		
		<cfscript>
			result["name"] = arguments.species;
			result["number"] = maxNum;
			result["id"] = saveTree.newTreeId;
			return result;
		</cfscript>
		
	</cffunction>

<!--- **************************************************************************************************************************
SAVE PHOTOS FOR A TREE
**************************************************************************************************************************** --->	
	<cffunction name="uploadPhotos" access="remote" returnformat="JSON" output="false" hint="I accept photos uploaded by customers.">
		<cfargument name="images" type="struct" required="true">
		<cfscript>
			var result = StructNew();
			if(!isDefined("attributes.firm")) {
				result = 'Permission Denied';
				return result;
			}
			result["status"] = 'ok';
			//arguments.images = DeserializeJSON(arguments.images);
		</cfscript>
		
		<cfset numTils = ArrayLen(arguments.images.photos) />
		<cfloop index="i" from="1" to="#numTils#">
			<cfset randomNumber = RandRange(1,1000,"SHA1PRNG") />
			<cfset species = Replace(" ","_","all") />
			<cfset path = '/var/www/austintreeexperts.com/data/tree_uploads/' />
			<cfset imgShortName = DateFormat(Now(),"dd-mm-yyyy") & '-' & #i# & '-' & randomNumber & '.jpg' />
			<cfset imgFullName = path & imgShortName />
			<cfset thumbName = path & DateFormat(Now(),"dd-mm-yyyy") & '-' & #i# & '-'  & randomNumber & '_sm.jpg' />
			<cfset returnThumb = 'https://www.AustinTreeExperts.com/data/tree_uploads/' & DateFormat(Now(),"dd-mm-yyyy") & '-' & #i# & '-'  & randomNumber & '_sm.jpg' />
			
			<cfset thisImg = ImageReadBase64(arguments.images.photos[i].encImg) />
			<cfset ImageWrite(thisImg,imgFullName) />
			<cfset ImageScaleToFit(thisImg,"90","","bessel") />
			<cfset ImageWrite(thisImg,thumbName) />
			<cfquery name="saveTil" datasource="#attributes.datasource#">
				INSERT INTO tree_image_links
				(
					til_tree_history_fk,
					til_imagepath,
					til_date_created
				)
				VALUES
				(
					<cfqueryparam value="#arguments.images.id#" CFSQLType="CF_SQL_INTEGER">,
					<cfqueryparam value="#imgShortName#" CFSQLType="cf_sql_varchar">,
					<cfqueryparam value="#Now()#" CFSQLType="cf_sql_date">
				)
				
				SELECT 
				SCOPE_IDENTITY()
				AS newTilId
			</cfquery>
						
		</cfloop>
				
		<cfscript>
			return result;
		</cfscript>
	</cffunction>
	
</cfcomponent>
