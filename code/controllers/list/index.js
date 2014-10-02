var domify = require('domify');

//Models
var Sf1Fields = require("../../models/sf1fields");
var ListView = require("../../models/listView");
var DynamicModel = require("../../models/dynamicModel");
var ListViewResults = require("../../models/listViewResults");

//Views
var Layout = require("./views/layout")
var Item = require("./views/item")
var ListViewItem = require("./views/listViewItem")
var Detail = require("./views/detail")
var Loading = require("./views/loading")
var NotFound = require("./views/notfound")

//Constructor
var ItemList = function(){
	var that = this;
	this.models = {}
	this.el = domify( Layout() );
	
	this.defineElements();
	this.defineEventHandlers();
	this.defineModelBindings();
}

//Defines the Elements to be used in controller
ItemList.prototype.defineElements = function(){
	this.txtSearch = this.el.querySelector("#txtSearch");
	this.btnViews = this.el.querySelector("#btnViews");
	this.backBtn= this.el.querySelector(".btn-back")

	this.ul = this.el.querySelector("#itemList");
	this.ulListViews = this.el.querySelector("#viewList");
	this.itemListTitle = this.el.querySelector("#itemListTitle");
	this.predefinedViews = this.el.querySelector("#predefinedViews");
}

//Define all Event Handlers
//Favoring Global Handlers
ItemList.prototype.defineEventHandlers = function(){
	var that = this;
	this.btnViews.onclick = function(e){ that.toggleViews(e); }
	this.ul.onclick = function(e){ that.onItemClick(e); }
	this.ulListViews.onclick = function(e){ that.onListViewClick(e); }
	this.txtSearch.onchange = function(e){ that.onInputSearch(e); }
	this.backBtn.onclick = function(){ Sf1Fields.trigger("BACK_SELECTED"); }
}

//Bind Models to Data Responders
ItemList.prototype.defineModelBindings = function(){
	var that = this;
	ListViewResults.bind("refresh",function(){ that.render( ListViewResults.all() ); })
	ListView.bind("refresh", function(){ that.renderViews(); });
	ListView.bind("refresh", function(){ that.renderViews(); });
}

//Renders Views
// CALLED FROM ListView REFRESH event
ItemList.prototype.renderViews = function(){
	this.ulListViews.innerHTML = ""
	var src = ""
	var views = ListView.all(	);
	for (var i = views.length - 1; i >= 0; i--) {
		var view = views[i];
		src += ListViewItem(view);
	};
	this.ulListViews.innerHTML = src;
}

//Renders Items
// CALLED FROM this.model REFRESH event
ItemList.prototype.render = function(results){
	this.ul.innerHTML = "";
	var items = results || this.model.all();
	var mainField = this.model.getMainField();
	if(items.length == 0 ) return this.ul.innerHTML+= NotFound();

	for (var i = items.length - 1; i >= 0; i--) {
		var item = items[i];
		item.sf1fields_mainField = mainField;
		this.ul.innerHTML+= Item(item);
	};
}


//Global Click Handler for List
ItemList.prototype.onItemClick = function(e){
	var target  = e.target;
	if(target.classList.contains("btn-view-id")) return this.onViewDetailClick(e);

	//Loop DOM until the correct element is found, in case of child items

	while( target.classList.contains("list-item") == false ) target = target.parentNode;
	
	this.renderItem(target);
}

//Global Click Handler Helper for More Detail Click
ItemList.prototype.onViewDetailClick = function(e){
	return sforce.one.navigateToSObject( e.target.dataset.id );
}

//Global Click Handler Helper for Show more Deails
ItemList.prototype.renderItem = function(itemElement){
	var listElement = itemElement.parentNode;
	
	//Check and Toggle
	var detailView = listElement.querySelector(".detail-view") 
	if( detailView ) return listElement.removeChild(detailView);

	//Render Detail View
	var id = itemElement.dataset.id;
	var item = this.model.find(id);
	item.sf1fields_mainField = this.model.getMainField();
	var renderValues = {model: this.model, item: item } ;
	listElement.appendChild( domify( Detail( renderValues ) ) );
}

//Click Handlered for ListView List. The predefined lists
ItemList.prototype.onListViewClick = function(e){
	var target  = e.target;
	var id = e.target.dataset.id;
	this.ul.innerHTML = Loading();
	this.itemListTitle.innerHTML = ListView.find(id).label;
	this.toggleViews(null,true);
	this.model.getRecords( this.objectName, this.fieldNames.join(","), id );
}

//ON Change Handler for Text Input, search.
ItemList.prototype.onInputSearch = function(e){
	this.ul.innerHTML = Loading();
	var target  = e.target;
	this.model.runquery( "name", target.value );
}

//Function and Click Handler for Header Toggle Button to show/hide List Views
ItemList.prototype.toggleViews= function(e, hide){
	if(hide== false){
		this.btnViews.classList.remove("btn-primary")
		this.predefinedViews.style.display = "none";	
	}
	else if( hide == true || e.target.classList.contains("btn-primary") ){
			this.btnViews.classList.remove("btn-primary")
			this.predefinedViews.style.display = "none";
	}
	else{
		this.btnViews.classList.add("btn-primary")
		this.predefinedViews.style.display = "block";
	}
}

//Function used to Load a new Dynamic Model
//It's a constructor in a way that re-shapes the whole UI
ItemList.prototype.setupModel = function(objectName){
	var that = this;

	this.objectName = objectName;
	this.objectFields  = Sf1Fields.getFields(this.objectName);
	this.fieldNames = Sf1Fields.fieldsToNames(this.objectFields);

	ListView.getViews(this.objectName);
	this.itemListTitle.innerHTML = this.objectName;
	this.ul.innerHTML = Loading();
	this.ulListViews.innerHTML = Loading();

	if( this.models[this.objectName] ) return this.model = this.models[this.objectName];

	this.model = new DynamicModel(objectName,this.objectFields, this.fieldNames);

	this.models[this.objectName] = this.model;

	this.model.bind("refresh", function(){ that.render(); });
}

module.exports = ItemList;