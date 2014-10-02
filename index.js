
//Define App Container
var appContainer = document.getElementById("app-container");


//Define Application Controllers
var ObjectController = require("./code/controllers/objects")
var objectController = new ObjectController()

var ListController = require("./code/controllers/list")
var listController = new ListController(  );

//Define Initialization Models
var Sf1Fields = require("./code/models/sf1fields");

//Define Global Bindings
//This could be route based, but given simplicity...
Sf1Fields.bind("OBJECT_SELECTED", function(objectName){
	removeChilds();
	listController.setupModel(objectName);
	listController.model.runquery();
	appContainer.appendChild(listController.el);
})

Sf1Fields.bind("BACK_SELECTED", function(objectName){
	removeChilds();
	appContainer.appendChild(objectController.el);
})

//Start Loading Data
Sf1Fields.fetch( _3vot.user_profile );

//Render Application Initial State
appContainer.appendChild( objectController.el );


//Helper Function Logic for Container
//Todo make animations here
function removeChilds(){
	while (appContainer.firstChild) {
    appContainer.removeChild(appContainer.firstChild);
	}	
}
