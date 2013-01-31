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
//http://jsfiddle.net/v3jvK/
//
(function($){
	$.fn.SVGDynamicGraph_1 = function(chartId, width, height, settings){

		var charttype = jQuery.extend(true, {}, CHARTTYPES[chartId]);
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
		timeLabelsTick: 1000, // e.g. every 1 min on graph
		ticks : 10, // TODO change to time (e.g from last 2h)
		timePeriod : 1000*60, // (in milis)
		name : $(element).attr('id'),
		legend : false
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

	// LOG(arguments,'',"NAME = " + this.settings.name);
	
	// TODO------- set up legend or title visible (temporary) ---------------------
	this.isLegend = this.settings.legend;
	this.isTitle = true;
	//-----------------
	this._series = [];
	// TODO remove after tests
	//this._printSeries();
	this.isUpdateActive = true;
	// variable to check if this is first callback invocation to get data from currnet-timePeriod date
	this.firstTime = true;
	this._currentTimelineDate = new Date();
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
		this._legendArea = new LegendArea(this);
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
	draw: function draw(){
		if(this.isTitle){
			this._titleArea._draw();
		}
		if(this.isLegend){
			this._legendArea._draw();
		}
		this._graphArea._draw();
		/*======= invoke chart drawing ==========*/
		this.activateUpdate();//this.callback();
		this.charttype.draw(this._graphArea);

		/* returning this to be able to use it after other SVGDynamicGraph function */		
		return this;
	},
	_defineDefs : function _defineDefs() {
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
	_addSeries : function _addSeries(dataSeries){
		
		var numberOfNewValuesToDrawInSeries = {};
		for( key in dataSeries){
			// LOG(arguments,'',"dataSeries key = " + key);
			if(dataSeries.hasOwnProperty(key)){
				var series = this._getSeriesByName(key);

				if(series != undefined){
					series.update(dataSeries[key]);
				}else{
					//LOG(arguments,'',"dataSeries[key] = " + dataSeries[key] + "name: " + key + "fisrt value = " + dataSeries[key][0].value);
					this._series.push(new DataSeries(dataSeries[key],key));
				}
				var tmp = {};
				tmp[key] = dataSeries[key].length;
				$.extend(numberOfNewValuesToDrawInSeries,tmp);
			}
		}
		return numberOfNewValuesToDrawInSeries;
	},
	activateUpdate : function activateUpdate(){
		this.isUpdateActive = true;
		
		this._timerID = setTimeout(this.callback, 2000, this);
		console.log("TIMER id " + this._timerID);
	},
	callback :function callback(inst){

		if(inst.firstTime){
			LOG(arguments,'',"First time");
			var numberOfNewValues = inst._addSeries(getData(inst._currentTimelineDate.getTime()-inst._xAxisDateTimeRange));
			inst.firstTime = false;
		}else{
			var numberOfNewValues = inst._addSeries(getData(inst._currentTimelineDate.getTime()));
		}
		inst.charttype.refreshGraph(inst._graphArea,numberOfNewValues);
		// LOG(arguments,'passed to callback',"_currentTimelineDate = " + inst._currentTimelineDate);
		inst._timerID = setTimeout(inst.callback,100,inst);
		// LOG(arguments,'',"callback !!!");
		if(!inst.isUpdateActive){
			console.log("INST timer id " + inst._timerID);
			clearTimeout(inst._timerID);
			LOG(arguments,'',"Timeout cleared !!!");
		}
	},
	clearUpdate : function clearUpdate(){
		this.isUpdateActive = false;
		LOG(arguments,'', "interval deactivated");
	},
	setCallback : function setCallback(obj){
		this.callback = obj;
		return this;
	},
	_getCurrentTimelineDate : function _getCurrentTimelineDate(){
		return this._currentTimelineDate;
	},
	_getMaxValueFromSeries: function _getMaxValueFromSeries(){
		var arrayOfMaxValues = [];
		for (var i = this._series.length; i--;) {
			//TODO remove in final version
			// console.log(this._series[i].getName() + ' maxValue = ' + this._series[i].getMaxValue());
			arrayOfMaxValues.push(this._series[i].getMaxValue());
		}
		return arrayOfMaxValues.length != 0 ? Math.max.apply(Math,arrayOfMaxValues) : 0;
	},
	_getMinValueFromSeries : function _getMinValueFromSeries(){
		var arrayOfMinValues = [];
		for (var i = this._series.length; i--;) {
			//TODO remove in final version
			// console.log(this._series[i].getName() + ' maxValue = ' + this._series[i].getMaxValue());
			arrayOfMinValues.push(this._series[i].getMinValue());
		}
		return arrayOfMinValues.length != 0 ? Math.min.apply(Math,arrayOfMinValues) : 0;	
	},
	_getDateOfLastUpdateFromAllSeries: function _getDateOfLastUpdateFromAllSeries(){
		// LOG(arguments,"before loop", "series length = " + this._series.length);
		var arrayOfDates = [];
		for (var i = this._series.length; i--;) {
			// console.log("date series " + this._series[i].getDateoFLastMeasurment());
			arrayOfDates.push(this._series[i].getDateoFLastMeasurment().getTime());
		}
		return arrayOfDates.length != 0 ? new Date(Math.max.apply(Math,arrayOfDates)) : new Date();
	},
	_printSeries:function _printSeries(){
		for(var i=0, l=this._series.length; i<l; i++){
			// LOG(arguments,'',"Name : " + this._series[i].getName());
			var measurements = this._series[i].getMeasurmentsToDraw(-1);
			console.log("Measurements :");
			for(var j=0, len=measurements.length; j<len; j++){
				console.log(j+ " Value = " + measurements[j].value + " Timestamp = " + measurements[j].timestamp);
			}
		}
	},
	_containSeries : function _containSeries(name, array) {
	    var i = array.length;
	    while (i--) {
	        if (array[i].name() == name) {
	            return true;
	        }
	        // LOG(arguments,'',key + "not found");
	    }
    	return false;
	},
	/**
	* Function to search series in Array by name
	* @param name of searched series
	* @return DataSeries object or none 
	*/
	_getSeriesByName : function _getSeriesByName(name){
		if(this._getSeriesByName.cache == undefined){
			// LOG(arguments,'',"defining cache ");
			this._getSeriesByName.cache = {};
		}
		if(this._getSeriesByName.cache[name]){
			// LOG(arguments, '', "cache is true for name " + name);
			return this._series[this._getSeriesByName.cache[name]];
		}else{
			for (var i = this._series.length; i--;) {
				if(this._series[i].getName() == name){
					this._getSeriesByName.cache[name] = i;
					// LOG(arguments,''," Series name : " + this._series[i].getName());
					return this._series[this._getSeriesByName.cache[name]];
				}
			}			
		}
	},
	_setDateTimeRange : function _setDateTimeRange(){
		// LOG(arguments,'new way', "timeRange = " + new Date(this._currentTimelineDate.getTime()-this.settings.timePeriod));
		//LOG(arguments,'new way', "timeRange = " + new Date(this.settings.timePeriod));

		this._xAxisDateTimeRange = new Date(this.settings.timePeriod).getTime();
//		var current = (new Date()).getTime();
//		var begining = (new Date(current - this.settings.timePeriod)).getTime();
//		this._xAxisDateTimeRange = new Date(Math.abs(current - begining));
//		LOG(arguments,'odl way', "_xAxisDateTimeRange = " + this._xAxisDateTimeRange);

	},
	calculateScale : function calculateScale(size,padding){
		var range = this.calcuteRange();
		var sizeOfDrawableArea = size - (2*size*padding); // if size = 1000 then sizeOfDrawableArea should equal 800 (if padding = 0.1)
		if(this.yScale != undefined){
			var tmpScale = sizeOfDrawableArea/range;
			// LOG(arguments,'',"tmpScale = " + tmpScale + " == " + this.yScale );
			if(tmpScale != this.yScale){
				this.yScale = tmpScale;
				return true;
			}
			return false;
		}else{
			this.yScale = sizeOfDrawableArea/range;
			return false; // ?? or true ?
		}
	},
	calculateYpoint : function calculateYpoint(svgGraphSize, maxValue, value, padding){
		var paddingValue = svgGraphSize * padding;
		var point = (maxValue - value) * this.yScale + paddingValue;
		return point;
	},
	calcuteRange : function calcuteRange(){
		var range = this._getMaxValueFromSeries() - this._getMinValueFromSeries() ;
		return range != 0 ? range : 1;
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
	this.graphPadding = 0.1;
};
$.extend(GraphArea.prototype,{
	_draw: function draw(){
		this._group = this.svgManager.group(this.svgManager._wrapper, "graphRegion"+this.graphManager.settings.name, {class_: "graphRegion", transform: 'scale(1,1)'});
	
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
	_drawGridLines : function draw(){
		var background = this.svgManager.rect(this._chartSVG,0,0,this._chartSVGSize[0],this._chartSVGSize[1],{class_: "graphBackground",fill: 'none', fill: 'url(#gridLines)'});
		
	},
	_drawAxis: function _drawAxis(axis,id, x1,y1,x2,y2, dateOfLastUpdate){
		var x1 = parseInt(x1);
		var y1 = parseInt(y1);
		var x2 = parseInt(x2);
		var y2 = parseInt(y2);
		var gline = this.svgManager.group(this._group,{class_: "axis"})
		axis._line = this.svgManager.line(gline, x1, y1, x2, y2, axis._lineSettings);
		var len = 10;
		if(x1 == x2 ){
			// LOG(arguments,'','Horizontal Axis');
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
	upscale : function upscale(series,svgSize,maxValue){
		for(var i=0, len=series.length; i < len; i++){
			// LOG(arguments,'',"upscale of " + key);
			var element = series[i].svgElement();
			var measurements = series[i].getMeasurmentsToDraw(-1);
			// console.log("##################################################################################");
			for(var i=0,len = measurements.length; i < len; i++){
				// console.log("------------------------------------------------------------------------------");
				// LOG(arguments,'old y value', element.pathNode.pathSegList.getItem(i).y);
				element.pathNode.pathSegList.getItem(i).y = this.graphManager.calculateYpoint(svgSize,maxValue,measurements[i].value,this.graphPadding);
				// LOG(arguments,'new y value', element.pathNode.pathSegList.getItem(i).y);
			}
		}

	}

});

//=======================================================================================================================
//-------------------------------------------------TITLE-----------------------------------------------------------------
function TitleArea(graphManager){
	this.svgManager = graphManager.svgManager;
	this.graphManager = graphManager;
	};
$.extend(TitleArea.prototype,{
	_draw : function _draw(){
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
	_draw: function _draw(){
		this._group = this.svgManager.group("legendArea"+this.graphManager.settings.name, {transform : 'translate(' +
														calculteRelativeValue(this.graphManager.regions['legend'].x.fromX, this.svgManager._width())
														+ ', '+
														calculteRelativeValue(this.graphManager.regions['legend'].y.fromY, this.svgManager._height()) +') ',
														class_: "legendArea",
														fill: 'blue'});
		this.svgManager.rect(this._group,0,0,this.svgManager._width()*this.graphManager._getRegionWidthRatio('legend'),this.svgManager._height()*this.graphManager._getRegionHeightRatio('legend'));
		this.svgManager.text(this._group, 10, 100, "Legend", {fontFamily: 'Verdana', fontSize: '25', fill: 'yellow', stroke: 'none'}); 
		this.svgManager.text(this._group,10,200, this.graphManager._getCurrentTimelineDate().getHours() +" : " +  this.graphManager._getCurrentTimelineDate().getMinutes(), {fontSize:10, stroke:'none', fill:'white', id:'time'});
	},
	// temporary
	refreshTime : function refreshTime(){	
		$('#time',this.svgManager.root()).text(this.graphManager._getCurrentTimelineDate().getHours() +" : " +  this.graphManager._getCurrentTimelineDate().getMinutes() + " : " + this.graphManager._getCurrentTimelineDate().getSeconds());
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
	title : function title(title, settings){
		if(arguments.length == 0){
			return this._title;
		}
		this._title = title;
		if(typeof settings == object){
			this._tittleSettings = $.extend(this._tittleSettings, settings);
		}
	},
	values : function values(min, max){
		if(arguments.length == 0){
			return {min : this._minValue, max: this._maxValue};
		}
		this._maxValue = max;
		this._minValue = min;
	},
	lables : function labels(labels, settings){
		if(arguments.length == 0){
			return this._labels
		}
		this._labels = labels;
		this._labelsSettings = $.extend(this._labelsSettings , settings);
	},
	line: function line(settings){
		if(typeof settings == object){
			this._lineSettings = $.extend(this._lineSettings, settings);
		}
	}
});

// ## New approach to get immutable vars (closures!)
function DataSeries(measurements, name){
	var _measurements = measurements; // e.g. [ { value : 0.92, timestamp : 12435436 }];
	var _lastMeasurementXpoint = 0;
	var _maxValue = Math.max.apply(Math,_getValues(measurements));
	var _minValue = Math.min.apply(Math,_getValues(measurements));
	var _name = name ;
	var _dateOfLastUpdate = new Date(measurements.last().timestamp);
	var _element;
	// LOG(arguments,'',"_minValue = " + _minValue + " | _maxValue = " + _maxValue);
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
	function _updateMaxMinValueFromMeasurements(newMeasurements){
		var valuesArray = _getValues(newMeasurements);
		var newMaxValue = Math.max.apply(Math,valuesArray);
		// LOG(arguments,'max values comparsion '," old == new || " + _maxValue + " == " + newMaxValue);
		if(_maxValue < newMaxValue){
				_maxValue = newMaxValue;
		}  
		var newMinValue = Math.min.apply(Math,valuesArray);
		if(_minValue > newMinValue){
			_minValue = newMinValue;
		}
		// LOG(arguments,'',"_minValue = " + _minValue);
	};
	
	/**
	* Returning object with public functions ( closures )
	*/
	return {
		/**
		*
		*/
		update : function update(measurements){
			_measurements.extend(measurements);
			// LOG(arguments,"","measurements.length = " + measurements.length);
			// LOG(arguments,'',"last timestamp " + (new Date(measurements.last().timestamp)));
			_dateOfLastUpdate = new Date(measurements.last().timestamp);
			_updateMaxMinValueFromMeasurements(measurements);

		},
		/**
		* Function to return array of measurements that are not drawed, 
		* based on number of measurements which came from server
		* @param number of values that came from server
		*/
		getMeasurmentsToDraw : function getMeasurmentsToDraw(numberOfNewValuesToDraw){
			if(numberOfNewValuesToDraw < 0){
				return _measurements;
			}
			return _measurements.slice(_measurements.length - numberOfNewValuesToDraw);
		},
		/**
		*
		*/
		svgElement : function svgElement(el){
			if(arguments.length == 0){
				return _element;
			}
			_element = el;
		},
		/**
		*
		*/
		getMaxValue: function getMaxValue(){
			return _maxValue;
		},
		/**
		*
		*/
		getMinValue : function getMinValue(){
			return _minValue;
		},
		/**
		*
		*/
		getName : function getName(){
			return _name;
		},
		/**
		*
		*/
		getDateoFLastMeasurment: function getDateoFLastMeasurment(){
			return _dateOfLastUpdate;
		},
		getLastMeasurmentXPoint :function getLastMeasurmentXPoint(){
			return _lastMeasurementXpoint;
		},
		setLastMeasurmentXpoint : function setLastMeasurmentXpoint(x){
			_lastMeasurementXpoint = x;
		}
	}
}
//===============================================================================================================
//------------------------------------------------ Line Graph --------------------------------------------------
function LineGraph(){
};

$.extend(LineGraph.prototype, {
	initialize: function(graphManager){
		this.graphManager = graphManager;
	},
	/**
	* Here can add functionlity for static graph, some function to add data to series
	*/
	draw: function draw(graphArea){
		graphArea._drawGridLines();
		//this.drawSeries(graphArea,xScale,yScale);
		this.drawAxes(graphArea);
		// if _defineDefs() is invoked here, moving patter doesn't work
		// this.graphManager._defineDefs();
	},
	// instead of using this._series use only new values to attach it to series line
	drawSeries : function drawSeries(graphArea, yScale, numberOfNewValuesToDrawInSeries){
		var seriesLength = this.graphManager._series.length;
		// LOG(arguments,'',"series length= " + seriesLength);
		for (key in numberOfNewValuesToDrawInSeries){
			var series = this.graphManager._getSeriesByName(key);
			if(series != undefined){
				var measurementsToDraw = series.getMeasurmentsToDraw(numberOfNewValuesToDrawInSeries[key]);
				var seriesSvgElement = series.svgElement();
				
				var maxValue = this.graphManager._getMaxValueFromSeries();

				var isFirstValueOfSeries;
				if(seriesSvgElement == undefined){
					var timedifference = measurementsToDraw[0].timestamp - this.graphManager._currentTimelineDate.getTime();
					series.setLastMeasurmentXpoint(graphArea._chartSVGSize[0] - graphArea._chartSVGSize[0]/100 ); //set last valute point to svg width - padding 1/100 width
					var x = series.getLastMeasurmentXPoint() + timedifference*graphArea._chartSVGSize[0]/this.graphManager._xAxisDateTimeRange;
					var y = this.graphManager.calculateYpoint(graphArea._chartSVGSize[1],maxValue, measurementsToDraw[0].value,graphArea.graphPadding);
					var tmpPath = graphArea.svgManager.createPath();
					var element = { 'path' : tmpPath,
									'pathNode' : graphArea.svgManager.path(graphArea._graphAreaGroup, tmpPath.move(x,y), {fill: 'none', stroke: 'gray', strokeWidth: 1, markerMid: 'url(#circles)'}) };
					series.svgElement(element);
					isFirstValueOfSeries = true;
				}
				
				var element = series.svgElement();
				element.path._path = element.pathNode.getAttribute('d');	
				var x;
				for(var i= isFirstValueOfSeries ? 1 : 0, l = measurementsToDraw.length; i < l; i++){
					var timedifference = measurementsToDraw[i].timestamp - this.graphManager._currentTimelineDate.getTime();
					x = series.getLastMeasurmentXPoint() + timedifference*graphArea._chartSVGSize[0]/this.graphManager._xAxisDateTimeRange;
					var y = this.graphManager.calculateYpoint(graphArea._chartSVGSize[1],maxValue,measurementsToDraw[i].value,graphArea.graphPadding);
					// LOG(arguments,"","y = " + y);
					element.path.line(x,y).path();
				}

				series.setLastMeasurmentXpoint(x);
				graphArea.svgManager.change(element.pathNode, {d: element.path.path()});
				series.svgElement(element);

			}
		}
	},
	drawAxes: function drawAxes(graphArea){
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
	addSeries: function addSeries(){

	},
	// Area should be moved xScale * numberOfNewValuesToDraw px on each response with new values
	
	//TODO not working cause of translate should add new value of offset to current !
	moveArea:function moveArea(offset1){
		var offset = offset1*(-1);
		var objId = "."+this.graphManager.settings.name+'graphArea';
		// LOG(arguments,'',"graph  area class " + objId);
		 $(objId).get(0).setAttribute('transform', 'translate(' + offset +',0)');
		 // $(objId).animate({svgTransform : 'translate(' + offset +',0)'},100);
		var bg = $('#gridLines').get(0);
		var matrix = [offset,0,0,0,offset,100];
		matrix = 'matrix(' + matrix + ')';
		var translate = [offset,0];
		translate = 'translate(' + translate + ')';
	    bg.setAttribute('patternTransform', translate);

	},
	refreshGraph: function refreshGraph	(graphArea,numberOfNewValuesToDraw){
		
		var shouldUpscale = this.graphManager.calculateScale(graphArea._chartSVGSize[1], graphArea.graphPadding);
		this.drawSeries(graphArea,this.graphManager.yScale,numberOfNewValuesToDraw);// it was on the bottom

		if(shouldUpscale){
			// LOG(arguments,"","UPSCALE ! ");
			graphArea.upscale(this.graphManager._series, graphArea._chartSVGSize[1], this.graphManager._getMaxValueFromSeries());
		}
		
		var previousEndTimeLineDate = this.graphManager._getCurrentTimelineDate(); 
		this.graphManager._currentTimelineDate = this.graphManager._getDateOfLastUpdateFromAllSeries();

		//TODO temporary solution with xTranslate !!!!
		if(this.xTranslate == undefined){
			this.xTranslate = 0;
		}
		this.xTranslate +=  ((this.graphManager._currentTimelineDate.getTime() - previousEndTimeLineDate.getTime())*graphArea._chartSVGSize[0]/this.graphManager._xAxisDateTimeRange); 
		// LOG(arguments,'',"xTranslate " + xTranslate);

		//tempoarary
		//refreshing time on legend area
		if(this.graphManager._legendArea){
			this.graphManager._legendArea.refreshTime();
		}
		
		if(this.xTranslate > 0 ){
			this.moveArea(this.xTranslate);
		}				
	}
});

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

function LOG(args, description, message){
	console.log("----------------------------");
	console.log("## > "+args.callee.name + "| " + description + " | " + "\n\t " + message + "\n----------------------------");
}

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











