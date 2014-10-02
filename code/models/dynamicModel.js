//Dynamic Model
//Used to create models *dynamically* , sorry...


var _3Model = require("3vot-model")

//Receives a Name that must match SFDC API, a list of object fields and a list of fields
function DynamicModel(objectName, objectFields, fieldNames){
	var that = this;

	this.objectName = objectName;
	this.objectFields = objectFields;
	this.fieldNames = fieldNames;
	
	//Create Model Dynamically
	this.model = _3Model.Model.setup(this.objectName, this.fieldNames.join(",")  );

	this.model.objectName = objectName;
	this.model.objectFields = objectFields;
	this.model.fieldNames = fieldNames;

	//Function to get records from Apex using View Filter Id
	this.model.getRecords = function(objectName, fields, viewId){
		Visualforce.remoting.Manager.invokeAction(
	    'threevot_apps.sfafields.ListViewRecords',
	    objectName,
	    fields,
	    viewId,
	    handleResult,
	    { buffer: false, escape: false, timeout: 30000 }
		);

		function handleResult(result, event){
			that.model.destroyAll({ajax: false});
			that.model.refresh(result);
	 	} 
	}

	//Helper function switch to run query for lastviewed and for search by name
	this.model.runquery  = function(type, value){
		that.model.destroyAll({ ajax: false});
		if(!type) return that.model.query("select " + that.fieldNames.join(",") + " from " + that.objectName + " order by LastViewedDate limit 10" );
		var where = " where "+ that.model.getMainField() +" LIKE '%25" + value + "%25'"
		that.model.query("select " + that.fieldNames.join(",") + " from " + that.objectName + where );
	}

	//Helper Function to try to figure the Main Label of the Object, when it's not Name
	this.model.getMainField = function(){
		if(that.model.mainField) return that.model.mainField;
		if( that.fieldNames.indexOf("Name") > -1) return that.model.mainField= "Name";
		for (var i = 0; i < that.fieldNames.length; i++) {
			var fieldName = that.fieldNames[i];
			if(fieldName != "id" && fieldName != "Id") return that.model.mainField= fieldName;
		};
		return that.model.mainField= "id";
	}

	return this.model;
}



module.exports= DynamicModel;
