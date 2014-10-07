var _3Model = require("3vot-model")

ListView = _3Model.setup("ListView", ["id","label"]);


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
