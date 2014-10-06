
var appContainer = document.getElementById("app-container");

var Sf1Fields = require("./code/models/sf1fields");

Sf1Fields.fetch( _3vot.user_profile );



var ObjectController = require("./code/controllers/objects")
var objectController = new ObjectController()

var ListController = require("./code/controllers/list")
var listController = new ListController(  );

appContainer.appendChild( objectController.el );

Sf1Fields.bind("OBJECT_SELECTED", function(objectName){
	removeChilds();
	listController.setupModel(objectName);
	listController.query();
	appContainer.appendChild(listController.el);
})

Sf1Fields.bind("BACK_SELECTED", function(objectName){
	removeChilds();
	appContainer.appendChild(objectController.el);
})


function removeChilds(){
	while (appContainer.firstChild) {
    appContainer.removeChild(appContainer.firstChild);
	}	
}
