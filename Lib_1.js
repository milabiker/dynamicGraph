// TODO 
// - widzimi tylko aktualne dane
// - oś pozioma to czas, zakladamy wykresu zalezne czasowo 
// - log zeby dostac rzad wielkosci

// [ 1,2,2.5,5,10] - lista naszych dostepnych wartosci na osi, trzeba ja przenożyc w zaleznosci od rzedu max wartosci
//  i znalesc najblizsza wartosc wynikowi działania maxValue/yAxisTicks

// feautres 
//  -- dać uzytkownikowi możliwość tworzenia templatów wygladu wykresu (Elycharts)
// 	-- każda wartość powinna mieć swoją labelke, zastanwić sie jak je wyświetlać, uzytkownik powinien miec mozliwosc
//		ustawienia ile labalek powinno byc w polu wykresu 
		/*series = { 	seria_1 : { values : [10.1, 10.5, 10.8, 9.50], labels : ['2000','2001','2002','2003']}, 
						seria_2 : { values : [9.50, 10, 9.2, 9.8,],    labels : ['2001','2002','2003','2004']}   
					};*/

		// ACTUAL format of data
		// series = {
		// 	"seria_1" : [
		// 					{ value: 0.632, timestamp : 12:41 ( in milis)},
		// 					{ value: 0.782, timestamp : 12:42},
		// 					{ value: 0.832, timestamp : 12:43},
		// 				],
		// 	"seria_2" : [
		// 					{ value: 0.632, timestamp : 12:41},
		// 					{ value: 0.782, timestamp : 12:42},
		// 					{ value: 0.832, timestamp : 12:43},
		// 				],
		// }
// -------------- settings -----------------
//	#graphArea
//		grid : true/false,
//		horizontal_grid: true/false,
//		vertical_grid: true/false,
//		horizontal_labels:true,
//		vertical_labels:true,
//		labels_color: '#eee',
//		horizontal_unit: '' (km/h),
//		background_color: '#222',
//		grid_color: 'blue',
//		marker : 'false/circle/square',
//		marker_size: 5,
//		draw_axis: true,
//		label_rotation: 0,
//		label_size:10,
//		ticks : 10,
//	#titleArea
// 		title : 'title',
// 		title_size : 5,
// 		title_color : green,


// |SVGDynamicGraph |
// ----- | svg |
// |GraphManager|
// ----- | _svgManager |
// ----- | GraphArea |
// 		---- | drawBackground()|
//		---- | calculate gridLines()|
//		---- | drawAxes() |
//		---- | calculateSteps() |
//		---- | _xAxis |
//
// ----- | TitleArea |
//		---- | _owningGraph |
//		---- | drawTitle()|
// 		---- |getText()|
//		---- |setText()|

// ----- | LegendArea|
//		---- | _owningGrap |
//		---- | show() |
//		---- |

// ----- | calculateScale() |
// ----- | setCallback() |
// ----- | 

// |LineGraph|
// ----- |_svgManager|


//###################

// callback schema
    // {
    // 	getnewdata()
    // 	chartType.drawSeries()
    // 	charttype.moveArea () ?// wonder whether it will be needed in all graph types
    // }

//###################
(function($){
	$.fn.SVGDynamicGraph_1 = function(chartId, width, height, settings){
		var charttype = CHARTTYPES[chartId];
		if(charttype){
			console.log("LineGraph...");
			this.graphManager = new GraphManager(this, charttype, width,height, settings);
			charttype.initialize(this.graphManager);
			return this.graphManager;
		}else{
			console.error('SVGDynamincGraph: Wrong chart type');
		}
	};
//===============================================================================================================
//========================================== Graph Manager ======================================================

function GraphManager(element, charttype, width, height, settings){
	this.defaultSettings = {
		grid : true,//false
		horizontal_grid: true,//false
		vertical_grid: true,//false
		horizontal_labels:true,
		vertical_labels:true,
		labels_color: '#eee',
		horizontal_unit: '', //(km/h),
		background_color: '#222',
		grid_color: 'blue',
		marker : 'false',//circle/square',
		marker_size: 5,
		draw_axis: true,
		label_rotation: 90,
		label_size:10,
		ticks : 10, // TODO change to time (e.g from last 2h)
		timePeriod : 1000*60, // (in milis)
		name : $(element).attr('id')
	}
	//===================
	// attaching svg 
	$(element).svg({settings : { width: width, height : height}});
	mysvg = $(element).svg('get');
	//===================
	mysvg._container = mysvg._svg;
	this.svgManager = mysvg;
	this.charttype = charttype;
	this.settings = $.extend({}, this.defaultSettings, settings);
	// TODO------- set up legend or title visible (temporary) ---------------------
	this.isLegend = true;
	this.isTitle = true;
	//-----------------
	this._series = [];
	// TODO remove after tests
	//this._printSeries();

	this._currentTimelineDate = 0;
	this._xAxisDateTimeRange;
	this._setDateTimeRange();
	this._xAxis = new Axis(this,this.settings.ticks);
	this._yAxis = new Axis(this,5);
	this.regions = {
		'legend':{ x : { fromX: 0.0, toX: 0.2}, y : { fromY: 0.0, toY: 1.0 } },
		'title': { x : { fromX: 0.2, toX: 1.0}, y : { fromY: 0.0, toY: 0.1 } },
		'graph': { x : { fromX: 0.2, toX: 1.0}, y : { fromY: 0.1, toY: 1.0 } }
		};
	// defining defs , it must be at the begining of svg elements
	this._defineDefs();
	if(this.isTitle){
		this._titleArea = new TitleArea(this);
	}
	if(this.isLegend){
		this._lagendArea = new LegendArea(this);
	}
	this._graphArea = new GraphArea(this);
	
}
$.extend(GraphManager.prototype,{
	_getRegionWidthRatio : function _getRegionWidthRatio(regionName){
		return this.regions[regionName].x.toX - this.regions[regionName].x.fromX;
	},
	_getRegionHeightRatio : function _getRegionHeightRatio(regionName){
		return this.regions[regionName].y.toY - this.regions[regionName].y.fromY;
	},
	draw: function(){
		if(this.isTitle){
			this._titleArea._draw();
		}
		if(this.isLegend){
			this._lagendArea._draw();
		}
		this._graphArea._draw();
		/*======= invoke chart drawing ==========*/
		this.charttype.draw(this._graphArea);

		this.callback();

		/* returning this to be able to use it after other SVGDynamicGraph function */		
		return this;
	},
	_defineDefs : function(){
		var defs = this.svgManager.defs(this.settings.name + '_defs');
		var gridlines = this.svgManager.pattern(defs, "gridLines", 0,0,200,100, 0,0,100,50, {patternUnits: 'userSpaceOnUse'});
		var line1 = this.svgManager.line(gridlines, 0,0,100,0,{strokeDashArray:"2,2", stroke:"green", strokeOpacity:0.7,	 strokeWidth:1});
		var line2 = this.svgManager.line(gridlines, 0,0,0,100,{strokeDashArray:"2,2", stroke:"green", strokeOpacity:0.4, strokeWidth:1});

		var marker = this.svgManager.marker( defs, 'circles', 8, 8, 15, 15, 'auto',{ markerUnits:"strokeWidth"});
		var markerCircle = this.svgManager.circle(marker, 8,8,2, {fill:"white", stroke:'red', strokeWidth:'1'});

	},	
	/**
	*  _addSeries(dataSeries)
	* Function to add new series or update existing with new values
	* @param DataSeries - object literal (JSON) with new values	
	*/
	_addSeries : function(dataSeries){
		
		var numberOfNewValuesToDrawInSeries = {};
		for( key in dataSeries){
			if(dataSeries.hasOwnProperty(key)){
				var series = this._getSeriesByName(key);

				if(series != undefined){
					series.update(dataSeries[key]);
				}else{
					//console.log("dataSeries[key] = " + dataSeries[key] + "name: " + key + "fisrt value = " + dataSeries[key][1].value);
					this._series.push(new DataSeries(dataSeries[key],key));
				}
				var tmp = {};
				tmp[key] = dataSeries[key].length;
				$.extend(numberOfNewValuesToDrawInSeries,tmp);
			}
		}
		return numberOfNewValuesToDrawInSeries;
	},
	// TODO
	callback : function(){
		console.log("Standard callback");
		var inst = this;
		var counter = 0; // temporary var to stop interval
		//self.setInterval(function(){inst.charttype.draw(inst._graphArea);},1000);
		var name = self.setInterval(function(){

			// TODO ## Temoporary !
			inst._currentTimelineDate = new Date(111111111).getTime();
			console.log("_currentTimelineDate from callback = " + inst._currentTimelineDate );
			var numberOfNewValues = inst._addSeries(TestData(30,1, inst._currentTimelineDate));
			//inst._printSeries();
			console.log(" _currentTimelineDate " + inst._getCurrentTimelineDate());
			inst.charttype.refreshGraph(inst._graphArea, numberOfNewValues);
			counter++;
				console.log("interval name " + name);
			if(counter >= 1){
				clearInterval(name);
			}
		},2000);
		return this;
	},
	setCallback : function(obj){
		this.callback = obj;
		return this;
	},
	_getCurrentTimelineDate : function(){
		return this._currentTimelineDate;
	},
	_getMaxValueFromSeries: function(){
		var arrayOfMaxValues = [];
		for (var i = this._series.length; i--;) {
			//TODO remove in final version
			//console.log(this._series[i].getName() + ' maxValue = ' + this._series[i].getMaxValue());
			arrayOfMaxValues.push(this._series[i].getMaxValue());
		}
		// for( key in this._series){
		// 	if(this._series.hasOwnProperty(key)){
		// 		arrayOfMaxValues.push(this._series[key].getMaxValue());
		// 	}
		// }
		return arrayOfMaxValues.length != 0 ? Math.max.apply(Math,arrayOfMaxValues) : undefined;
	},
	_getDateOfLastUpdateFromAllSeries: function(){
		var arrayOfDates = [];
		for (var i = this._series.length; i--;) {
			arrayOfDates.push(this._series[i].getDateoFLastMeasurment());
		}
		return arrayOfDates.length != 0 ? Math.max.apply(Math,arrayOfDates) : undefined;
	},
	_printSeries:function(){
		for(var i=0, l=this._series.length; i<l; i++){
			console.log("Name : " + this._series[i].getName());
			var measurements = this._series[i].getMeasurmentsToDraw(-1);
			console.log("Measurements :");
			for(var j=0, len=measurements.length; j<len; j++){
				console.log(j+ " Value = " + measurements[j].value + " Timestamp = " + measurements[j].timestamp);
			}
		}
	},
	_containSeries : function(name, array) {
	    var i = array.length;
	    while (i--) {
	        if (array[i].name() == name) {
	            return true;
	        }
	        // console.log(key + "not found");
	    }
    	return false;
	},
	/**
	* Function to search series in Array by name
	* @param name of searched series
	* @return DataSeries object or none 
	*/
	_getSeriesByName : function(name){
		if(this._getSeriesByName.cache == undefined){
			console.log(">_getSeriesByName || defining cache ");
			this._getSeriesByName.cache = {};
		}
		if(this._getSeriesByName.cache[name]){
			console.log(">_getSeriesByName || cache is true for name " + name);
			return this._series[this._getSeriesByName.cache[name]];
		}else{
			for (var i = this._series.length; i--;) {
				if(this._series[i].getName() == name){
					this._getSeriesByName.cache[name] = i;
					console.log(">_getSeriesByName || Series name : " + this._series[i].getName());
					return this._series[this._getSeriesByName.cache[name]];
				}
			}			
		}
	},
	_setDateTimeRange : function(){
		var current = (new Date()).getTime();
		var begining = (new Date(current - this.settings.timePeriod)).getTime();
		this._xAxisDateTimeRange = Math.abs(current - begining);
	} 

});

//===============================================================================================================
//=============================================== Graph Area =======================================================
function GraphArea(graphManager){
	this.svgManager = graphManager.svgManager;
	this.graphManager = graphManager;
	this.padding = 0.1;
	this.paddingLeft=0.1;
	this.paddingRight = 0.01;
	this.paddingBottom = 0.1;
	this.paddingTop = 0.01;
};
$.extend(GraphArea.prototype,{
	_draw: function(){
		this._group = this.svgManager.group(this.svgManager._wrapper, "graphRegion", {class_: "graphRegion", transform: 'scale(1,1)'});
	
		// --- changing group position if legend or title are shown
		this.svgManager.change(this._group, {transform:'scale(1,1) translate('+ 
						(this.graphManager.isLegend == true ? calculteRelativeValue(this.graphManager.regions.graph.x.fromX,this.svgManager._width()) : 0) 
						+','+ 
						(this.graphManager.isTitle == true ? calculteRelativeValue(this.graphManager.regions.graph.y.fromY,this.svgManager._height()) : 0) 
						+')'});

		// [width,height]
		this._chartSVGSize = calculateElementRelativeSize(this.svgManager._width(),
														this.svgManager._height(), 
														 (this.graphManager.isLegend == true ? this.graphManager._getRegionWidthRatio('graph') : 0), 
														 (this.graphManager.isTitle == true ? this.graphManager._getRegionHeightRatio('graph') : 0),
														[this.paddingLeft, 0, this.paddingRight, this.paddingBottom]);
		
		//alert(this._chartSVGSize); 	
		this._chartSVG = this.svgManager.svg(this._group,
											this.svgManager._width()*this.paddingLeft,
											this.svgManager._width()*this.paddingTop, 
											this._chartSVGSize[0],
											this._chartSVGSize[1]);

		this._graphAreaGroup = this.svgManager.group(this._chartSVG, {class_: this.graphManager.settings.name+'graphArea'});

	},
	_drawGridLines : function(){
		var background = this.svgManager.rect(this._chartSVG,0,0,this._chartSVGSize[0],this._chartSVGSize[1],{class_: "graphBackground",fill: 'none', fill: 'url(#gridLines)'});
		
	},
	_drawAxis: function(axis,id, x1,y1,x2,y2, dateOfLastUpdate){
		var x1 = parseInt(x1);
		var y1 = parseInt(y1);
		var x2 = parseInt(x2);
		var y2 = parseInt(y2);
		var gline = this.svgManager.group(this._group,{class_: "axis"})
		axis._line = this.svgManager.line(gline, x1, y1, x2, y2, axis._lineSettings);
		var len = 10;
		if(x1 == x2 ){
			// console.log('Horizontal Axis');
			var axisLength = y2 - y1;
			var offset = Math.round(axisLength/axis._ticks);
			var counter = 0;
			while(counter < axis._ticks){
				lineOffset = counter*offset;
				this.svgManager.line(gline, x1-len, y2 - lineOffset, x1, y2 - lineOffset);
				counter++;
			}
		}else if( y1 == y2){			
			var axisLength = x2 - x1;
			var offset = Math.round(axisLength/axis._ticks);
			var counter = 0;
			while(counter < axis._ticks){
				lineOffset = counter*offset;
				this.svgManager.line(gline, x1 + lineOffset, y1, x1 + lineOffset, y1+len, {strokeWidth: 1});
				counter++;
			}
			
		}
	},

	// TODO - should be implemented in each graph type later!
	// should only move graphArea by value passed to function ! delete change line values
	_moveArea: function(obj){

//		== new random values ==
		for (var i=0;i<1;i++){
			obj.offset -= obj.xScale;
			obj.path.line(obj.lastXpointposition+(obj.offset*(-1)),(Math.random()*obj._chartSVGSize[1])*0.5);
		}

		obj.graphArea.svgManager.change(obj.pathElement,{d:  obj.path.path()} );
		// TODO change id to class
		var objId = "."+obj.graphArea.graphManager.settings.name+'graphArea';
		// console.log(objId);
		//$(objId).animate( {svgTransform: 'translate(' + obj.offset +',0)'}, 100);
		 $(objId).get(0).setAttribute('transform', 'translate(' + obj.offset +',0)');
		// --------------- moving gridlines ---------------
		var bg = $('#gridLines').get(0);
		var matrix = [obj.offset,0,0,0,obj.offset,100];
		matrix = 'matrix(' + matrix + ')';
		var translate = [obj.offset,0];
		translate = 'translate(' + translate + ')';
	    // bg.setAttribute('patternTransform', matrix);
	    // $('#gridLines').animate( {svgTransform: 'patternTransform(' +translate + ')'}, 10*100);
	    bg.setAttribute('patternTransform', translate);
	   // $(bg).animate({width: translate},10*100);

	}

});

//=======================================================================================================================
//-------------------------------------------------TITLE-----------------------------------------------------------------
function TitleArea(graphManager){
	this.svgManager = graphManager.svgManager;
	this.graphManager = graphManager;
	};
$.extend(TitleArea.prototype,{
	_draw : function(){
		this._group = this.svgManager.group("titleArea", 
											{transform : 'translate(' + 
															calculteRelativeValue(this.graphManager.regions['title'].x.fromX, this.svgManager._width())
															+ ', '+
															calculteRelativeValue(this.graphManager.regions['title'].y.fromY, this.svgManager._height())+')',
															class_: "titleArea", 
															fill: 'red',stroke: 'none'});
		var size = calculateElementRelativeSize(this.svgManager._width(), this.svgManager._height(), this.graphManager._getRegionWidthRatio('title'), this.graphManager._getRegionHeightRatio('title')); 
		this.svgManager.rect(this._group,0,0,size[0],size[1]);
		this.svgManager.text(this._group, 10, 25, "Title", {fontFamily: 'Verdana', fontSize: '25', fill: 'yellow', stroke: 'none'}); 		
	}
});
//=======================================================================================================================
//----------------------------------------------- LEGEND ----------------------------------------------------------------
function LegendArea(graphManager){
	this.svgManager = graphManager.svgManager;
	this.graphManager = graphManager;
}
$.extend(LegendArea.prototype,{
	_draw: function(){
		this._group = this.svgManager.group("legendArea", {transform : 'translate(' +
														calculteRelativeValue(this.graphManager.regions['legend'].x.fromX, this.svgManager._width())
														+ ', '+
														calculteRelativeValue(this.graphManager.regions['legend'].y.fromY, this.svgManager._height()) +') ',
														class_: "legendArea",
														fill: 'blue'});
		this.svgManager.rect(this._group,0,0,this.svgManager._width()*this.graphManager._getRegionWidthRatio('legend'),this.svgManager._height()*this.graphManager._getRegionHeightRatio('legend'));
		this.svgManager.text(this._group, 10, 100, "Legend", {fontFamily: 'Verdana', fontSize: '25', fill: 'yellow', stroke: 'none'}); 
	}
});

//=========================================================================================================================
//----------------------------------------- AXIS -------------------------------------------
function Axis(graphManager, ticks){
	this.svgManager = graphManager.svgManager;
	this.graphManager = graphManager;
	this._line;
	this._lineSettings = {stroke:'green', strokeWidth:1};
	this._minValue;
	this._maxValue;
	this._labels;
	this._labelsSettings = {};
	this._ticks = ticks;
	this._title = '';
	this._tittleSettings = {};
}
$.extend(Axis.prototype,{
	title : function(title, settings){
		if(arguments.length == 0){
			return this._title;
		}
		this._title = title;
		if(typeof settings == object){
			this._tittleSettings = $.extend(this._tittleSettings, settings);
		}
	},
	values : function(min, max){
		if(arguments.length == 0){
			return {min : this._minValue, max: this._maxValue};
		}
		this._maxValue = max;
		this._minValue = min;
	},
	lables : function(labels, settings){
		if(arguments.length == 0){
			return this._labels
		}
		this._labels = labels;
		this._labelsSettings = $.extend(this._labelsSettings , settings);
	},
	line: function(settings){
		if(typeof settings == object){
			this._lineSettings = $.extend(this._lineSettings, settings);
		}
	}
});
// function DataSeries(graphManager, values, labels, name){
	// ============ old ==========================
	// this.graphManager = graphManager;
	// this._values = values || [];
	// this._newValues = [];
	// this._maxValue = Math.max.apply(Math,this._values);
	// this._labels = labels || [];
	// this._newLabels = [];
	// this._name = name || '';
	// this._dateOfLastUpdate; // Value which allows to get new values since last update

	// // holder for element which reprezents this series of data
	// this._element;
	// this._pathElement; // worry later about this
	// this._lastValuePoint;
	//==============================================

// ## New approach to get immutable vars (closures!)
function DataSeries(measurements, name){
	var _measurements = measurements; // e.g. [ { value : 0.92, timestamp : 12435436 }];
	var _maxValue = Math.max.apply(Math,_getValues(measurements));
	var _name = name ;
	var _dateOfLastUpdate = measurements.last().timestamp;;
	var _element;
	//var _dateOfLastDrawedMeasure; // TODO to consider

	// private functions ! 
	function _getValues(measurements){
			var values = [];
			for(var i=0,l=measurements.length; i < l; i++){
				values.push(measurements[i].value);
			}
			return values;
	};
	/**
	* Private function to update maximum value in this serie.
	* Comparing current max value with max value from new data,
	* to avoid searching max value accros the values array
	*/
	function _updateMaxValueFromMeasurements(newMeasurements){
		var valuesArray = this._getValues(newMeasurements);
		var newMaxValue = Math.max.apply(Math,valuesArray);
		// if (this._maxValue != undefined){
		if(this._maxValue < newMaxValue){
				this._maxValue = newMaxValue;
		}  
	};
	
	/**
	* Returning object with public functions ( closures )
	*/
	return {
		/**
		*
		*/
		update : function(measurements){
			_measurements.extend(measurements);
			console.log("last timestamp" + measurements.last().timestamp);
			_dateOfLastUpdate = measurements.last().timestamp;

		},
		/**
		* Function to return array of measurements that are not drawed, 
		* based on number of measurements which came from server
		* @param number of values that came from server
		*/
		getMeasurmentsToDraw : function(numberOfNewValuesToDraw){
			if(numberOfNewValuesToDraw < 0){
				return _measurements;
			}
			return _measurements.slice(_measurements.length - numberOfNewValuesToDraw);
		},
		/**
		*
		*/
		svgElement : function(el){
			if(arguments.length == 0){
				return _element;
			}
			_element = el;
		},
		/**
		*
		*/
		getMaxValue: function(){
			return _maxValue;
		},
		/**
		*
		*/
		getName : function(){
			return _name;
		},
		/**
		*
		*/
		getDateoFLastMeasurment: function(){
			return _dateOfLastUpdate;
		}
	}
}
// ============== old ======================
//$.extend (DataSeries.prototype, {
	// values - array of new values
	// values : function (values){
	// 	if(arguments.length == 0){
	// 		return this._values;
	// 	}
	// 	this._values.extend(values);
	// 	this._maxValue = Math.max.apply(Math,this._values);
	// },
	// labels : function(labels){
	// 	if(arguments.length == 0){
	// 		return this._labels;
	// 	}
	// 	$.extend(this._labels, labels);		
	// },
	// name : function(name){
	// 	if(arguments.length == 0){
	// 		return this._name;
	// 	}
	// 	this._name = name ;
	// },
	// update : function(values, labels, dateOfLastUpdate){
	// 	this.values(values);
	// 	this.labels(labels);
	// 	this._dateOfLastUpdate = dateOfLastUpdate;
	// 	// this._newLabels.extend(newlabels);
	// 	// this._newValues.extend(newValues);
	// },
	// element : function(el){
	// 	if(arguments.length == 0){
	// 		return this._element;
	// 	}
	// 	this._element = el;
	// }	
//});
//==========================================
//===============================================================================================================
//------------------------------------------------ Line Graph --------------------------------------------------
function LineGraph(){
};

$.extend(LineGraph.prototype, {
	initialize: function(graphManager){
		this.graphManager = graphManager;
	},
	draw: function(graphArea){
		var xScale = Math.round(graphArea._chartSVGSize[0]/this.graphManager.settings.ticks);
		// graphArea._chartSVGSize[1] - topPadding  => to get padding at max value
		var yScale = graphArea._chartSVGSize[1]/this.graphManager._getMaxValueFromSeries();
		// TODO remove
		// console.log("xScale = " + xScale);
		// console.log("yScale = " + yScale);
		// console.log("settings.ticks = " + this.graphManager.settings.ticks);

		graphArea._drawGridLines();
		//this.drawSeries(graphArea,xScale,yScale);
		this.drawAxes(graphArea);
		// if _defineDefs() is invoked here, moving patter doesn't work
		// this.graphManager._defineDefs();
	},
	// instead of using this._series use only new values to attach it to series line
	drawSeries : function(graphArea, xScale, yScale, numberOfNewValuesToDrawInSeries){
		// TODO instead of using this.graphManager._series use newValues
		var seriesLength = this.graphManager._series.length;
		for (key in numberOfNewValuesToDrawInSeries){
			console.log("Drawing " + key);
			console.log("graphManager " + this.graphManager);

			var series = this.graphManager._getSeriesByName(key);
			console.log("series = " + series);
			console.log("series first from _series = " + this.graphManager._series[0]);
			console.log("series length= " + seriesLength);
			if(series != undefined){
				
				var measurementsToDraw = series.getMeasurmentsToDraw(numberOfNewValuesToDrawInSeries[key]);
				var seriesSvgElement = series.svgElement();
				console.log("seriesSvgElement " + seriesSvgElement);
				if(seriesSvgElement == undefined){
					console.log("Create element");
					// TODO calculate the x position for new series if such appear
					var x = graphArea._chartSVGSize[0] + ((measurementsToDraw[0].timestamp - this.graphManager._currentTimelineDate)*graphArea._chartSVGSize[0]/this.graphManager._xAxisDateTimeRange);
					console.log("x " + x);
					console.log("yScale " + yScale);
					var tmpPath = graphArea.svgManager.createPath();
					var element = { 'path' : tmpPath,
									'pathNode' : graphArea.svgManager.path(graphArea._graphAreaGroup, tmpPath.move(x,yScale), {fill: 'none', stroke: 'gray', strokeWidth: 1, markerMid: 'url(#circles)'}) };
					series.svgElement(element);
				}
				var element = series.svgElement();
				for(var i=0, l = measurementsToDraw.length; i < l; i++){
					var x = graphArea._chartSVGSize[0] + ((measurementsToDraw[i].timestamp - this.graphManager._currentTimelineDate)*graphArea._chartSVGSize[0]/this.graphManager._xAxisDateTimeRange);
					// console.log("x = " + x);
					var y = graphArea._chartSVGSize[1] - (measurementsToDraw[i].value * yScale);
					//element.path._path = element.path.line(x,y).path();
					console.log("Element.path()" + i + " before = " + element.path.path());
					element.path.line(x,y).path();
					graphArea.svgManager.change(element.pathNode, {d: element.path.path()});
					console.log("Element.path() after = " + element.path.path());
				}
//				console.log(element.path._coords());
			}

		}

		//========================== old ==============================
// 		for(var i=0, l=this.graphManager._series.length; i<l; i++){
// 			var values = this.graphManager._series[i].values();
			
// 			var path = this.graphManager._series[i].element();		
// 			var pathElement = this.graphManager._series[i].pathElement;
			
// 			var lastValueXpoint = this.graphManager._series[i]._lastValuePoint;
// 			if(this.graphManager._series[i].element() == undefined){
// 				this.graphManager._series[i].element(graphArea.svgManager.createPath());
// 				path = this.graphManager._series[i].element();
// 				lastValueXpoint = this.graphManager._series[i]._lastValuePoint=0;
// 				this.graphManager._series[i].pathElement = pathElement = graphArea.svgManager.path(graphArea._graphAreaGroup, path.move(lastValueXpoint,graphArea._chartSVGSize[1] - values[0]*yScale),{fill: 'none',stroke: 'gray', strokeWidth: 2, markerMid: 'url(#circles)'});
// 			}
// 			// else{
// 			// 	//$(pathElement,graphArea.svgManager.root()).removeChild(pathElement);
// 			// 	graphArea._graphAreaGroup.removeChild(pathElement);
// 			// 	console.log("Path usuniety");
// 			// }
// 			// temporary value to have x point of last value from series
// 			for(var j=1, len=this.graphManager._series[i]._values.length; j<len; j++){
// 				// var x = j*xScale + lastValueXpoint;
// 				console.log("xScale = "+xScale);
// //				var x = xScale + lastValueXpoint;
// 				lastValueXpoint += xScale;
// 				var y = graphArea._chartSVGSize[1] - values[j]*yScale;
// 				// console.log("(" + x + ", " + y + " )");
// 				// console.log("#(" + j*xScale + " ," + values[j]*yScale);

// 				this.graphManager._series[i]._lastValuePoint = lastValueXpoint;
// 				graphArea.svgManager.change(pathElement, {d: path.line(lastValueXpoint,y).path()});
// 			}
// 			if(lastValueXpoint > graphArea._chartSVGSize[0]){
// 			//	this.moveArea(lastValueXpoint);
// 			}
// 			// TODO move this to callback function (GraphManager)
// 			//if(lastValueXpoint+(0.2*graphArea._chartSVGSize[0]) >= graphArea._chartSVGSize[0]){
// 				console.log("last x point : " + lastValueXpoint);
// 				//var interval_id = self.setInterval(graphArea._moveArea,100,{canDraw: true, lastXpointposition: lastValueXpoint, path : path, pathElement: pathElement, offset : 0, xScale: xScale, graphArea : graphArea, _chartSVGSize : graphArea._chartSVGSize});
// 			//}
// 		}
	},
	drawAxes: function(graphArea){
		graphArea._drawAxis(this.graphManager._xAxis,'xAxis', 
							graphArea._chartSVG.getAttribute('x'), 
							graphArea._chartSVGSize[1]+calculteRelativeValue(graphArea.svgManager._width(),graphArea.paddingTop),
							parseInt(graphArea._chartSVGSize[0])+parseInt(graphArea._chartSVG.getAttribute('x')), 
							graphArea._chartSVGSize[1]+calculteRelativeValue(graphArea.svgManager._width(),graphArea.paddingTop));
		graphArea._drawAxis(this.graphManager._yAxis,'yAxis', 
							graphArea._chartSVG.getAttribute('x'), 
							graphArea._chartSVG.getAttribute('y'),
							graphArea._chartSVG.getAttribute('x'), 
							parseInt(graphArea._chartSVGSize[1])+parseInt(graphArea._chartSVG.getAttribute('y')));

	},
	addSeries: function(){

	},
	// Area should be moved xScale * numberOfNewValuesToDraw px on each response with new values
	
	//TODO not working cause of translate should add new value of offset to current !
	moveArea:function(offset1){
		var offset = offset1*(-1);
		var objId = "."+this.graphManager.settings.name+'graphArea';
		console.log("graph  area class " + objId);
		 $(objId).get(0).setAttribute('transform', 'translate(' + offset +',0)');
		var bg = $('#gridLines').get(0);
		var matrix = [offset,0,0,0,offset,100];
		matrix = 'matrix(' + matrix + ')';
		var translate = [offset,0];
		translate = 'translate(' + translate + ')';
	    bg.setAttribute('patternTransform', translate);

	},
	refreshGraph: function(graphArea,numberOfNewValuesToDraw){
		console.log("_xAxisDateTimeRange " + this.graphManager._xAxisDateTimeRange);
		var previousEndTimeLineDate = this.graphManager._getCurrentTimelineDate(); 
		console.log("previousEndTimeLineDate = " + previousEndTimeLineDate);
		this.graphManager._currentTimelineDate = this.graphManager._getDateOfLastUpdateFromAllSeries();
		console.log("_currentTimelineDate = " + this.graphManager._getCurrentTimelineDate());
		// value of x translate ( if is < 0 this mean that don't need to translate)
		var xTranslate =  ((this.graphManager._currentTimelineDate - previousEndTimeLineDate)*graphArea._chartSVGSize[0]/this.graphManager._xAxisDateTimeRange); 
		console.log("xTranslate " + xTranslate);
		//graphArea._chartSVGSize[0] +((this.graphManager._currentTimelineDate- previousEndTimeLineDate)*graphArea._chartSVGSize[0]/this.graphManager._xAxisDateTimeRange);

		var xScale = Math.round(graphArea._chartSVGSize[0]/this.graphManager.settings.ticks); // to remove ?
		var yScale = graphArea._chartSVGSize[1]/this.graphManager._getMaxValueFromSeries();
		console.log("## TODO ## when _getMaxValueFromSeries is 0 you get infinity on yScale ! " + this.graphManager._getMaxValueFromSeries());
		if(xTranslate > 0 ){
			this.moveArea(xTranslate);
		}
				
		this.drawSeries(graphArea,xScale,yScale,numberOfNewValuesToDraw);
	}
});
//-------------------------------------------------------------------------
function TestData(numberOfNewValues, numberOfSeries, lastDate){
	// 	"seria_1" : [
		// 					{ value: 0.632, timestamp : 12:41},
		// 					{ value: 0.782, timestamp : 12:42},
		// 					{ value: 0.832, timestamp : 12:43},
		// 				],
	var obj = {};
	for(var i=0; i < numberOfSeries; i++){
		var name = "seria_"+i;
		var seria = {};
		seria[name] = [];
		for(var j=0; j< numberOfNewValues; j++){
			var measure = {
				value : 0,
				timestamp : 0
			}
			measure.value = Math.abs(Math.sin(j*100));

			measure.timestamp = new Date(lastDate).getTime() + j*1000;
			//console.log("value : " + measure.value + " | " + " timestamp " + measure.timestamp);
			// console.log("timestamp " + measure.timestamp.getDate());
			seria[name].push(measure);
		}
		$.extend(obj,seria);

	}
	return obj;
}
//----------------------------------------------------------------------------
function calculteRelativeValue(wrapperSize, ratio){
	return wrapperSize*ratio;
}

/** calculateElementRelativeSize(wrapperWidth, wrapperHeight, xRatio, yRatio, optPaddings)
* # Function to calcute relative size inside element
* @param - wprapperSize - size of containing element (e.g SVG)
* @param - ratio - ratio of element size to wrapper size, leave blank if not needed
* @param - optPadding - array [leftPadding, topPadding, rightPadding, bottomPadding] 
   				if either is not important set to 0
				array [leftRight, topbottom]
				array [LRTB] - all the same
*/
function calculateElementRelativeSize(wrapperWidth, wrapperHeight, xRatio, yRatio, optPaddings){
	var arg = [];
	var relativeWidth = 0;
	var relativeHeight = 0;
	if($.isArray(optPaddings)) {
		switch(optPaddings.length){
			case 1:
				arg[0] = optPaddings[0];
					relativeWidth = wrapperWidth * ((xRatio || 1) - 2*arg[0]);
					relativeHeight = wrapperHeight * ((yRatio || 1) - 2*arg[0]);
				break;
			case 2:
				arg[0] = optPaddings[0];
				arg[1] = optPaddings[1];
				relativeWidth = wrapperWidth * ((xRatio || 1) - 2*arg[0]);
				relativeHeight = wrapperHeight * ((yRatio || 1) - 2*arg[1]);
				break;
			case 4:
				$.each(optPaddings, function(i, value){
					arg[i] = value;
 				});
				relativeWidth = wrapperWidth * ((xRatio || 1) - arg[0] - arg[2]);
				relativeHeight = wrapperHeight * ((yRatio || 1) - arg[1] - arg[3]);
 				break;
 			default:
 				console.error("ERROR in calculateElementRelativeSize. Wrong array length");
		}
		
	}else{
		relativeWidth = wrapperWidth * xRatio;
		relativeHeight = wrapperHeight * yRatio;
	}
	return [relativeWidth, relativeHeight];
}
Object.size = function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};

/**
* extend(values)
* # Function to extend array by new array of values
* @param values - array with values 
*/
Array.prototype.extend = function(values){
	for(var i=0, l=values.length; i<l; i++){
		this.push(values[i]);
		// console.log('Array.extend() value = ' + values[i]);
	}
}
Array.prototype.last = function() {
        return this[this.length - 1];
}
/**
* Array of available charts
*/
var CHARTTYPES = [];
CHARTTYPES['LineGraph'] = new LineGraph();
})(jQuery);











