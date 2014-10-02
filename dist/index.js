(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
},{"../../models/dynamicModel":11,"../../models/listView":12,"../../models/listViewResults":13,"../../models/sf1fields":14,"./views/detail":2,"./views/item":3,"./views/layout":4,"./views/listViewItem":5,"./views/loading":6,"./views/notfound":7,"domify":35}],2:[function(require,module,exports){
module.exports = function(__obj) {
  if (!__obj) __obj = {};
  var __out = [], __capture = function(callback) {
    var out = __out, result;
    __out = [];
    callback.call(this);
    result = __out.join('');
    __out = out;
    return __safe(result);
  }, __sanitize = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else if (typeof value !== 'undefined' && value != null) {
      return __escape(value);
    } else {
      return '';
    }
  }, __safe, __objSafe = __obj.safe, __escape = __obj.escape;
  __safe = __obj.safe = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else {
      if (!(typeof value !== 'undefined' && value != null)) value = '';
      var result = new String(value);
      result.ecoSafe = true;
      return result;
    }
  };
  if (!__escape) {
    __escape = __obj.escape = function(value) {
      return ('' + value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    };
  }
  (function() {
    (function() {
      var key, _i, _len, _ref;
    
      __out.push('<div class="detail-view">\n\t\n\t');
    
      _ref = this.model.fieldNames;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        key = _ref[_i];
        __out.push('\n\t\t');
        if (key !== this.item.sf1fields_mainField) {
          __out.push('\n\t\t<div class="detail-view-item row">\n\t\n\t\t\t\t\t<span class="detail-view-item__title col-xs-4">');
          __out.push(__sanitize(key));
          __out.push('</span>\n\t\t\t\n\t\t\t\t\t');
          if (key.slice(-2) === "Id" && this.item[key] && this.item[key].length === 18) {
            __out.push('\n\t\t\t\t\t\t<span class="detail-view-item__link col-xs-8">\n\t\t\t\t\t\t\t <span class=" btn-view-id" data-id=');
            __out.push(__sanitize(this.item[key]));
            __out.push('>: View ');
            __out.push(__sanitize(key.slice(0, -2)));
            __out.push(' in SF1 </span>\n\t\t\t\t\t\t</span>\n\t\t\t\t\n\t\t\t\t\t');
          } else {
            __out.push('\n\t\t\t\t\t\t<span class="detail-view-item__value col-xs-8">: ');
            __out.push(__sanitize(this.item[key]));
            __out.push('</span>\n\t\t\t\t\t');
          }
          __out.push('\n\t\t\t</div>\n\t\t');
        }
        __out.push('\n\t');
      }
    
      __out.push('\n\n\t<div class="detail-view-buttons">\n\t\t<a class="btn btn-primary btn-sm btn-view-id" data-id=');
    
      __out.push(__sanitize(this.item["id"]));
    
      __out.push('> View in SF1 </a>\n\t</div>\n\n</div>');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
}
},{}],3:[function(require,module,exports){
module.exports = function(__obj) {
  if (!__obj) __obj = {};
  var __out = [], __capture = function(callback) {
    var out = __out, result;
    __out = [];
    callback.call(this);
    result = __out.join('');
    __out = out;
    return __safe(result);
  }, __sanitize = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else if (typeof value !== 'undefined' && value != null) {
      return __escape(value);
    } else {
      return '';
    }
  }, __safe, __objSafe = __obj.safe, __escape = __obj.escape;
  __safe = __obj.safe = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else {
      if (!(typeof value !== 'undefined' && value != null)) value = '';
      var result = new String(value);
      result.ecoSafe = true;
      return result;
    }
  };
  if (!__escape) {
    __escape = __obj.escape = function(value) {
      return ('' + value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    };
  }
  (function() {
    (function() {
      __out.push('<li  class="list-group-item  list-item__single" data-id="');
    
      __out.push(__sanitize(this.id));
    
      __out.push('">\n\t<div data-id="');
    
      __out.push(__sanitize(this.id));
    
      __out.push('" class="list-item list-group-item-title">\n\t\t');
    
      __out.push(__sanitize(this[this.sf1fields_mainField]));
    
      __out.push('\n\t</div>\n</li>');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
}
},{}],4:[function(require,module,exports){
module.exports = function(__obj) {
  if (!__obj) __obj = {};
  var __out = [], __capture = function(callback) {
    var out = __out, result;
    __out = [];
    callback.call(this);
    result = __out.join('');
    __out = out;
    return __safe(result);
  }, __sanitize = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else if (typeof value !== 'undefined' && value != null) {
      return __escape(value);
    } else {
      return '';
    }
  }, __safe, __objSafe = __obj.safe, __escape = __obj.escape;
  __safe = __obj.safe = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else {
      if (!(typeof value !== 'undefined' && value != null)) value = '';
      var result = new String(value);
      result.ecoSafe = true;
      return result;
    }
  };
  if (!__escape) {
    __escape = __obj.escape = function(value) {
      return ('' + value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    };
  }
  (function() {
    (function() {
      __out.push('<div class="sliding-view">\n\n\t<div class="section-header section-header__big row">\n\t\t<a class="btn btn-default btn-back section-btn col-xs-1"><</a>\n\t\t<div class="section-title col-xs-4 section-title__big">SF1 by Clay</div>\n\t\t<div class="form-wrapper col-xs-5">\n\t\t\t<input class="form-control" id="txtSearch" type="text"/>\n\t\t</div>\n\t\t<a class="btn btn-options section-btn btn-default btn-primary col-xs-1 pull-right" id="btnViews">V</a>\n\t</div>\n\n\n\t<div id="predefinedViews">\n\t\t<div class="section-header">\n\t\t\t<div class="section-title">Predefined Views</div>\t\n\t\t</div>\n\t\n\n\t\t<ul id="viewList" class="list-group list-group-simple"></ul>\n\n\t</div>\n\n\t<div class="section-header">\n\t\t<div id="itemListTitle" class="section-title">Recently Viewed</div>\t\n\t</div>\t\t\n\t\n\t<ul id="itemList" class="list-group"></ul>\n\t\n</div>');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
}
},{}],5:[function(require,module,exports){
module.exports = function(__obj) {
  if (!__obj) __obj = {};
  var __out = [], __capture = function(callback) {
    var out = __out, result;
    __out = [];
    callback.call(this);
    result = __out.join('');
    __out = out;
    return __safe(result);
  }, __sanitize = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else if (typeof value !== 'undefined' && value != null) {
      return __escape(value);
    } else {
      return '';
    }
  }, __safe, __objSafe = __obj.safe, __escape = __obj.escape;
  __safe = __obj.safe = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else {
      if (!(typeof value !== 'undefined' && value != null)) value = '';
      var result = new String(value);
      result.ecoSafe = true;
      return result;
    }
  };
  if (!__escape) {
    __escape = __obj.escape = function(value) {
      return ('' + value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    };
  }
  (function() {
    (function() {
      __out.push('<li data-id="');
    
      __out.push(__sanitize(this.id));
    
      __out.push('" class="list-group-item list-view-item" >\n\t');
    
      __out.push(__sanitize(this.label));
    
      __out.push('\n</li>');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
}
},{}],6:[function(require,module,exports){
module.exports = function(__obj) {
  if (!__obj) __obj = {};
  var __out = [], __capture = function(callback) {
    var out = __out, result;
    __out = [];
    callback.call(this);
    result = __out.join('');
    __out = out;
    return __safe(result);
  }, __sanitize = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else if (typeof value !== 'undefined' && value != null) {
      return __escape(value);
    } else {
      return '';
    }
  }, __safe, __objSafe = __obj.safe, __escape = __obj.escape;
  __safe = __obj.safe = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else {
      if (!(typeof value !== 'undefined' && value != null)) value = '';
      var result = new String(value);
      result.ecoSafe = true;
      return result;
    }
  };
  if (!__escape) {
    __escape = __obj.escape = function(value) {
      return ('' + value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    };
  }
  (function() {
    (function() {
      __out.push('<li class="list-group-item ">loading... please wait</li>');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
}
},{}],7:[function(require,module,exports){
module.exports = function(__obj) {
  if (!__obj) __obj = {};
  var __out = [], __capture = function(callback) {
    var out = __out, result;
    __out = [];
    callback.call(this);
    result = __out.join('');
    __out = out;
    return __safe(result);
  }, __sanitize = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else if (typeof value !== 'undefined' && value != null) {
      return __escape(value);
    } else {
      return '';
    }
  }, __safe, __objSafe = __obj.safe, __escape = __obj.escape;
  __safe = __obj.safe = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else {
      if (!(typeof value !== 'undefined' && value != null)) value = '';
      var result = new String(value);
      result.ecoSafe = true;
      return result;
    }
  };
  if (!__escape) {
    __escape = __obj.escape = function(value) {
      return ('' + value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    };
  }
  (function() {
    (function() {
      __out.push('<li class="list-group-item ">sorry, no results found</li>');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
}
},{}],8:[function(require,module,exports){
var domify = require('domify');

//Models
var Sf1Fields = require("../../models/sf1fields");

//Vies
var Layout = require("./view")
var Item = require("./item")

//Constructor
var ObjectList = function(){
	var that = this;
	this.el = domify( Layout() );
	
	this.ul = this.el.querySelector("#list");
	this.ul.onclick = function(e){
		that.onItemClick(e);
	}
	Sf1Fields.bind("refresh", function(){ that.render(); });
}

ObjectList.prototype.render = function(){
	var models = Sf1Fields.getObjects();
	for (var i = models.length - 1; i >= 0; i--) {
		var model = models[i];
		this.ul.innerHTML+= Item(model);
	};
}

ObjectList.prototype.onItemClick = function(e){
	var objectName = e.target.dataset.name;
	Sf1Fields.trigger("OBJECT_SELECTED", objectName);
}

module.exports = ObjectList;


},{"../../models/sf1fields":14,"./item":9,"./view":10,"domify":35}],9:[function(require,module,exports){
module.exports = function(__obj) {
  if (!__obj) __obj = {};
  var __out = [], __capture = function(callback) {
    var out = __out, result;
    __out = [];
    callback.call(this);
    result = __out.join('');
    __out = out;
    return __safe(result);
  }, __sanitize = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else if (typeof value !== 'undefined' && value != null) {
      return __escape(value);
    } else {
      return '';
    }
  }, __safe, __objSafe = __obj.safe, __escape = __obj.escape;
  __safe = __obj.safe = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else {
      if (!(typeof value !== 'undefined' && value != null)) value = '';
      var result = new String(value);
      result.ecoSafe = true;
      return result;
    }
  };
  if (!__escape) {
    __escape = __obj.escape = function(value) {
      return ('' + value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    };
  }
  (function() {
    (function() {
      __out.push('<li class="list-group-item list-group-item-title" data-name="');
    
      __out.push(__sanitize(this));
    
      __out.push('">');
    
      __out.push(__sanitize(this));
    
      __out.push('</li>');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
}
},{}],10:[function(require,module,exports){
module.exports = function(__obj) {
  if (!__obj) __obj = {};
  var __out = [], __capture = function(callback) {
    var out = __out, result;
    __out = [];
    callback.call(this);
    result = __out.join('');
    __out = out;
    return __safe(result);
  }, __sanitize = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else if (typeof value !== 'undefined' && value != null) {
      return __escape(value);
    } else {
      return '';
    }
  }, __safe, __objSafe = __obj.safe, __escape = __obj.escape;
  __safe = __obj.safe = function(value) {
    if (value && value.ecoSafe) {
      return value;
    } else {
      if (!(typeof value !== 'undefined' && value != null)) value = '';
      var result = new String(value);
      result.ecoSafe = true;
      return result;
    }
  };
  if (!__escape) {
    __escape = __obj.escape = function(value) {
      return ('' + value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    };
  }
  (function() {
    (function() {
      __out.push('<div class="sliding-view">\n\n\t<div class="section-header section-header__big">\n\t\t<div class="section-title section-title__big">SF1 Mobile Fields by Clay</div>\n\t\t<a class="btn btn-default section-btn section-btn__right js_btn_info">i</a>\n\t</div>\n\n\t<div class="section-header">\n\t\t<div class="section-title">What do you want to see?</div>\t\n\t</div>\n\t\n\t<ul id="list" class="list-group"></ul>\n\n</div>');
    
    }).call(this);
    
  }).call(__obj);
  __obj.safe = __objSafe, __obj.escape = __escape;
  return __out.join('');
}
},{}],11:[function(require,module,exports){
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

},{"3vot-model":27}],12:[function(require,module,exports){
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
},{"3vot-model/lib/ajaxless":25}],13:[function(require,module,exports){
//List View Result
//Fetches and 

var _3Model = require("3vot-model/lib/ajaxless")

ListViewResults = _3Model.Model.setup("ListViewResults", ["id","label"]);


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

},{"3vot-model/lib/ajaxless":25}],14:[function(require,module,exports){
//Sf1Fields Main Object with Mappings for Profile and Org Mobile Fields pero Object

var _3Model = require("3vot-model")

Sf1Fields = _3Model.Model.setup("threevot_apps__Sf1Fields__c", ["id","Name","threevot_apps__data__c","threevot_apps__profileid__c"]);

//Standard Search
Sf1Fields.fetch = function(profileId){
	Sf1Fields.query("select id, name, profileid__c, data__c from threevot_apps__Sf1Fields__c where profileid__c = '" + profileId + "' or name = 'ORGANIZATION'" );
}

//Getter and JSON Parse for Data
//To keep things in one place
Sf1Fields.prototype.getData = function(){
	return JSON.parse(this.threevot_apps__data__c);
}

//Helper Function to get list of Object for current Profile and Organization
Sf1Fields.getObjects = function(){
	var objects = []
	var profile = Sf1Fields.findByAttribute("threevot_apps__profileid__c", _3vot.user_profile );
	if(!profile) Sf1Fields.findByAttribute("Name", "ORGANIZATION" );
	var data = profile.getData();
	objects = 	Object.keys(data);
	return objects;
}

//Helper Function to get Fields by Object according to current profileId
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

},{"3vot-model":27}],15:[function(require,module,exports){

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

},{"./code/controllers/list":1,"./code/controllers/objects":8,"./code/models/sf1fields":14}],16:[function(require,module,exports){
(function() {
  var Action, Ajax, AjaxUtils, Collection, Extend, Include, Query, SalesforceRest, Singleton, View, ajax_request, _3Model,
    __slice = [].slice;

  _3Model = require('3vot-model');

  AjaxUtils = require("./ajax_utils");

  Collection = require("./ajax_collection");

  Singleton = require("./ajax_singleton");

  Action = require("./ajax_action");

  Query = require("./ajax_query");

  SalesforceRest = require("./ajax_salesforcerest");

  View = require("./ajax_view");

  ajax_request = require("./ajax_request");

  Include = {
    ajax: function() {
      return new Singleton(this);
    },
    url: function() {
      var args;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      args.unshift(encodeURIComponent(this.id));
      return AjaxUtils.generateURL.apply(AjaxUtils, [this].concat(__slice.call(args)));
    }
  };

  Extend = {
    ajax: function() {
      return new Collection(this);
    },
    view: function() {
      return new View(this);
    },
    salesforceRest: function() {
      return new SalesforceRest(this);
    },
    action: function() {
      return new Action(this);
    },
    queryManager: function() {
      return new Query(this);
    },
    url: function() {
      var args;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return AjaxUtils.generateURL.apply(AjaxUtils, [this].concat(__slice.call(args)));
    }
  };

  Ajax = {
    extended: function() {
      this.fetch(this.ajaxFetch);
      this.change(this.ajaxChange);
      this.query = this.ajaxQuery;
      this.rest = this.callSalesforceRest;
      this.extend(Extend);
      return this.include(Include);
    },
    ajaxFetch: function() {
      var _ref;
      return (_ref = this.ajax()).fetch.apply(_ref, arguments);
    },
    callAction: function() {
      var _ref;
      return (_ref = this.action()).call.apply(_ref, arguments);
    },
    callSalesforceRest: function() {
      var _ref;
      return (_ref = this.salesforceRest()).call.apply(_ref, arguments);
    },
    callView: function() {
      var _ref;
      return (_ref = this.view()).call.apply(_ref, arguments);
    },
    ajaxQuery: function() {
      var _ref;
      return (_ref = this.queryManager()).manualQuery.apply(_ref, arguments);
    },
    destroy: function() {
      var _ref;
      return (_ref = this.action()).destroy.apply(_ref, arguments);
    },
    ajaxChange: function(record, type, options) {
      if (options == null) {
        options = {};
      }
      if (options.ajax === false || record.constructor.autoAjax === false) {
        return;
      }
      return record.ajax()[type](options.ajax || {}, options);
    }
  };

  Ajax.request = ajax_request;

  module.exports = Ajax;

}).call(this);

},{"./ajax_action":17,"./ajax_collection":18,"./ajax_query":19,"./ajax_request":20,"./ajax_salesforcerest":21,"./ajax_singleton":22,"./ajax_utils":23,"./ajax_view":24,"3vot-model":27}],17:[function(require,module,exports){
(function() {
  var Action, ajax_request,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  ajax_request = require("./ajax_request");

  Action = (function() {
    function Action(model) {
      this.model = model;
      this.failResponse = __bind(this.failResponse, this);
      this.recordsResponse = __bind(this.recordsResponse, this);
    }

    Action.prototype.destroy = function(values, options) {
      var params;
      if (values == null) {
        values = {};
      }
      if (options == null) {
        options = {};
      }
      options.url = this.model.url();
      params = {
        query: values
      };
      ajax_request.queueRequest.del(params, options).end((function(_this) {
        return function(err, res) {
          if (err) {
            return _this.failResponse(err, options);
          } else if (res.status >= 400) {
            return _this.failResponse(res.text, options);
          }
          return _this.recordsResponse(res.body, options);
        };
      })(this));
      return true;
    };

    Action.prototype.call = function(name, values, options) {
      var params;
      if (values == null) {
        values = {};
      }
      if (options == null) {
        options = {};
      }
      options.url = this.model.url() + "/actions/" + name;
      params = {
        data: values
      };
      ajax_request.queueRequest.post(params, options).end((function(_this) {
        return function(err, res) {
          if (err) {
            return _this.failResponse(err, options);
          } else if (res.status >= 400) {
            return _this.failResponse(res.text, options);
          }
          return _this.recordsResponse(res.body, options);
        };
      })(this));
      return true;
    };

    Action.prototype.recordsResponse = function(data, options) {
      var _ref;
      this.model.trigger('ajaxSuccess', data);
      this.model.trigger('actionSuccess', data);
      return (_ref = options.done) != null ? _ref.apply(this.model, [data]) : void 0;
    };

    Action.prototype.failResponse = function(error, options) {
      var _ref;
      this.model.trigger('ajaxError', error);
      this.model.trigger('actionError', error);
      return (_ref = options.fail) != null ? _ref.apply(this.model, [error]) : void 0;
    };

    return Action;

  })();

  module.exports = Action;

}).call(this);

},{"./ajax_request":20}],18:[function(require,module,exports){
(function() {
  var AjaxUtils, Collection, ajax_request,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  ajax_request = require("./ajax_request");

  AjaxUtils = require("./ajax_utils");

  Collection = (function() {
    function Collection(model) {
      this.model = model;
      this.failResponse = __bind(this.failResponse, this);
      this.recordsResponse = __bind(this.recordsResponse, this);
      if (typeof Visualforce !== "undefined") {
        ajax_request = require("./vf_request");
      }
    }

    Collection.prototype.find = function(id, params, options) {
      var record;
      if (options == null) {
        options = {};
      }
      record = new this.model({
        id: id
      });
      options.url = options.url || AjaxUtils.getURL(record);
      options.model = this.model;
      params.query = params.query || this.model.attributes.join(",");
      return ajax_request.queueRequest.get(params, options);
    };

    Collection.prototype.all = function(params, options) {
      if (options == null) {
        options = {};
      }
      if (!options.url) {
        options.url = this.model.url();
      }
      return ajax_request.queueRequest.get(params, options);
    };

    Collection.prototype.fetch = function(params, options) {
      var id, _this;
      if (params == null) {
        params = {};
      }
      if (options == null) {
        options = {};
      }
      if (id = params.id) {
        delete params.id;
        _this = this;
        this.find(id, params, options).end(function(err, res) {
          if (err) {
            return _this.failResponse(err, options);
          } else if (res.status >= 400) {
            return _this.failResponse(res.text, options);
          }
          _this.model.refresh(res.body, options);
          return _this.recordsResponse(res, options);
        });
        return true;
      } else {
        this.all(params, options).end((function(_this) {
          return function(err, res) {
            if (err) {
              return _this.failResponse(err, options);
            } else if (res.status >= 400) {
              return _this.failResponse(res.text, options);
            }
            _this.model.refresh(res.body, options);
            return _this.recordsResponse(res, options);
          };
        })(this));
        return true;
      }
    };

    Collection.prototype.recordsResponse = function(data, options) {
      var _ref;
      this.model.trigger('ajaxSuccess', data);
      return (_ref = options.done) != null ? _ref.apply(this.model, [data]) : void 0;
    };

    Collection.prototype.failResponse = function(error, options) {
      var _ref;
      this.model.trigger('ajaxError', error);
      return (_ref = options.fail) != null ? _ref.apply(this.model, [error]) : void 0;
    };

    return Collection;

  })();

  module.exports = Collection;

}).call(this);

},{"./ajax_request":20,"./ajax_utils":23,"./vf_request":31}],19:[function(require,module,exports){
(function() {
  var AjaxUtils, Query, ajax_request, _3Model,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  ajax_request = require("./ajax_request");

  AjaxUtils = require("./ajax_utils");

  _3Model = require("3vot-model");

  Query = (function() {
    function Query(model) {
      this.model = model;
      this.failResponse = __bind(this.failResponse, this);
      this.recordsResponse = __bind(this.recordsResponse, this);
      if (typeof Visualforce !== "undefined") {
        ajax_request = require("./vf_request");
      }
    }

    Query.prototype.manualQuery = function(query, options) {
      if (options == null) {
        options = {};
      }
      options.url = _3Model.Model.host + "/query?query=" + query;
      ajax_request.queueRequest.get({}, options, this.model).end((function(_this) {
        return function(err, res) {
          if (err) {
            return _this.failResponse(err, options);
          } else if (res.status >= 400) {
            return _this.failResponse(res.text, options);
          }
          _this.model.refresh(res.body, options);
          return _this.recordsResponse(res, options);
        };
      })(this));
      return true;
    };

    Query.prototype.recordsResponse = function(data, options) {
      var _ref;
      this.model.trigger('ajaxSuccess', data);
      return (_ref = options.done) != null ? _ref.apply(this.model, [data]) : void 0;
    };

    Query.prototype.failResponse = function(error, options) {
      var _ref;
      this.model.trigger('ajaxError', error);
      return (_ref = options.fail) != null ? _ref.apply(this.model, [error]) : void 0;
    };

    return Query;

  })();

  module.exports = Query;

  ({
    getQuery: (function(_this) {
      return function(options) {
        if (options == null) {
          options = {
            "": true
          };
        }
        if (!RSpine.isArray(options)) {
          options = [options];
        }
        return _this.queryString() + _this.getQueryCondition(options);
      };
    })(this),
    getQueryCondition: function(conditions) {
      var filter, filterKey, key, orderFilterString, queryFilterString, querySinceLastUpdate, querySinceLastUpdated, stringFilters, thisFilter, _i, _j, _len, _len1, _ref;
      if (Object.keys(this.filters).length === 0) {
        return "";
      }
      stringFilters = [];
      queryFilterString = "";
      orderFilterString = "";
      querySinceLastUpdated = this.querySinceLastUpdate;
      for (_i = 0, _len = conditions.length; _i < _len; _i++) {
        filter = conditions[_i];
        if (!filter.junction) {
          filter.junction = "and";
        }
        if (stringFilters.length === 0) {
          filter.junction = "where";
        }
        filterKey = "";
        _ref = Object.keys(filter);
        for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
          key = _ref[_j];
          if (key !== "junction") {
            filterKey = key;
          }
        }
        if (key === "sinceLastUpdate") {
          querySinceLastUpdate = true;
        }
        if (key === "avoidLastUpdate") {
          querySinceLastUpdate = false;
        }
        if (filterKey !== "orderBy" && filterKey !== "sinceLastUpdate" && key !== "avoidLastUpdate") {
          thisFilter = this.filters[filterKey];
          thisFilter = thisFilter.replace("?", filter[filterKey]);
          stringFilters.push(thisFilter);
          queryFilterString += " " + filter.junction + " " + thisFilter;
        } else if (filterKey === "orderBy") {
          orderFilterString = " ORDER " + filter[filterKey];
        }
      }
      if (querySinceLastUpdated) {
        queryFilterString = " and LastModifiedDate >= " + this.lastUpdate;
      }
      return queryFilterString + orderFilterString;
    },
    queryString: (function(_this) {
      return function() {
        var attribute, query, _i, _len, _ref, _ref1;
        query = "select ";
        _ref = _this.attributes;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          attribute = _ref[_i];
          if (((_ref1 = _this.avoidQueryList) != null ? _ref1.indexOf(attribute) : void 0) === -1) {
            query += attribute + ",";
          }
        }
        query += "Id  ";
        query += "from " + _this.className;
        query += " ";
        return query;
      };
    })(this)
  });

}).call(this);

},{"./ajax_request":20,"./ajax_utils":23,"./vf_request":31,"3vot-model":27}],20:[function(require,module,exports){
(function() {
  var AjaxRequest, AjaxUtils, superagent, _3Model;

  superagent = require("superagent");

  AjaxUtils = require("./ajax_utils");

  _3Model = require("3vot-model");

  AjaxRequest = (function() {
    function AjaxRequest() {}

    AjaxRequest.promise = {
      end: function() {}
    };

    AjaxRequest.enabled = true;

    AjaxRequest.disable = function(callback) {
      var e;
      if (this.enabled) {
        this.enabled = false;
        try {
          return callback();
        } catch (_error) {
          e = _error;
          throw e;
        } finally {
          this.enabled = true;
        }
      } else {
        return callback();
      }
    };

    AjaxRequest.queueRequest = {
      get: function(params, options) {
        return AjaxRequest.executeRequest("get", params, options);
      },
      post: function(params, options) {
        return AjaxRequest.executeRequest("post", params, options);
      },
      put: function(params, options) {
        return AjaxRequest.executeRequest("put", params, options);
      },
      del: function(params, options) {
        return AjaxRequest.executeRequest("del", params, options);
      }
    };

    AjaxRequest.executeRequest = function(type, params, options) {
      var header, request, _i, _len, _ref;
      if (this.enabled === false) {
        return this.promise;
      }
      request = superagent[type](options.url).set('X-Requested-With', 'XMLHttpRequest');
      _ref = _3Model.Model.headers;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        header = _ref[_i];
        if (!header.name || !header.value) {
          throw "header should be an object with name and value";
        }
        request = request.set(header.name, header.value);
      }
      if (typeof request.withCredentials === "function") {
        request.withCredentials();
      }
      if (type === "put" || type === "post") {
        request = request.type('json');
      }
      if (options.error) {
        request.on("error", options.error);
      }
      if (params.query) {
        request = request.query(params.query);
      }
      if (params.data) {
        if (typeof params.data !== 'string') {
          params.data = JSON.stringify(params.data);
        }
        request = request.send(params.data);
      }
      return request;
    };

    return AjaxRequest;

  })();

  module.exports = AjaxRequest;

}).call(this);

},{"./ajax_utils":23,"3vot-model":27,"superagent":32}],21:[function(require,module,exports){
(function() {
  var SalesforceRest, ajax_request,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  ajax_request = require("./ajax_request");

  SalesforceRest = (function() {
    function SalesforceRest(model) {
      this.model = model;
      this.failResponse = __bind(this.failResponse, this);
      this.recordsResponse = __bind(this.recordsResponse, this);
    }

    SalesforceRest.prototype.call = function(url, params, options) {
      if (options == null) {
        options = {};
      }
      options.url = url;
      ajax_request.queueRequest.get(params, options).end((function(_this) {
        return function(err, res) {
          if (err) {
            return _this.failResponse(err, options);
          } else if (res.status >= 400) {
            return _this.failResponse(res.text, options);
          }
          return _this.recordsResponse(res.body, options);
        };
      })(this));
      return true;
    };

    SalesforceRest.prototype.recordsResponse = function(data, options) {
      var _ref;
      this.model.trigger('ajaxSuccess', data);
      this.model.trigger('restSuccess', data);
      return (_ref = options.done) != null ? _ref.apply(this.model, [data]) : void 0;
    };

    SalesforceRest.prototype.failResponse = function(error, options) {
      var _ref;
      this.model.trigger('ajaxError', error);
      this.model.trigger('restError', error);
      return (_ref = options.fail) != null ? _ref.apply(this.model, [error]) : void 0;
    };

    return SalesforceRest;

  })();

  module.exports = SalesforceRest;

}).call(this);

},{"./ajax_request":20}],22:[function(require,module,exports){
(function() {
  var AjaxUtils, Singleton, ajax_request, _3Model,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  _3Model = require("3vot-model");

  ajax_request = require("./ajax_request");

  AjaxUtils = require("./ajax_utils");

  Singleton = (function() {
    function Singleton(record) {
      this.record = record;
      this.failResponse = __bind(this.failResponse, this);
      this.recordResponse = __bind(this.recordResponse, this);
      this.model = this.record.constructor;
      if (typeof Visualforce !== "undefined") {
        ajax_request = require("./vf_request");
      }
    }

    Singleton.prototype.reload = function(params, options) {
      if (options == null) {
        options = {};
      }
      params.data = this.record.toJSON();
      options.url = options.url || AjaxUtils.getURL(this.record);
      options.error = this.failResponse;
      options.record = this.record;
      return ajax_request.queueRequest.get(params, options).end((function(_this) {
        return function(res) {
          if (err) {
            return _this.failResponse(err, options);
          } else if (res.status >= 400) {
            return _this.failResponse(res.text, options);
          }
          return _this.recordResponse(res.body, options);
        };
      })(this));
    };

    Singleton.prototype.create = function(params, options) {
      if (options == null) {
        options = {};
      }
      params.data = this.record.toJSON();
      options.url = options.url || AjaxUtils.getCollectionURL(this.record);
      return ajax_request.queueRequest.post(params, options).end((function(_this) {
        return function(err, res) {
          if (err) {
            return _this.failResponse(err, options);
          } else if (res.status >= 400) {
            return _this.failResponse(res.text, options);
          }
          return _this.recordResponse(res.body, options);
        };
      })(this));
    };

    Singleton.prototype.update = function(params, options) {
      if (options == null) {
        options = {};
      }
      params.data = this.record.toJSON();
      options.url = options.url || AjaxUtils.getURL(this.record);
      return ajax_request.queueRequest.put(params, options).end((function(_this) {
        return function(err, res) {
          if (err) {
            return _this.failResponse(err, options);
          } else if (res.status >= 400) {
            return _this.failResponse(res.text, options);
          }
          return _this.recordResponse(res.body, options);
        };
      })(this));
    };

    Singleton.prototype.destroy = function(params, options) {
      if (options == null) {
        options = {};
      }
      params.data = this.record.toJSON();
      options.url = options.url || AjaxUtils.getURL(this.record);
      options.error = this.failResponse;
      return ajax_request.queueRequest.del(params, options).end((function(_this) {
        return function(err, res) {
          if (err) {
            return _this.failResponse(err, options);
          } else if (res.status >= 400) {
            return _this.failResponse(res.text, options);
          }
          return _this.recordResponse(res.body, options);
        };
      })(this));
    };

    Singleton.prototype.recordResponse = function(data, options) {
      var _ref;
      if (options == null) {
        options = {};
      }
      ajax_request.disable((function(_this) {
        return function() {
          if (!(_3Model.isBlank(data) || _this.record.destroyed)) {
            if (data.id && _this.record.id !== data.id) {
              _this.record.changeID(data.id);
            }
            return _this.record.refresh(data);
          }
        };
      })(this));
      this.record.trigger('ajaxSuccess', data);
      return (_ref = options.done) != null ? _ref.apply(this.record) : void 0;
    };

    Singleton.prototype.failResponse = function(error, options) {
      var _ref;
      if (options == null) {
        options = {};
      }
      this.record.trigger('ajaxError', error);
      return (_ref = options.fail) != null ? _ref.apply(this.record, [error]) : void 0;
    };

    return Singleton;

  })();

  module.exports = Singleton;

}).call(this);

},{"./ajax_request":20,"./ajax_utils":23,"./vf_request":31,"3vot-model":27}],23:[function(require,module,exports){
(function() {
  var AjaxUtils, _3Model,
    __slice = [].slice;

  _3Model = require("3vot-model");

  AjaxUtils = (function() {
    function AjaxUtils() {}

    AjaxUtils.getURL = function(object) {
      return (typeof object.url === "function" ? object.url() : void 0) || object.url;
    };

    AjaxUtils.getScope = function(object) {
      return (typeof object.scope === "function" ? object.scope() : void 0) || object.scope;
    };

    AjaxUtils.generateURL = function() {
      var args, collection, object, path, scope;
      object = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      if (window && typeof window.Visualforce !== "undefined") {
        if (object.className) {
          collection = object.className;
          scope = AjaxUtils.getScope(object);
        } else {
          collection = typeof object.constructor.url === 'string' ? object.constructor.url : object.constructor.className;
          scope = AjaxUtils.getScope(object) || AjaxUtils.getScope(object.constructor);
        }
      } else if (object.className) {
        collection = object.className.toLowerCase() + 's';
        scope = AjaxUtils.getScope(object);
      } else {
        if (typeof object.constructor.url === 'string') {
          collection = object.constructor.url;
        } else {
          collection = object.constructor.className.toLowerCase() + 's';
        }
        scope = AjaxUtils.getScope(object) || AjaxUtils.getScope(object.constructor);
      }
      args.unshift(collection);
      args.unshift(scope);
      path = args.join('/');
      path = path.replace(/(\/\/)/g, "/");
      path = path.replace(/^\/|\/$/g, "");
      if (path.indexOf("../") !== 0) {
        return _3Model.Model.host + "/" + path;
      } else {
        return path;
      }
    };

    AjaxUtils.getCollectionURL = function(object) {
      if (object) {
        if (typeof object.url === "function") {
          return AjaxUtils.generateURL(object);
        } else {
          return object.url;
        }
      }
    };

    return AjaxUtils;

  })();

  module.exports = AjaxUtils;

}).call(this);

},{"3vot-model":27}],24:[function(require,module,exports){
(function() {
  var View, ajax_request,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  ajax_request = require("./ajax_request");

  View = (function() {
    function View(model) {
      this.model = model;
      this.failResponse = __bind(this.failResponse, this);
      this.recordsResponse = __bind(this.recordsResponse, this);
    }

    View.prototype.call = function(name, values, options) {
      var params;
      if (options == null) {
        options = {};
      }
      options.url = this.model.url() + "/views/" + name;
      params = {
        query: values
      };
      ajax_request.queueRequest.get(params, options).end((function(_this) {
        return function(err, res) {
          if (err) {
            return _this.failResponse(err, options);
          } else if (res.status >= 400) {
            return _this.failResponse(res.text, options);
          }
          return _this.recordsResponse(res.body, options);
        };
      })(this));
      return true;
    };

    View.prototype.recordsResponse = function(data, options) {
      var _ref;
      this.model.trigger('ajaxSuccess', data);
      this.model.trigger('viewSuccess', data);
      return (_ref = options.done) != null ? _ref.apply(this.model, [data]) : void 0;
    };

    View.prototype.failResponse = function(error, options) {
      var _ref;
      this.model.trigger('ajaxError', error);
      this.model.trigger('viewError', error);
      return (_ref = options.fail) != null ? _ref.apply(this.model, [error]) : void 0;
    };

    return View;

  })();

  module.exports = View;

}).call(this);

},{"./ajax_request":20}],25:[function(require,module,exports){
(function() {
  var Events, Model, Module, _3Model;

  Events = require("./events");

  Model = require("./model_ajaxless");

  Module = require("./module");

  _3Model = this._3Model = {};

  _3Model.Events = Events;

  _3Model.Module = Module;

  _3Model.Model = Model;

  _3Model.isBlank = Model.isBlank;

  Module.extend.call(_3Model, Events);

  _3Model.Class = Module;

  module.exports = _3Model;

}).call(this);

},{"./events":26,"./model_ajaxless":29,"./module":30}],26:[function(require,module,exports){
(function() {
  var Events, trim,
    __slice = [].slice;

  trim = function(text) {
    var rtrim, _ref;
    rtrim = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g;
        if ((_ref = text === null) != null) {
      _ref;
    } else {
      ({
        "": (text + "").replace(rtrim, "")
      });
    };
    return text;
  };

  Events = {
    bind: function(ev, callback) {
      var calls, evs, name, _i, _len;
      evs = ev.split(' ');
      if (this.hasOwnProperty('_callbacks') && this._callbacks) {
        calls = this._callbacks;
      } else {
        this._callbacks = {};
        calls = this._callbacks;
      }
      for (_i = 0, _len = evs.length; _i < _len; _i++) {
        name = evs[_i];
        calls[name] || (calls[name] = []);
        calls[name].push(callback);
      }
      return this;
    },
    one: function(ev, callback) {
      var handler;
      return this.bind(ev, handler = function() {
        this.unbind(ev, handler);
        return callback.apply(this, arguments);
      });
    },
    trigger: function() {
      var args, callback, ev, list, _i, _len, _ref;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      ev = args.shift();
      list = this.hasOwnProperty('_callbacks') && ((_ref = this._callbacks) != null ? _ref[ev] : void 0);
      if (!list) {
        return;
      }
      for (_i = 0, _len = list.length; _i < _len; _i++) {
        callback = list[_i];
        if (callback.apply(this, args) === false) {
          break;
        }
      }
      return true;
    },
    listenTo: function(obj, ev, callback) {
      obj.bind(ev, callback);
      this.listeningTo || (this.listeningTo = []);
      this.listeningTo.push({
        obj: obj,
        ev: ev,
        callback: callback
      });
      return this;
    },
    listenToOnce: function(obj, ev, callback) {
      var handler, listeningToOnce;
      listeningToOnce = this.listeningToOnce || (this.listeningToOnce = []);
      obj.bind(ev, handler = function() {
        var i, idx, lt, _i, _len;
        idx = -1;
        for (i = _i = 0, _len = listeningToOnce.length; _i < _len; i = ++_i) {
          lt = listeningToOnce[i];
          if (lt.obj === obj) {
            if (lt.ev === ev && lt.callback === callback) {
              idx = i;
            }
          }
        }
        obj.unbind(ev, handler);
        if (idx !== -1) {
          listeningToOnce.splice(idx, 1);
        }
        return callback.apply(this, arguments);
      });
      listeningToOnce.push({
        obj: obj,
        ev: ev,
        callback: callback,
        handler: handler
      });
      return this;
    },
    stopListening: function(obj, events, callback) {
      var ev, evts, i, idx, listeningTo, lt, _i, _j, _k, _len, _len1, _len2, _ref, _ref1, _results;
      if (arguments.length === 0) {
        _ref = [this.listeningTo, this.listeningToOnce];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          listeningTo = _ref[_i];
          if (!listeningTo) {
            continue;
          }
          for (_j = 0, _len1 = listeningTo.length; _j < _len1; _j++) {
            lt = listeningTo[_j];
            lt.obj.unbind(lt.ev, lt.handler || lt.callback);
          }
        }
        this.listeningTo = void 0;
        return this.listeningToOnce = void 0;
      } else if (obj) {
        _ref1 = [this.listeningTo, this.listeningToOnce];
        _results = [];
        for (_k = 0, _len2 = _ref1.length; _k < _len2; _k++) {
          listeningTo = _ref1[_k];
          if (!listeningTo) {
            continue;
          }
          events = events ? events.split(' ') : [void 0];
          _results.push((function() {
            var _l, _len3, _results1;
            _results1 = [];
            for (_l = 0, _len3 = events.length; _l < _len3; _l++) {
              ev = events[_l];
              _results1.push((function() {
                var _m, _ref2, _results2;
                _results2 = [];
                for (idx = _m = _ref2 = listeningTo.length - 1; _ref2 <= 0 ? _m <= 0 : _m >= 0; idx = _ref2 <= 0 ? ++_m : --_m) {
                  lt = listeningTo[idx];
                  if ((!ev) || (ev === lt.ev)) {
                    lt.obj.unbind(lt.ev, lt.handler || lt.callback);
                    if (idx !== -1) {
                      _results2.push(listeningTo.splice(idx, 1));
                    } else {
                      _results2.push(void 0);
                    }
                  } else if (ev) {
                    evts = lt.ev.split(' ');
                    if (~(i = evts.indexOf(ev))) {
                      evts.splice(i, 1);
                      lt.ev = trim(evts.join(' '));
                      _results2.push(lt.obj.unbind(ev, lt.handler || lt.callback));
                    } else {
                      _results2.push(void 0);
                    }
                  } else {
                    _results2.push(void 0);
                  }
                }
                return _results2;
              })());
            }
            return _results1;
          })());
        }
        return _results;
      }
    },
    unbind: function(ev, callback) {
      var cb, evs, i, list, name, _i, _j, _len, _len1, _ref;
      if (arguments.length === 0) {
        this._callbacks = {};
        return this;
      }
      if (!ev) {
        return this;
      }
      evs = ev.split(' ');
      for (_i = 0, _len = evs.length; _i < _len; _i++) {
        name = evs[_i];
        list = (_ref = this._callbacks) != null ? _ref[name] : void 0;
        if (!list) {
          continue;
        }
        if (!callback) {
          delete this._callbacks[name];
          continue;
        }
        for (i = _j = 0, _len1 = list.length; _j < _len1; i = ++_j) {
          cb = list[i];
          if (!(cb === callback)) {
            continue;
          }
          list = list.slice();
          list.splice(i, 1);
          this._callbacks[name] = list;
          break;
        }
      }
      return this;
    }
  };

  Events.on = Events.bind;

  Events.off = Events.unbind;

  module.exports = Events;

}).call(this);

},{}],27:[function(require,module,exports){
(function() {
  var Events, Model, Module, _3Model;

  Events = require("./events");

  Model = require("./model");

  Module = require("./module");

  _3Model = this._3Model = {};

  _3Model.Events = Events;

  _3Model.Module = Module;

  _3Model.Model = Model;

  _3Model.isBlank = Model.isBlank;

  Module.extend.call(_3Model, Events);

  _3Model.Class = Module;

  module.exports = _3Model;

}).call(this);

},{"./events":26,"./model":28,"./module":30}],28:[function(require,module,exports){
(function() {
  var Events, Model, Module, createObject, isArray, isBlank, makeArray,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __slice = [].slice;

  Events = require("./events");

  Module = require("./module");

  Model = (function(_super) {
    __extends(Model, _super);

    Model.extend(Events);

    Model.records = [];

    Model.irecords = {};

    Model.attributes = [];

    Model.host = "";

    Model.headers = [];

    Model.configure = function() {
      var attributes, name;
      name = arguments[0], attributes = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      this.className = name;
      this.deleteAll();
      if (attributes.length) {
        this.attributes = attributes;
      }
      this.attributes && (this.attributes = makeArray(this.attributes));
      this.attributes || (this.attributes = []);
      this.unbind();
      return this;
    };

    Model.toString = function() {
      return "" + this.className + "(" + (this.attributes.join(", ")) + ")";
    };

    Model.find = function(id) {
      var record;
      record = this.exists(id);
      if (!record) {
        throw new Error("\"" + this.className + "\" model could not find a record for the ID \"" + id + "\"");
      }
      return record;
    };

    Model.exists = function(id) {
      var _ref;
      return (_ref = this.irecords[id]) != null ? _ref.clone() : void 0;
    };

    Model.addRecord = function(record) {
      if (record.id && this.irecords[record.id]) {
        this.irecords[record.id].remove();
      }
      record.id || (record.id = record.cid);
      this.records.push(record);
      this.irecords[record.id] = record;
      return this.irecords[record.cid] = record;
    };

    Model.refresh = function(values, options) {
      var record, records, result, _i, _len;
      if (options == null) {
        options = {};
      }
      if (options.clear) {
        this.deleteAll();
      }
      records = this.fromJSON(values);
      if (!isArray(records)) {
        records = [records];
      }
      for (_i = 0, _len = records.length; _i < _len; _i++) {
        record = records[_i];
        this.addRecord(record);
      }
      this.sort();
      result = this.cloneArray(records);
      this.trigger('refresh', result, options);
      return result;
    };

    Model.select = function(callback) {
      var record, _i, _len, _ref, _results;
      _ref = this.records;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        record = _ref[_i];
        if (callback(record)) {
          _results.push(record.clone());
        }
      }
      return _results;
    };

    Model.findByAttribute = function(name, value) {
      var record, _i, _len, _ref;
      _ref = this.records;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        record = _ref[_i];
        if (record[name] === value) {
          return record.clone();
        }
      }
      return null;
    };

    Model.findAllByAttribute = function(name, value) {
      return this.select(function(item) {
        return item[name] === value;
      });
    };

    Model.each = function(callback) {
      var record, _i, _len, _ref, _results;
      _ref = this.records;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        record = _ref[_i];
        _results.push(callback(record.clone()));
      }
      return _results;
    };

    Model.all = function() {
      return this.cloneArray(this.records);
    };

    Model.first = function() {
      var _ref;
      return (_ref = this.records[0]) != null ? _ref.clone() : void 0;
    };

    Model.last = function() {
      var _ref;
      return (_ref = this.records[this.records.length - 1]) != null ? _ref.clone() : void 0;
    };

    Model.count = function() {
      return this.records.length;
    };

    Model.deleteAll = function() {
      this.records = [];
      return this.irecords = {};
    };

    Model.destroyAll = function(options) {
      var record, _i, _len, _ref, _results;
      _ref = this.records;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        record = _ref[_i];
        _results.push(record.destroy(options));
      }
      return _results;
    };

    Model.update = function(id, atts, options) {
      return this.find(id).updateAttributes(atts, options);
    };

    Model.create = function(atts, options) {
      var record;
      record = new this(atts);
      return record.save(options);
    };

    Model.destroy = function(id, options) {
      return this.find(id).destroy(options);
    };

    Model.change = function(callbackOrParams) {
      if (typeof callbackOrParams === 'function') {
        return this.bind('change', callbackOrParams);
      } else {
        return this.trigger.apply(this, ['change'].concat(__slice.call(arguments)));
      }
    };

    Model.fetch = function(callbackOrParams) {
      if (typeof callbackOrParams === 'function') {
        return this.bind('fetch', callbackOrParams);
      } else {
        return this.trigger.apply(this, ['fetch'].concat(__slice.call(arguments)));
      }
    };

    Model.toJSON = function() {
      return this.records;
    };

    Model.fromJSON = function(objects) {
      var value, _i, _len, _results;
      if (!objects) {
        return;
      }
      if (typeof objects === 'string') {
        objects.replace(/\Id/g, 'id');
        objects = JSON.parse(objects);
      }
      if (isArray(objects)) {
        _results = [];
        for (_i = 0, _len = objects.length; _i < _len; _i++) {
          value = objects[_i];
          if (value.Id) {
            value.id = value.Id;
          }
          _results.push(new this(value));
        }
        return _results;
      } else {
        if (objects.Id) {
          objects.id = objects.Id;
        }
        return new this(objects);
      }
    };

    Model.fromForm = function() {
      var _ref;
      return (_ref = new this).fromForm.apply(_ref, arguments);
    };

    Model.escapeSingleQuotes = function(str) {
      return str = str.replace(/'/g, "\\'");
    };

    Model.sort = function() {
      if (this.comparator) {
        this.records.sort(this.comparator);
      }
      return this;
    };

    Model.cloneArray = function(array) {
      var value, _i, _len, _results;
      _results = [];
      for (_i = 0, _len = array.length; _i < _len; _i++) {
        value = array[_i];
        _results.push(value.clone());
      }
      return _results;
    };

    Model.idCounter = 0;

    Model.uid = function(prefix) {
      var uid;
      if (prefix == null) {
        prefix = '';
      }
      uid = prefix + this.idCounter++;
      if (this.exists(uid)) {
        uid = this.uid(prefix);
      }
      return uid;
    };

    function Model(atts) {
      Model.__super__.constructor.apply(this, arguments);
      if (atts) {
        this.load(atts);
      }
      this.cid = (atts != null ? atts.cid : void 0) || this.constructor.uid('c-');
    }

    Model.prototype.isNew = function() {
      return !this.exists();
    };

    Model.prototype.isValid = function() {
      return !this.validate();
    };

    Model.prototype.validate = function() {};

    Model.prototype.load = function(atts) {
      var key, value;
      if (atts.id) {
        this.id = atts.id;
      }
      for (key in atts) {
        value = atts[key];
        if (atts.hasOwnProperty(key) && typeof this[key] === 'function') {
          this[key](value);
        } else {
          this[key] = value;
        }
      }
      return this;
    };

    Model.prototype.get = function(attr) {
      return this[attr];
    };

    Model.prototype.set = function(attr, value) {
      return this[attr] = value;
    };

    Model.prototype.attributes = function() {
      var key, result, _i, _len, _ref;
      result = {};
      _ref = this.constructor.attributes;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        key = _ref[_i];
        if (key in this) {
          if (typeof this[key] === 'function') {
            result[key] = this[key]();
          } else {
            result[key] = this[key];
          }
        }
      }
      if (this.id) {
        result.id = this.id;
      }
      return result;
    };

    Model.prototype.eql = function(rec) {
      return !!(rec && rec.constructor === this.constructor && (rec.cid === this.cid) || (rec.id && rec.id === this.id));
    };

    Model.prototype.save = function(options) {
      var error, record;
      if (options == null) {
        options = {};
      }
      if (options.validate !== false) {
        error = this.validate();
        if (error) {
          this.trigger('error', error);
          return false;
        }
      }
      this.trigger('beforeSave', options);
      record = this.isNew() ? this.create(options) : this.update(options);
      this.stripCloneAttrs();
      this.trigger('save', options);
      return record;
    };

    Model.prototype.stripCloneAttrs = function() {
      var key, value;
      if (this.hasOwnProperty('cid')) {
        return;
      }
      for (key in this) {
        if (!__hasProp.call(this, key)) continue;
        value = this[key];
        if (this.constructor.attributes.indexOf(key) > -1) {
          delete this[key];
        }
      }
      return this;
    };

    Model.prototype.updateAttribute = function(name, value, options) {
      var atts;
      atts = {};
      atts[name] = value;
      return this.updateAttributes(atts, options);
    };

    Model.prototype.updateAttributes = function(atts, options) {
      this.load(atts);
      return this.save(options);
    };

    Model.prototype.changeID = function(id) {
      var records;
      if (id === this.id) {
        return;
      }
      records = this.constructor.irecords;
      records[id] = records[this.id];
      delete records[this.id];
      this.id = id;
      return this.save();
    };

    Model.prototype.remove = function() {
      var i, record, records, _i, _len;
      records = this.constructor.records.slice(0);
      for (i = _i = 0, _len = records.length; _i < _len; i = ++_i) {
        record = records[i];
        if (!(this.eql(record))) {
          continue;
        }
        records.splice(i, 1);
        break;
      }
      this.constructor.records = records;
      delete this.constructor.irecords[this.id];
      return delete this.constructor.irecords[this.cid];
    };

    Model.prototype.destroy = function(options) {
      if (options == null) {
        options = {};
      }
      this.trigger('beforeDestroy', options);
      this.remove();
      this.destroyed = true;
      this.trigger('destroy', options);
      this.trigger('change', 'destroy', options);
      if (this.listeningTo) {
        this.stopListening();
      }
      this.unbind();
      return this;
    };

    Model.prototype.dup = function(newRecord) {
      var atts;
      if (newRecord == null) {
        newRecord = true;
      }
      atts = this.attributes();
      if (newRecord) {
        delete atts.id;
      } else {
        atts.cid = this.cid;
      }
      return new this.constructor(atts);
    };

    Model.prototype.clone = function() {
      return createObject(this);
    };

    Model.prototype.reload = function() {
      var original;
      if (this.isNew()) {
        return this;
      }
      original = this.constructor.find(this.id);
      this.load(original.attributes());
      return original;
    };

    Model.prototype.refresh = function(data) {
      var root;
      root = this.constructor.irecords[this.id];
      root.load(data);
      this.trigger('refresh');
      return this;
    };

    Model.prototype.toJSON = function() {
      return this.attributes();
    };

    Model.prototype.toString = function() {
      return "<" + this.constructor.className + " (" + (JSON.stringify(this)) + ")>";
    };

    Model.prototype.fromForm = function(form) {
      var result;
      result = {};

      /*      
      for checkbox in $(form).find('[type=checkbox]:not([value])')
        result[checkbox.name] = $(checkbox).prop('checked')
      
      for checkbox in $(form).find('[type=checkbox][name$="[]"]')
        name = checkbox.name.replace(/\[\]$/, '')
        result[name] or= []
        result[name].push checkbox.value if $(checkbox).prop('checked')
      
      for key in $(form).serializeArray()
        result[key.name] or= key.value
       */
      return this.load(result);
    };

    Model.prototype.exists = function() {
      return this.constructor.exists(this.id);
    };

    Model.prototype.update = function(options) {
      var clone, records;
      this.trigger('beforeUpdate', options);
      records = this.constructor.irecords;
      records[this.id].load(this.attributes());
      this.constructor.sort();
      clone = records[this.id].clone();
      clone.trigger('update', options);
      clone.trigger('change', 'update', options);
      return clone;
    };

    Model.prototype.create = function(options) {
      var clone, record;
      this.trigger('beforeCreate', options);
      this.id || (this.id = this.cid);
      record = this.dup(false);
      this.constructor.addRecord(record);
      this.constructor.sort();
      clone = record.clone();
      clone.trigger('create', options);
      clone.trigger('change', 'create', options);
      return clone;
    };

    Model.prototype.bind = function(events, callback) {
      var binder, singleEvent, _fn, _i, _len, _ref;
      this.constructor.bind(events, binder = (function(_this) {
        return function(record) {
          if (record && _this.eql(record)) {
            return callback.apply(_this, arguments);
          }
        };
      })(this));
      _ref = events.split(' ');
      _fn = (function(_this) {
        return function(singleEvent) {
          var unbinder;
          return _this.constructor.bind("unbind", unbinder = function(record, event, cb) {
            if (record && _this.eql(record)) {
              if (event && event !== singleEvent) {
                return;
              }
              if (cb && cb !== callback) {
                return;
              }
              _this.constructor.unbind(singleEvent, binder);
              return _this.constructor.unbind("unbind", unbinder);
            }
          });
        };
      })(this);
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        singleEvent = _ref[_i];
        _fn(singleEvent);
      }
      return this;
    };

    Model.prototype.one = function(events, callback) {
      var handler;
      return this.bind(events, handler = (function(_this) {
        return function() {
          _this.unbind(events, handler);
          return callback.apply(_this, arguments);
        };
      })(this));
    };

    Model.prototype.trigger = function() {
      var args, _ref;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      args.splice(1, 0, this);
      return (_ref = this.constructor).trigger.apply(_ref, args);
    };

    Model.prototype.listenTo = function() {
      return Events.listenTo.apply(this, arguments);
    };

    Model.prototype.listenToOnce = function() {
      return Events.listenToOnce.apply(this, arguments);
    };

    Model.prototype.stopListening = function() {
      return Events.stopListening.apply(this, arguments);
    };

    Model.prototype.unbind = function(events, callback) {
      var event, _i, _len, _ref, _results;
      if (arguments.length === 0) {
        return this.trigger('unbind');
      } else if (events) {
        _ref = events.split(' ');
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          event = _ref[_i];
          _results.push(this.trigger('unbind', event, callback));
        }
        return _results;
      }
    };

    return Model;

  })(Module);

  Model.prototype.on = Model.prototype.bind;

  Model.prototype.off = Model.prototype.unbind;

  createObject = Object.create || function(o) {
    var Func;
    Func = function() {};
    Func.prototype = o;
    return new Func();
  };

  isArray = function(value) {
    return Object.prototype.toString.call(value) === '[object Array]';
  };

  isBlank = function(value) {
    var key;
    if (!value) {
      return true;
    }
    for (key in value) {
      return false;
    }
    return true;
  };

  makeArray = function(args) {
    return Array.prototype.slice.call(args, 0);
  };

  Model.isBlank = isBlank;

  Model.sub = function(instances, statics) {
    var Result;
    Result = (function(_super) {
      __extends(Result, _super);

      function Result() {
        return Result.__super__.constructor.apply(this, arguments);
      }

      return Result;

    })(this);
    if (instances) {
      Result.include(instances);
    }
    if (statics) {
      Result.extend(statics);
    }
    if (typeof Result.unbind === "function") {
      Result.unbind();
    }
    return Result;
  };

  Model.setup = function(name, attributes) {
    var Ajax, Instance;
    if (attributes == null) {
      attributes = [];
    }
    Instance = (function(_super) {
      __extends(Instance, _super);

      function Instance() {
        return Instance.__super__.constructor.apply(this, arguments);
      }

      return Instance;

    })(this);
    Instance.configure.apply(Instance, [name].concat(__slice.call(attributes)));
    Ajax = require("./ajax");
    Instance.extend(Ajax);
    return Instance;
  };

  Model.host = "";

  if (typeof module !== "undefined" && module !== null) {
    module.exports = Model;
  }

}).call(this);

},{"./ajax":16,"./events":26,"./module":30}],29:[function(require,module,exports){
(function() {
  var Events, Model, Module, createObject, isArray, isBlank, makeArray,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __slice = [].slice;

  Events = require("./events");

  Module = require("./module");

  Model = (function(_super) {
    __extends(Model, _super);

    Model.extend(Events);

    Model.records = [];

    Model.irecords = {};

    Model.attributes = [];

    Model.host = "";

    Model.headers = [];

    Model.configure = function() {
      var attributes, name;
      name = arguments[0], attributes = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      this.className = name;
      this.deleteAll();
      if (attributes.length) {
        this.attributes = attributes;
      }
      this.attributes && (this.attributes = makeArray(this.attributes));
      this.attributes || (this.attributes = []);
      this.unbind();
      return this;
    };

    Model.toString = function() {
      return "" + this.className + "(" + (this.attributes.join(", ")) + ")";
    };

    Model.find = function(id) {
      var record;
      record = this.exists(id);
      if (!record) {
        throw new Error("\"" + this.className + "\" model could not find a record for the ID \"" + id + "\"");
      }
      return record;
    };

    Model.exists = function(id) {
      var _ref;
      return (_ref = this.irecords[id]) != null ? _ref.clone() : void 0;
    };

    Model.addRecord = function(record) {
      if (record.id && this.irecords[record.id]) {
        this.irecords[record.id].remove();
      }
      record.id || (record.id = record.cid);
      this.records.push(record);
      this.irecords[record.id] = record;
      return this.irecords[record.cid] = record;
    };

    Model.refresh = function(values, options) {
      var record, records, result, _i, _len;
      if (options == null) {
        options = {};
      }
      if (options.clear) {
        this.deleteAll();
      }
      records = this.fromJSON(values);
      if (!isArray(records)) {
        records = [records];
      }
      for (_i = 0, _len = records.length; _i < _len; _i++) {
        record = records[_i];
        this.addRecord(record);
      }
      this.sort();
      result = this.cloneArray(records);
      this.trigger('refresh', result, options);
      return result;
    };

    Model.select = function(callback) {
      var record, _i, _len, _ref, _results;
      _ref = this.records;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        record = _ref[_i];
        if (callback(record)) {
          _results.push(record.clone());
        }
      }
      return _results;
    };

    Model.findByAttribute = function(name, value) {
      var record, _i, _len, _ref;
      _ref = this.records;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        record = _ref[_i];
        if (record[name] === value) {
          return record.clone();
        }
      }
      return null;
    };

    Model.findAllByAttribute = function(name, value) {
      return this.select(function(item) {
        return item[name] === value;
      });
    };

    Model.each = function(callback) {
      var record, _i, _len, _ref, _results;
      _ref = this.records;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        record = _ref[_i];
        _results.push(callback(record.clone()));
      }
      return _results;
    };

    Model.all = function() {
      return this.cloneArray(this.records);
    };

    Model.first = function() {
      var _ref;
      return (_ref = this.records[0]) != null ? _ref.clone() : void 0;
    };

    Model.last = function() {
      var _ref;
      return (_ref = this.records[this.records.length - 1]) != null ? _ref.clone() : void 0;
    };

    Model.count = function() {
      return this.records.length;
    };

    Model.deleteAll = function() {
      this.records = [];
      return this.irecords = {};
    };

    Model.destroyAll = function(options) {
      var record, _i, _len, _ref, _results;
      _ref = this.records;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        record = _ref[_i];
        _results.push(record.destroy(options));
      }
      return _results;
    };

    Model.update = function(id, atts, options) {
      return this.find(id).updateAttributes(atts, options);
    };

    Model.create = function(atts, options) {
      var record;
      record = new this(atts);
      return record.save(options);
    };

    Model.destroy = function(id, options) {
      return this.find(id).destroy(options);
    };

    Model.change = function(callbackOrParams) {
      if (typeof callbackOrParams === 'function') {
        return this.bind('change', callbackOrParams);
      } else {
        return this.trigger.apply(this, ['change'].concat(__slice.call(arguments)));
      }
    };

    Model.fetch = function(callbackOrParams) {
      if (typeof callbackOrParams === 'function') {
        return this.bind('fetch', callbackOrParams);
      } else {
        return this.trigger.apply(this, ['fetch'].concat(__slice.call(arguments)));
      }
    };

    Model.toJSON = function() {
      return this.records;
    };

    Model.fromJSON = function(objects) {
      var value, _i, _len, _results;
      if (!objects) {
        return;
      }
      if (typeof objects === 'string') {
        objects.replace(/\Id/g, 'id');
        objects = JSON.parse(objects);
      }
      if (isArray(objects)) {
        _results = [];
        for (_i = 0, _len = objects.length; _i < _len; _i++) {
          value = objects[_i];
          if (value.Id) {
            value.id = value.Id;
          }
          _results.push(new this(value));
        }
        return _results;
      } else {
        if (objects.Id) {
          objects.id = objects.Id;
        }
        return new this(objects);
      }
    };

    Model.fromForm = function() {
      var _ref;
      return (_ref = new this).fromForm.apply(_ref, arguments);
    };

    Model.sort = function() {
      if (this.comparator) {
        this.records.sort(this.comparator);
      }
      return this;
    };

    Model.cloneArray = function(array) {
      var value, _i, _len, _results;
      _results = [];
      for (_i = 0, _len = array.length; _i < _len; _i++) {
        value = array[_i];
        _results.push(value.clone());
      }
      return _results;
    };

    Model.idCounter = 0;

    Model.uid = function(prefix) {
      var uid;
      if (prefix == null) {
        prefix = '';
      }
      uid = prefix + this.idCounter++;
      if (this.exists(uid)) {
        uid = this.uid(prefix);
      }
      return uid;
    };

    function Model(atts) {
      Model.__super__.constructor.apply(this, arguments);
      if (atts) {
        this.load(atts);
      }
      this.cid = (atts != null ? atts.cid : void 0) || this.constructor.uid('c-');
    }

    Model.prototype.isNew = function() {
      return !this.exists();
    };

    Model.prototype.isValid = function() {
      return !this.validate();
    };

    Model.prototype.validate = function() {};

    Model.prototype.load = function(atts) {
      var key, value;
      if (atts.id) {
        this.id = atts.id;
      }
      for (key in atts) {
        value = atts[key];
        if (atts.hasOwnProperty(key) && typeof this[key] === 'function') {
          this[key](value);
        } else {
          this[key] = value;
        }
      }
      return this;
    };

    Model.prototype.get = function(attr) {
      return this[attr];
    };

    Model.prototype.set = function(attr, value) {
      return this[attr] = value;
    };

    Model.prototype.attributes = function() {
      var key, result, _i, _len, _ref;
      result = {};
      _ref = this.constructor.attributes;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        key = _ref[_i];
        if (key in this) {
          if (typeof this[key] === 'function') {
            result[key] = this[key]();
          } else {
            result[key] = this[key];
          }
        }
      }
      if (this.id) {
        result.id = this.id;
      }
      return result;
    };

    Model.prototype.eql = function(rec) {
      return !!(rec && rec.constructor === this.constructor && (rec.cid === this.cid) || (rec.id && rec.id === this.id));
    };

    Model.prototype.save = function(options) {
      var error, record;
      if (options == null) {
        options = {};
      }
      if (options.validate !== false) {
        error = this.validate();
        if (error) {
          this.trigger('error', error);
          return false;
        }
      }
      this.trigger('beforeSave', options);
      record = this.isNew() ? this.create(options) : this.update(options);
      this.stripCloneAttrs();
      this.trigger('save', options);
      return record;
    };

    Model.prototype.stripCloneAttrs = function() {
      var key, value;
      if (this.hasOwnProperty('cid')) {
        return;
      }
      for (key in this) {
        if (!__hasProp.call(this, key)) continue;
        value = this[key];
        if (this.constructor.attributes.indexOf(key) > -1) {
          delete this[key];
        }
      }
      return this;
    };

    Model.prototype.updateAttribute = function(name, value, options) {
      var atts;
      atts = {};
      atts[name] = value;
      return this.updateAttributes(atts, options);
    };

    Model.prototype.updateAttributes = function(atts, options) {
      this.load(atts);
      return this.save(options);
    };

    Model.prototype.changeID = function(id) {
      var records;
      if (id === this.id) {
        return;
      }
      records = this.constructor.irecords;
      records[id] = records[this.id];
      delete records[this.id];
      this.id = id;
      return this.save();
    };

    Model.prototype.remove = function() {
      var i, record, records, _i, _len;
      records = this.constructor.records.slice(0);
      for (i = _i = 0, _len = records.length; _i < _len; i = ++_i) {
        record = records[i];
        if (!(this.eql(record))) {
          continue;
        }
        records.splice(i, 1);
        break;
      }
      this.constructor.records = records;
      delete this.constructor.irecords[this.id];
      return delete this.constructor.irecords[this.cid];
    };

    Model.prototype.destroy = function(options) {
      if (options == null) {
        options = {};
      }
      this.trigger('beforeDestroy', options);
      this.remove();
      this.destroyed = true;
      this.trigger('destroy', options);
      this.trigger('change', 'destroy', options);
      if (this.listeningTo) {
        this.stopListening();
      }
      this.unbind();
      return this;
    };

    Model.prototype.dup = function(newRecord) {
      var atts;
      if (newRecord == null) {
        newRecord = true;
      }
      atts = this.attributes();
      if (newRecord) {
        delete atts.id;
      } else {
        atts.cid = this.cid;
      }
      return new this.constructor(atts);
    };

    Model.prototype.clone = function() {
      return createObject(this);
    };

    Model.prototype.reload = function() {
      var original;
      if (this.isNew()) {
        return this;
      }
      original = this.constructor.find(this.id);
      this.load(original.attributes());
      return original;
    };

    Model.prototype.refresh = function(data) {
      var root;
      root = this.constructor.irecords[this.id];
      root.load(data);
      this.trigger('refresh');
      return this;
    };

    Model.prototype.toJSON = function() {
      return this.attributes();
    };

    Model.prototype.toString = function() {
      return "<" + this.constructor.className + " (" + (JSON.stringify(this)) + ")>";
    };

    Model.prototype.fromForm = function(form) {
      var result;
      result = {};

      /*      
      for checkbox in $(form).find('[type=checkbox]:not([value])')
        result[checkbox.name] = $(checkbox).prop('checked')
      
      for checkbox in $(form).find('[type=checkbox][name$="[]"]')
        name = checkbox.name.replace(/\[\]$/, '')
        result[name] or= []
        result[name].push checkbox.value if $(checkbox).prop('checked')
      
      for key in $(form).serializeArray()
        result[key.name] or= key.value
       */
      return this.load(result);
    };

    Model.prototype.exists = function() {
      return this.constructor.exists(this.id);
    };

    Model.prototype.update = function(options) {
      var clone, records;
      this.trigger('beforeUpdate', options);
      records = this.constructor.irecords;
      records[this.id].load(this.attributes());
      this.constructor.sort();
      clone = records[this.id].clone();
      clone.trigger('update', options);
      clone.trigger('change', 'update', options);
      return clone;
    };

    Model.prototype.create = function(options) {
      var clone, record;
      this.trigger('beforeCreate', options);
      this.id || (this.id = this.cid);
      record = this.dup(false);
      this.constructor.addRecord(record);
      this.constructor.sort();
      clone = record.clone();
      clone.trigger('create', options);
      clone.trigger('change', 'create', options);
      return clone;
    };

    Model.prototype.bind = function(events, callback) {
      var binder, singleEvent, _fn, _i, _len, _ref;
      this.constructor.bind(events, binder = (function(_this) {
        return function(record) {
          if (record && _this.eql(record)) {
            return callback.apply(_this, arguments);
          }
        };
      })(this));
      _ref = events.split(' ');
      _fn = (function(_this) {
        return function(singleEvent) {
          var unbinder;
          return _this.constructor.bind("unbind", unbinder = function(record, event, cb) {
            if (record && _this.eql(record)) {
              if (event && event !== singleEvent) {
                return;
              }
              if (cb && cb !== callback) {
                return;
              }
              _this.constructor.unbind(singleEvent, binder);
              return _this.constructor.unbind("unbind", unbinder);
            }
          });
        };
      })(this);
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        singleEvent = _ref[_i];
        _fn(singleEvent);
      }
      return this;
    };

    Model.prototype.one = function(events, callback) {
      var handler;
      return this.bind(events, handler = (function(_this) {
        return function() {
          _this.unbind(events, handler);
          return callback.apply(_this, arguments);
        };
      })(this));
    };

    Model.prototype.trigger = function() {
      var args, _ref;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      args.splice(1, 0, this);
      return (_ref = this.constructor).trigger.apply(_ref, args);
    };

    Model.prototype.listenTo = function() {
      return Events.listenTo.apply(this, arguments);
    };

    Model.prototype.listenToOnce = function() {
      return Events.listenToOnce.apply(this, arguments);
    };

    Model.prototype.stopListening = function() {
      return Events.stopListening.apply(this, arguments);
    };

    Model.prototype.unbind = function(events, callback) {
      var event, _i, _len, _ref, _results;
      if (arguments.length === 0) {
        return this.trigger('unbind');
      } else if (events) {
        _ref = events.split(' ');
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          event = _ref[_i];
          _results.push(this.trigger('unbind', event, callback));
        }
        return _results;
      }
    };

    return Model;

  })(Module);

  Model.prototype.on = Model.prototype.bind;

  Model.prototype.off = Model.prototype.unbind;

  createObject = Object.create || function(o) {
    var Func;
    Func = function() {};
    Func.prototype = o;
    return new Func();
  };

  isArray = function(value) {
    return Object.prototype.toString.call(value) === '[object Array]';
  };

  isBlank = function(value) {
    var key;
    if (!value) {
      return true;
    }
    for (key in value) {
      return false;
    }
    return true;
  };

  makeArray = function(args) {
    return Array.prototype.slice.call(args, 0);
  };

  Model.isBlank = isBlank;

  Model.sub = function(instances, statics) {
    var Result;
    Result = (function(_super) {
      __extends(Result, _super);

      function Result() {
        return Result.__super__.constructor.apply(this, arguments);
      }

      return Result;

    })(this);
    if (instances) {
      Result.include(instances);
    }
    if (statics) {
      Result.extend(statics);
    }
    if (typeof Result.unbind === "function") {
      Result.unbind();
    }
    return Result;
  };

  Model.setup = function(name, attributes) {
    var Instance;
    if (attributes == null) {
      attributes = [];
    }
    Instance = (function(_super) {
      __extends(Instance, _super);

      function Instance() {
        return Instance.__super__.constructor.apply(this, arguments);
      }

      return Instance;

    })(this);
    Instance.configure.apply(Instance, [name].concat(__slice.call(attributes)));
    return Instance;
  };

  Model.host = "";

  if (typeof module !== "undefined" && module !== null) {
    module.exports = Model;
  }

}).call(this);

},{"./events":26,"./module":30}],30:[function(require,module,exports){
(function() {
  var Module, moduleKeywords,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  moduleKeywords = ['included', 'extended'];

  Module = (function() {
    Module.include = function(obj) {
      var key, value, _ref;
      if (!obj) {
        throw new Error('include(obj) requires obj');
      }
      for (key in obj) {
        value = obj[key];
        if (__indexOf.call(moduleKeywords, key) < 0) {
          this.prototype[key] = value;
        }
      }
      if ((_ref = obj.included) != null) {
        _ref.apply(this);
      }
      return this;
    };

    Module.extend = function(obj) {
      var key, value, _ref;
      if (!obj) {
        throw new Error('extend(obj) requires obj');
      }
      for (key in obj) {
        value = obj[key];
        if (__indexOf.call(moduleKeywords, key) < 0) {
          this[key] = value;
        }
      }
      if ((_ref = obj.extended) != null) {
        _ref.apply(this);
      }
      return this;
    };

    Module.proxy = function(func) {
      return (function(_this) {
        return function() {
          return func.apply(_this, arguments);
        };
      })(this);
    };

    Module.prototype.proxy = function(func) {
      return (function(_this) {
        return function() {
          return func.apply(_this, arguments);
        };
      })(this);
    };

    function Module() {
      if (typeof this.init === "function") {
        this.init.apply(this, arguments);
      }
    }

    return Module;

  })();

  Module.create = Module.sub = function(instances, statics) {
    var Result;
    Result = (function(_super) {
      __extends(Result, _super);

      function Result() {
        return Result.__super__.constructor.apply(this, arguments);
      }

      return Result;

    })(this);
    if (instances) {
      Result.include(instances);
    }
    if (statics) {
      Result.extend(statics);
    }
    if (typeof Result.unbind === "function") {
      Result.unbind();
    }
    return Result;
  };

  module.exports = Module;

}).call(this);

},{}],31:[function(require,module,exports){
(function() {
  var AjaxRequest, AjaxUtils, Model;

  AjaxUtils = require("./ajax_utils");

  Model = require('./model');

  if (typeof threevot === 'undefined') {
    window.threevot = {};
    threevot.ThreeVotApiController = ThreeVotApiController;
  }

  AjaxRequest = (function() {
    function AjaxRequest() {}

    AjaxRequest.promise = {
      end: function() {}
    };

    AjaxRequest.enabled = true;

    AjaxRequest.disable = function(callback) {
      var e;
      if (this.enabled) {
        this.enabled = false;
        try {
          return callback();
        } catch (_error) {
          e = _error;
          throw e;
        } finally {
          this.enabled = true;
        }
      } else {
        return callback();
      }
    };

    AjaxRequest.queueRequest = {
      get: function(params, options) {
        return AjaxRequest.executeRestRequest("get", params, options);
      },
      post: function(params, options) {
        return AjaxRequest.executeRestRequest("post", params, options);
      },
      put: function(params, options) {
        return AjaxRequest.executeRestRequest("put", params, options);
      },
      del: function(params, options) {
        return AjaxRequest.executeRestRequest("del", params, options);
      }
    };

    AjaxRequest.executeRestRequest = function(type, params, options, model) {
      var fields, request, vfCall, _ref;
      if (this.enabled === false) {
        return this.promise;
      }
      options.url = options.url.replace(Model.host + "/", "/");
      if ((_ref = params.data) != null) {
        delete _ref.id;
      }
      vfCall = 'threevot.ThreeVotApiController.handleRest';
      fields = "{}";
      if (type === "put" || type === "post") {
        fields = JSON.stringify(params.data || "{}");
      }
      return request = {
        end: function(callback) {
          return Visualforce.remoting.Manager.invokeAction(vfCall, type, options.url, fields, function(result, event) {
            if (event.status) {
              if (type === "put" && result === null || (type === "del" && result === null)) {
                result = '{}';
              } else if (type !== "del" && type !== "put" && result === null) {
                return callback("Null return from action method");
              }
              result = JSON.parse(result);
              if (Array.isArray(result) && result.length > 0 && result[0].message && result[0].errorCode) {
                return callback(result[0].message);
              }
              if (result && result.message && result.errorCode) {
                return callback(result[0].message);
              }
              if (result) {
                delete result.errors;
              }
              if (result) {
                delete result.success;
              }
              return callback(null, {
                body: result
              });
            } else if (event.type === 'exception') {
              return callback(event.message);
            } else {
              return callback(event.message);
            }
          }, {
            escape: false
          });
        }
      };
    };

    return AjaxRequest;

  })();

  module.exports = AjaxRequest;

}).call(this);

},{"./ajax_utils":23,"./model":28}],32:[function(require,module,exports){
/**
 * Module dependencies.
 */

var Emitter = require('emitter');
var reduce = require('reduce');

/**
 * Root reference for iframes.
 */

var root = 'undefined' == typeof window
  ? this
  : window;

/**
 * Noop.
 */

function noop(){};

/**
 * Check if `obj` is a host object,
 * we don't want to serialize these :)
 *
 * TODO: future proof, move to compoent land
 *
 * @param {Object} obj
 * @return {Boolean}
 * @api private
 */

function isHost(obj) {
  var str = {}.toString.call(obj);

  switch (str) {
    case '[object File]':
    case '[object Blob]':
    case '[object FormData]':
      return true;
    default:
      return false;
  }
}

/**
 * Determine XHR.
 */

function getXHR() {
  if (root.XMLHttpRequest
    && ('file:' != root.location.protocol || !root.ActiveXObject)) {
    return new XMLHttpRequest;
  } else {
    try { return new ActiveXObject('Microsoft.XMLHTTP'); } catch(e) {}
    try { return new ActiveXObject('Msxml2.XMLHTTP.6.0'); } catch(e) {}
    try { return new ActiveXObject('Msxml2.XMLHTTP.3.0'); } catch(e) {}
    try { return new ActiveXObject('Msxml2.XMLHTTP'); } catch(e) {}
  }
  return false;
}

/**
 * Removes leading and trailing whitespace, added to support IE.
 *
 * @param {String} s
 * @return {String}
 * @api private
 */

var trim = ''.trim
  ? function(s) { return s.trim(); }
  : function(s) { return s.replace(/(^\s*|\s*$)/g, ''); };

/**
 * Check if `obj` is an object.
 *
 * @param {Object} obj
 * @return {Boolean}
 * @api private
 */

function isObject(obj) {
  return obj === Object(obj);
}

/**
 * Serialize the given `obj`.
 *
 * @param {Object} obj
 * @return {String}
 * @api private
 */

function serialize(obj) {
  if (!isObject(obj)) return obj;
  var pairs = [];
  for (var key in obj) {
    if (null != obj[key]) {
      pairs.push(encodeURIComponent(key)
        + '=' + encodeURIComponent(obj[key]));
    }
  }
  return pairs.join('&');
}

/**
 * Expose serialization method.
 */

 request.serializeObject = serialize;

 /**
  * Parse the given x-www-form-urlencoded `str`.
  *
  * @param {String} str
  * @return {Object}
  * @api private
  */

function parseString(str) {
  var obj = {};
  var pairs = str.split('&');
  var parts;
  var pair;

  for (var i = 0, len = pairs.length; i < len; ++i) {
    pair = pairs[i];
    parts = pair.split('=');
    obj[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1]);
  }

  return obj;
}

/**
 * Expose parser.
 */

request.parseString = parseString;

/**
 * Default MIME type map.
 *
 *     superagent.types.xml = 'application/xml';
 *
 */

request.types = {
  html: 'text/html',
  json: 'application/json',
  xml: 'application/xml',
  urlencoded: 'application/x-www-form-urlencoded',
  'form': 'application/x-www-form-urlencoded',
  'form-data': 'application/x-www-form-urlencoded'
};

/**
 * Default serialization map.
 *
 *     superagent.serialize['application/xml'] = function(obj){
 *       return 'generated xml here';
 *     };
 *
 */

 request.serialize = {
   'application/x-www-form-urlencoded': serialize,
   'application/json': JSON.stringify
 };

 /**
  * Default parsers.
  *
  *     superagent.parse['application/xml'] = function(str){
  *       return { object parsed from str };
  *     };
  *
  */

request.parse = {
  'application/x-www-form-urlencoded': parseString,
  'application/json': JSON.parse
};

/**
 * Parse the given header `str` into
 * an object containing the mapped fields.
 *
 * @param {String} str
 * @return {Object}
 * @api private
 */

function parseHeader(str) {
  var lines = str.split(/\r?\n/);
  var fields = {};
  var index;
  var line;
  var field;
  var val;

  lines.pop(); // trailing CRLF

  for (var i = 0, len = lines.length; i < len; ++i) {
    line = lines[i];
    index = line.indexOf(':');
    field = line.slice(0, index).toLowerCase();
    val = trim(line.slice(index + 1));
    fields[field] = val;
  }

  return fields;
}

/**
 * Return the mime type for the given `str`.
 *
 * @param {String} str
 * @return {String}
 * @api private
 */

function type(str){
  return str.split(/ *; */).shift();
};

/**
 * Return header field parameters.
 *
 * @param {String} str
 * @return {Object}
 * @api private
 */

function params(str){
  return reduce(str.split(/ *; */), function(obj, str){
    var parts = str.split(/ *= */)
      , key = parts.shift()
      , val = parts.shift();

    if (key && val) obj[key] = val;
    return obj;
  }, {});
};

/**
 * Initialize a new `Response` with the given `xhr`.
 *
 *  - set flags (.ok, .error, etc)
 *  - parse header
 *
 * Examples:
 *
 *  Aliasing `superagent` as `request` is nice:
 *
 *      request = superagent;
 *
 *  We can use the promise-like API, or pass callbacks:
 *
 *      request.get('/').end(function(res){});
 *      request.get('/', function(res){});
 *
 *  Sending data can be chained:
 *
 *      request
 *        .post('/user')
 *        .send({ name: 'tj' })
 *        .end(function(res){});
 *
 *  Or passed to `.send()`:
 *
 *      request
 *        .post('/user')
 *        .send({ name: 'tj' }, function(res){});
 *
 *  Or passed to `.post()`:
 *
 *      request
 *        .post('/user', { name: 'tj' })
 *        .end(function(res){});
 *
 * Or further reduced to a single call for simple cases:
 *
 *      request
 *        .post('/user', { name: 'tj' }, function(res){});
 *
 * @param {XMLHTTPRequest} xhr
 * @param {Object} options
 * @api private
 */

function Response(req, options) {
  options = options || {};
  this.req = req;
  this.xhr = this.req.xhr;
  this.text = this.xhr.responseText;
  this.setStatusProperties(this.xhr.status);
  this.header = this.headers = parseHeader(this.xhr.getAllResponseHeaders());
  // getAllResponseHeaders sometimes falsely returns "" for CORS requests, but
  // getResponseHeader still works. so we get content-type even if getting
  // other headers fails.
  this.header['content-type'] = this.xhr.getResponseHeader('content-type');
  this.setHeaderProperties(this.header);
  this.body = this.req.method != 'HEAD'
    ? this.parseBody(this.text)
    : null;
}

/**
 * Get case-insensitive `field` value.
 *
 * @param {String} field
 * @return {String}
 * @api public
 */

Response.prototype.get = function(field){
  return this.header[field.toLowerCase()];
};

/**
 * Set header related properties:
 *
 *   - `.type` the content type without params
 *
 * A response of "Content-Type: text/plain; charset=utf-8"
 * will provide you with a `.type` of "text/plain".
 *
 * @param {Object} header
 * @api private
 */

Response.prototype.setHeaderProperties = function(header){
  // content-type
  var ct = this.header['content-type'] || '';
  this.type = type(ct);

  // params
  var obj = params(ct);
  for (var key in obj) this[key] = obj[key];
};

/**
 * Parse the given body `str`.
 *
 * Used for auto-parsing of bodies. Parsers
 * are defined on the `superagent.parse` object.
 *
 * @param {String} str
 * @return {Mixed}
 * @api private
 */

Response.prototype.parseBody = function(str){
  var parse = request.parse[this.type];
  return parse
    ? parse(str)
    : null;
};

/**
 * Set flags such as `.ok` based on `status`.
 *
 * For example a 2xx response will give you a `.ok` of __true__
 * whereas 5xx will be __false__ and `.error` will be __true__. The
 * `.clientError` and `.serverError` are also available to be more
 * specific, and `.statusType` is the class of error ranging from 1..5
 * sometimes useful for mapping respond colors etc.
 *
 * "sugar" properties are also defined for common cases. Currently providing:
 *
 *   - .noContent
 *   - .badRequest
 *   - .unauthorized
 *   - .notAcceptable
 *   - .notFound
 *
 * @param {Number} status
 * @api private
 */

Response.prototype.setStatusProperties = function(status){
  var type = status / 100 | 0;

  // status / class
  this.status = status;
  this.statusType = type;

  // basics
  this.info = 1 == type;
  this.ok = 2 == type;
  this.clientError = 4 == type;
  this.serverError = 5 == type;
  this.error = (4 == type || 5 == type)
    ? this.toError()
    : false;

  // sugar
  this.accepted = 202 == status;
  this.noContent = 204 == status || 1223 == status;
  this.badRequest = 400 == status;
  this.unauthorized = 401 == status;
  this.notAcceptable = 406 == status;
  this.notFound = 404 == status;
  this.forbidden = 403 == status;
};

/**
 * Return an `Error` representative of this response.
 *
 * @return {Error}
 * @api public
 */

Response.prototype.toError = function(){
  var req = this.req;
  var method = req.method;
  var path = req.path;

  var msg = 'cannot ' + method + ' ' + path + ' (' + this.status + ')';
  var err = new Error(msg);
  err.status = this.status;
  err.method = method;
  err.path = path;

  return err;
};

/**
 * Expose `Response`.
 */

request.Response = Response;

/**
 * Initialize a new `Request` with the given `method` and `url`.
 *
 * @param {String} method
 * @param {String} url
 * @api public
 */

function Request(method, url) {
  var self = this;
  Emitter.call(this);
  this._query = this._query || [];
  this.method = method;
  this.url = url;
  this.header = {};
  this._header = {};
  this.on('end', function(){
    var res = new Response(self);
    if ('HEAD' == method) res.text = null;
    self.callback(null, res);
  });
}

/**
 * Mixin `Emitter`.
 */

Emitter(Request.prototype);

/**
 * Set timeout to `ms`.
 *
 * @param {Number} ms
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.timeout = function(ms){
  this._timeout = ms;
  return this;
};

/**
 * Clear previous timeout.
 *
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.clearTimeout = function(){
  this._timeout = 0;
  clearTimeout(this._timer);
  return this;
};

/**
 * Abort the request, and clear potential timeout.
 *
 * @return {Request}
 * @api public
 */

Request.prototype.abort = function(){
  if (this.aborted) return;
  this.aborted = true;
  this.xhr.abort();
  this.clearTimeout();
  this.emit('abort');
  return this;
};

/**
 * Set header `field` to `val`, or multiple fields with one object.
 *
 * Examples:
 *
 *      req.get('/')
 *        .set('Accept', 'application/json')
 *        .set('X-API-Key', 'foobar')
 *        .end(callback);
 *
 *      req.get('/')
 *        .set({ Accept: 'application/json', 'X-API-Key': 'foobar' })
 *        .end(callback);
 *
 * @param {String|Object} field
 * @param {String} val
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.set = function(field, val){
  if (isObject(field)) {
    for (var key in field) {
      this.set(key, field[key]);
    }
    return this;
  }
  this._header[field.toLowerCase()] = val;
  this.header[field] = val;
  return this;
};

/**
 * Get case-insensitive header `field` value.
 *
 * @param {String} field
 * @return {String}
 * @api private
 */

Request.prototype.getHeader = function(field){
  return this._header[field.toLowerCase()];
};

/**
 * Set Content-Type to `type`, mapping values from `request.types`.
 *
 * Examples:
 *
 *      superagent.types.xml = 'application/xml';
 *
 *      request.post('/')
 *        .type('xml')
 *        .send(xmlstring)
 *        .end(callback);
 *
 *      request.post('/')
 *        .type('application/xml')
 *        .send(xmlstring)
 *        .end(callback);
 *
 * @param {String} type
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.type = function(type){
  this.set('Content-Type', request.types[type] || type);
  return this;
};

/**
 * Set Accept to `type`, mapping values from `request.types`.
 *
 * Examples:
 *
 *      superagent.types.json = 'application/json';
 *
 *      request.get('/agent')
 *        .accept('json')
 *        .end(callback);
 *
 *      request.get('/agent')
 *        .accept('application/json')
 *        .end(callback);
 *
 * @param {String} accept
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.accept = function(type){
  this.set('Accept', request.types[type] || type);
  return this;
};

/**
 * Set Authorization field value with `user` and `pass`.
 *
 * @param {String} user
 * @param {String} pass
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.auth = function(user, pass){
  var str = btoa(user + ':' + pass);
  this.set('Authorization', 'Basic ' + str);
  return this;
};

/**
* Add query-string `val`.
*
* Examples:
*
*   request.get('/shoes')
*     .query('size=10')
*     .query({ color: 'blue' })
*
* @param {Object|String} val
* @return {Request} for chaining
* @api public
*/

Request.prototype.query = function(val){
  if ('string' != typeof val) val = serialize(val);
  if (val) this._query.push(val);
  return this;
};

/**
 * Send `data`, defaulting the `.type()` to "json" when
 * an object is given.
 *
 * Examples:
 *
 *       // querystring
 *       request.get('/search')
 *         .end(callback)
 *
 *       // multiple data "writes"
 *       request.get('/search')
 *         .send({ search: 'query' })
 *         .send({ range: '1..5' })
 *         .send({ order: 'desc' })
 *         .end(callback)
 *
 *       // manual json
 *       request.post('/user')
 *         .type('json')
 *         .send('{"name":"tj"})
 *         .end(callback)
 *
 *       // auto json
 *       request.post('/user')
 *         .send({ name: 'tj' })
 *         .end(callback)
 *
 *       // manual x-www-form-urlencoded
 *       request.post('/user')
 *         .type('form')
 *         .send('name=tj')
 *         .end(callback)
 *
 *       // auto x-www-form-urlencoded
 *       request.post('/user')
 *         .type('form')
 *         .send({ name: 'tj' })
 *         .end(callback)
 *
 *       // defaults to x-www-form-urlencoded
  *      request.post('/user')
  *        .send('name=tobi')
  *        .send('species=ferret')
  *        .end(callback)
 *
 * @param {String|Object} data
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.send = function(data){
  var obj = isObject(data);
  var type = this.getHeader('Content-Type');

  // merge
  if (obj && isObject(this._data)) {
    for (var key in data) {
      this._data[key] = data[key];
    }
  } else if ('string' == typeof data) {
    if (!type) this.type('form');
    type = this.getHeader('Content-Type');
    if ('application/x-www-form-urlencoded' == type) {
      this._data = this._data
        ? this._data + '&' + data
        : data;
    } else {
      this._data = (this._data || '') + data;
    }
  } else {
    this._data = data;
  }

  if (!obj) return this;
  if (!type) this.type('json');
  return this;
};

/**
 * Invoke the callback with `err` and `res`
 * and handle arity check.
 *
 * @param {Error} err
 * @param {Response} res
 * @api private
 */

Request.prototype.callback = function(err, res){
  var fn = this._callback;
  if (2 == fn.length) return fn(err, res);
  if (err) return this.emit('error', err);
  fn(res);
};

/**
 * Invoke callback with x-domain error.
 *
 * @api private
 */

Request.prototype.crossDomainError = function(){
  var err = new Error('Origin is not allowed by Access-Control-Allow-Origin');
  err.crossDomain = true;
  this.callback(err);
};

/**
 * Invoke callback with timeout error.
 *
 * @api private
 */

Request.prototype.timeoutError = function(){
  var timeout = this._timeout;
  var err = new Error('timeout of ' + timeout + 'ms exceeded');
  err.timeout = timeout;
  this.callback(err);
};

/**
 * Enable transmission of cookies with x-domain requests.
 *
 * Note that for this to work the origin must not be
 * using "Access-Control-Allow-Origin" with a wildcard,
 * and also must set "Access-Control-Allow-Credentials"
 * to "true".
 *
 * @api public
 */

Request.prototype.withCredentials = function(){
  this._withCredentials = true;
  return this;
};

/**
 * Initiate request, invoking callback `fn(res)`
 * with an instanceof `Response`.
 *
 * @param {Function} fn
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.end = function(fn){
  var self = this;
  var xhr = this.xhr = getXHR();
  var query = this._query.join('&');
  var timeout = this._timeout;
  var data = this._data;

  // store callback
  this._callback = fn || noop;

  // state change
  xhr.onreadystatechange = function(){
    if (4 != xhr.readyState) return;
    if (0 == xhr.status) {
      if (self.aborted) return self.timeoutError();
      return self.crossDomainError();
    }
    self.emit('end');
  };

  // progress
  if (xhr.upload) {
    xhr.upload.onprogress = function(e){
      e.percent = e.loaded / e.total * 100;
      self.emit('progress', e);
    };
  }

  // timeout
  if (timeout && !this._timer) {
    this._timer = setTimeout(function(){
      self.abort();
    }, timeout);
  }

  // querystring
  if (query) {
    query = request.serializeObject(query);
    this.url += ~this.url.indexOf('?')
      ? '&' + query
      : '?' + query;
  }

  // initiate request
  xhr.open(this.method, this.url, true);

  // CORS
  if (this._withCredentials) xhr.withCredentials = true;

  // body
  if ('GET' != this.method && 'HEAD' != this.method && 'string' != typeof data && !isHost(data)) {
    // serialize stuff
    var serialize = request.serialize[this.getHeader('Content-Type')];
    if (serialize) data = serialize(data);
  }

  // set header fields
  for (var field in this.header) {
    if (null == this.header[field]) continue;
    xhr.setRequestHeader(field, this.header[field]);
  }

  // send stuff
  xhr.send(data);
  return this;
};

/**
 * Expose `Request`.
 */

request.Request = Request;

/**
 * Issue a request:
 *
 * Examples:
 *
 *    request('GET', '/users').end(callback)
 *    request('/users').end(callback)
 *    request('/users', callback)
 *
 * @param {String} method
 * @param {String|Function} url or callback
 * @return {Request}
 * @api public
 */

function request(method, url) {
  // callback
  if ('function' == typeof url) {
    return new Request('GET', method).end(url);
  }

  // url first
  if (1 == arguments.length) {
    return new Request('GET', method);
  }

  return new Request(method, url);
}

/**
 * GET `url` with optional callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed|Function} data or fn
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.get = function(url, data, fn){
  var req = request('GET', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.query(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * HEAD `url` with optional callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed|Function} data or fn
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.head = function(url, data, fn){
  var req = request('HEAD', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * DELETE `url` with optional callback `fn(res)`.
 *
 * @param {String} url
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.del = function(url, fn){
  var req = request('DELETE', url);
  if (fn) req.end(fn);
  return req;
};

/**
 * PATCH `url` with optional `data` and callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed} data
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.patch = function(url, data, fn){
  var req = request('PATCH', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * POST `url` with optional `data` and callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed} data
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.post = function(url, data, fn){
  var req = request('POST', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * PUT `url` with optional `data` and callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed|Function} data or fn
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.put = function(url, data, fn){
  var req = request('PUT', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * Expose `request`.
 */

module.exports = request;

},{"emitter":33,"reduce":34}],33:[function(require,module,exports){

/**
 * Expose `Emitter`.
 */

module.exports = Emitter;

/**
 * Initialize a new `Emitter`.
 *
 * @api public
 */

function Emitter(obj) {
  if (obj) return mixin(obj);
};

/**
 * Mixin the emitter properties.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

function mixin(obj) {
  for (var key in Emitter.prototype) {
    obj[key] = Emitter.prototype[key];
  }
  return obj;
}

/**
 * Listen on the given `event` with `fn`.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.on = function(event, fn){
  this._callbacks = this._callbacks || {};
  (this._callbacks[event] = this._callbacks[event] || [])
    .push(fn);
  return this;
};

/**
 * Adds an `event` listener that will be invoked a single
 * time then automatically removed.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.once = function(event, fn){
  var self = this;
  this._callbacks = this._callbacks || {};

  function on() {
    self.off(event, on);
    fn.apply(this, arguments);
  }

  fn._off = on;
  this.on(event, on);
  return this;
};

/**
 * Remove the given callback for `event` or all
 * registered callbacks.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.off =
Emitter.prototype.removeListener =
Emitter.prototype.removeAllListeners = function(event, fn){
  this._callbacks = this._callbacks || {};

  // all
  if (0 == arguments.length) {
    this._callbacks = {};
    return this;
  }

  // specific event
  var callbacks = this._callbacks[event];
  if (!callbacks) return this;

  // remove all handlers
  if (1 == arguments.length) {
    delete this._callbacks[event];
    return this;
  }

  // remove specific handler
  var i = callbacks.indexOf(fn._off || fn);
  if (~i) callbacks.splice(i, 1);
  return this;
};

/**
 * Emit `event` with the given args.
 *
 * @param {String} event
 * @param {Mixed} ...
 * @return {Emitter}
 */

Emitter.prototype.emit = function(event){
  this._callbacks = this._callbacks || {};
  var args = [].slice.call(arguments, 1)
    , callbacks = this._callbacks[event];

  if (callbacks) {
    callbacks = callbacks.slice(0);
    for (var i = 0, len = callbacks.length; i < len; ++i) {
      callbacks[i].apply(this, args);
    }
  }

  return this;
};

/**
 * Return array of callbacks for `event`.
 *
 * @param {String} event
 * @return {Array}
 * @api public
 */

Emitter.prototype.listeners = function(event){
  this._callbacks = this._callbacks || {};
  return this._callbacks[event] || [];
};

/**
 * Check if this emitter has `event` handlers.
 *
 * @param {String} event
 * @return {Boolean}
 * @api public
 */

Emitter.prototype.hasListeners = function(event){
  return !! this.listeners(event).length;
};

},{}],34:[function(require,module,exports){

/**
 * Reduce `arr` with `fn`.
 *
 * @param {Array} arr
 * @param {Function} fn
 * @param {Mixed} initial
 *
 * TODO: combatible error handling?
 */

module.exports = function(arr, fn, initial){  
  var idx = 0;
  var len = arr.length;
  var curr = arguments.length == 3
    ? initial
    : arr[idx++];

  while (idx < len) {
    curr = fn.call(null, curr, arr[idx], ++idx, arr);
  }
  
  return curr;
};
},{}],35:[function(require,module,exports){

/**
 * Expose `parse`.
 */

module.exports = parse;

/**
 * Tests for browser support.
 */

var div = document.createElement('div');
// Setup
div.innerHTML = '  <link/><table></table><a href="/a">a</a><input type="checkbox"/>';
// Make sure that link elements get serialized correctly by innerHTML
// This requires a wrapper element in IE
var innerHTMLBug = !div.getElementsByTagName('link').length;
div = undefined;

/**
 * Wrap map from jquery.
 */

var map = {
  legend: [1, '<fieldset>', '</fieldset>'],
  tr: [2, '<table><tbody>', '</tbody></table>'],
  col: [2, '<table><tbody></tbody><colgroup>', '</colgroup></table>'],
  // for script/link/style tags to work in IE6-8, you have to wrap
  // in a div with a non-whitespace character in front, ha!
  _default: innerHTMLBug ? [1, 'X<div>', '</div>'] : [0, '', '']
};

map.td =
map.th = [3, '<table><tbody><tr>', '</tr></tbody></table>'];

map.option =
map.optgroup = [1, '<select multiple="multiple">', '</select>'];

map.thead =
map.tbody =
map.colgroup =
map.caption =
map.tfoot = [1, '<table>', '</table>'];

map.text =
map.circle =
map.ellipse =
map.line =
map.path =
map.polygon =
map.polyline =
map.rect = [1, '<svg xmlns="http://www.w3.org/2000/svg" version="1.1">','</svg>'];

/**
 * Parse `html` and return a DOM Node instance, which could be a TextNode,
 * HTML DOM Node of some kind (<div> for example), or a DocumentFragment
 * instance, depending on the contents of the `html` string.
 *
 * @param {String} html - HTML string to "domify"
 * @param {Document} doc - The `document` instance to create the Node for
 * @return {DOMNode} the TextNode, DOM Node, or DocumentFragment instance
 * @api private
 */

function parse(html, doc) {
  if ('string' != typeof html) throw new TypeError('String expected');

  // default to the global `document` object
  if (!doc) doc = document;

  // tag name
  var m = /<([\w:]+)/.exec(html);
  if (!m) return doc.createTextNode(html);

  html = html.replace(/^\s+|\s+$/g, ''); // Remove leading/trailing whitespace

  var tag = m[1];

  // body support
  if (tag == 'body') {
    var el = doc.createElement('html');
    el.innerHTML = html;
    return el.removeChild(el.lastChild);
  }

  // wrap map
  var wrap = map[tag] || map._default;
  var depth = wrap[0];
  var prefix = wrap[1];
  var suffix = wrap[2];
  var el = doc.createElement('div');
  el.innerHTML = prefix + html + suffix;
  while (depth--) el = el.lastChild;

  // one element
  if (el.firstChild == el.lastChild) {
    return el.removeChild(el.firstChild);
  }

  // several elements
  var fragment = doc.createDocumentFragment();
  while (el.firstChild) {
    fragment.appendChild(el.removeChild(el.firstChild));
  }

  return fragment;
}

},{}]},{},[15])