var _3Model = require("3vot-model")

ListViewResults = _3Model.setup("ListViewResults", ["id","label"]);


ListViewResults.getRecords = function(objectName, fields, viewId){
		Visualforce.remoting.Manager.invokeAction(
	    'threevot_apps.sfafields.ListViewRecords',
	    objectName,
	    fields,
	    viewId,
	    handleResult,
	    { buffer: false, escape: false, timeout: 30000 }
	);

	function handleResult(result, event){
		ListViewResults.destroyAll();
		
	 	//ListView.refresh(parsedResults);
	 } 

}


module.exports= ListViewResults
