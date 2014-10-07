var _3Model = require("3vot-model")
var Ajax = require("3vot-model/lib/3vot-model-vfr");

Sf1Fields = _3Model.setup("threevot_apps__Sf1Fields__c", ["id","Name","threevot_apps__data__c","threevot_apps__profileid__c"]);
Sf1Fields.ajax = Ajax;
Sf1Fields.ajax.namespace = "threevot_apps."



Sf1Fields.fetch = function(profileId){
	Sf1Fields.query("select id, name, profileid__c, data__c from threevot_apps__Sf1Fields__c where profileid__c = '" + profileId + "' or name = 'ORGANIZATION'" );
}

Sf1Fields.prototype.getData = function(){
	return JSON.parse(this.threevot_apps__data__c);
}

Sf1Fields.getObjects = function(){
	var objects = []
	var profile = Sf1Fields.findByAttribute("threevot_apps__profileid__c", _3vot.user_profile );
	if(!profile) profile = Sf1Fields.findByAttribute("Name", "ORGANIZATION" );
	var data = profile.getData();
	objects = 	Object.keys(data);
	
	return objects;
}


Sf1Fields.getFields = function(objectName){
	var fields = [];
	
	var ownProfile = Sf1Fields.findByAttribute("threevot_apps__profileid__c", _3vot.user_profile);
	var orgProfile = Sf1Fields.findByAttribute("Name", "ORGANIZATION");

	 
	var ownProfileFields = ownProfile.getData()[objectName];
	var orgProfileFields = orgProfile.getData()[objectName];

	if(ownProfileFields) fields = fields.concat(ownProfileFields);
	else if(orgProfileFields) fields = fields.concat(orgProfileFields);

	return fields;
	
}

Sf1Fields.fieldsToNames = function(fields){
	var names = [];
	for (var i = 0; i < fields.length; i++) {
		var field = fields[i];
		names.push(field.Name);
	};
	return names;
}

module.exports= Sf1Fields
