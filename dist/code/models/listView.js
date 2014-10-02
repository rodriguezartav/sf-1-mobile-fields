//List View Model
//Fetchs and Store list of List View 

var _3Model = require("3vot-model/lib/ajaxless")

ListView = _3Model.Model.setup("ListView", ["id","label"]);

ListView.getViews = function(objectName){

		Visualforce.remoting.Manager.invokeAction(
	    'threevot_apps.sfafields.ListViews',
	    objectName,
	    handleResult,
	    { buffer: false, escape: false, timeout: 30000 }
	);

	function handleResult(result, event){
		ListView.destroyAll();
		var parsedResults = JSON.parse(result).views
	 	ListView.refresh(parsedResults);
	 } 

}

module.exports= ListView