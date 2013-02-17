
(function($){
	/**
	* Manager which allows  to add new graph types with own implementation
	*/
	$.ChartsManager = new ChartsManager();
	function ChartsManager(){
		var _CHARTTYPES = [];
		return {
			addChartType : function addChartType (name, chart) {
				_CHARTTYPES[name] = chart;
			},
			getCharts : function getCharts () {
				return _CHARTTYPES;
			},
			getChartType : function getChartType (name) {
				if(_CHARTTYPES[name]){
					return $.extend(true,{},_CHARTTYPES[name]);
				}
				return false;
			}
		}
	};
	/**
	*
	*/
	$.fn.SVGDynamicGraph = function(chartId, width, height, settings){

		var charttype = $.ChartsManager.getChartType(chartId);
		if(charttype){
			this.graphManager = new GraphManager(this, charttype, width,height, settings);
			charttype.initialize(this.graphManager);
			return this.graphManager;
		}else{
			console.error('SVGDynamincGraph: Wrong chart type. There is no type : ' + chartId);
		}
	};
//===============================================================================================================
//========================================== Graph Manager ======================================================

function GraphManager(element, charttype, width, height, settings){
	this.defaultSettings = {
		name : $(element).attr('id'),
		timeLabelsTick: 1000*2, // e.g. every 1 min on graph
		timePeriod : 1000*5, // (in milis)
		ControlPanelEnabled: false,
		callbackTime : 1000,
		
		xAxis : {
			enabled : true,
			// type : 'timeAxis',
			labelSettings : {
				font : 'Arial',
				textAnchor: 'middle',
				fontSize: 11, 
				stroke:'none', 
				fill:'MidnightBlue',
				transform : 'rotate(0,0,0)'},
			lineSettings : {
				strokeOpacity: 100,
				strokeWidth: 0.5, 
				class_: 'axis',
				stroke:'MidnightBlue', 
				scaleSize : 5},
			// ticks : 5,
			
		},
		chartOptions : {
			grid : true,//false
			gridSettings : {
				fill: 'none', 
				strokeDashArray:"2,2", 
				stroke:"blue", 
				strokeOpacity:0.7,	 
				strokeWidth:1 },
			horizontal_grid: true,//false
			vertical_grid: false,//false
			graphAreaBackground : {
				class_ : 'graphBackground',
				fill : 'none',
				zIndex : -1 },
			background : {
				fill: 'none',
				class_: 'background'
			}

		},
		yAxis : {
			enabled : true,
			title : false, // e.g. 'Sinus' (if false it will be not visible)
			titleSettings : {
				stroke:'none',  
				textAnchor : 'middle', 
			},
			labelsEnabled :true,
			ticks : 4,
			labelSettings : { 
				alignmentBaseline: 'middle', 
				textAnchor : 'end', 
				stroke:'none', 
				strokeOpacity: 1,
				fontSize: 10,
				fill : 'MidnightBlue'},
			lineSettings : {
				stroke:'black', 
				strokeWidth:0.5},
			label_unit: '' //(km/h),
			
		},
		dataSeries : {
			seriesMarkers : [false, 'circle'], /* circle, square, triangle,cross */ //array length should equal number of series to set all markers
			markerSize : 5, 
			seriesPathSettings : {strokeWidth : 2, fill:'none'}
		},
		title : {
			enabled : true,
			text : 'Chart title',
			textSettings : { 
				fill : 'black',
				stroke : 'none',
				fontSize : 15,
				paddingTop : 5,
				textAnchor : 'middle'}
		},
		draw_axis: false,
	}
	//===================
	// attaching svg 
	LOG(arguments,'',"width = " + width + "| height = " + height);
	$(element).svg({settings : { width: width, height : height}});
	mysvg = $(element).svg('get');
	//===================
	// mysvg._container = mysvg._svg;
	this.svgManager = mysvg;
	this.charttype = charttype;
	this.settings = $.extend(true,{}, this.defaultSettings, settings);

	this.chartBackground = this.svgManager.rect(0,0,width,height,this.settings.chartOptions.background); 
	
	this.isLegend = this.settings.legend || false;
	this.isTitle = this.settings.title.enabled || false;
	//-----------------
	this._series = [];
	this.isUpdateActive = true;
	// variable to check if this is first callback invocation to get data from current-timePeriod date
	this.firstTime = true;
	this._currentTimelineDate = new Date();
	this._xAxisDateTimeRange;
	this._setDateTimeRange();
	this.uniqueSeriesID = 0;
	this._xAxis = new TimeAxis(this);
	// if(this.settings.xAxis.type == 'timeAxis'){
	// }else{
	// 	this._xAxis = new Axis(this,this.settings.xAxis.ticks);
	// }
	this._yAxis = new Axis(this,this.settings.yAxis.ticks);
	// if value is < 0 it means 100% of svg size if  value is = 0 then  relative value 
	this.regionsSize = {
		titleArea : { width : -1, height : 30},
		legendArea : { width : -1, height: -1},
		graphArea : {width : 0, height : 0},
		yAxisArea : {width : this.settings.yAxis.title ? 60 : 40, height : 0},
		xAxisArea : {width : this.svgManager._width() - 50, height : 35}
		};
	if(this.isTitle){
		this._titleArea = new TitleArea(this);
	}
	if(this.isLegend){
		this._legendArea = new LegendArea(this);
	}
	this._graphArea = new GraphArea(this);
	
}
$.extend(GraphManager.prototype,{
	
	draw: function draw(){
		if(this.isTitle){
			this._titleArea._draw();
		}

		/* To develop in later versions */
		if(this.isLegend){
			this._legendArea._draw();
		}
		this._graphArea._draw();
		/*======= invoke chart drawing ==========*/

		this.activateUpdate();//this.callback();
		this.charttype.draw(this._graphArea);
		this._defineDefs(this._graphArea);

		/* To develop in later versions */
		if(this.settings.ControlPanelEnabled){
			this._controlPanel = new ControlPanel(this);
		}
		/* returning this to be able to use it after other SVGDynamicGraph function */		
		return this;
	},
	_defineDefs : function _defineDefs(graphArea) {
		this.defs = this.svgManager.defs(this.settings.name + '_defs');
		var horizontalGridlineLenght = graphArea._chartSVGSize.width/Math.ceil(this._xAxisDateTimeRange/this.settings.timeLabelsTick);
		var verticalGridlineLenght = graphArea._chartSVGSize.height/this.settings.yAxis.ticks;

		var gridlines = this.svgManager.pattern(this.defs, "gridLines", 0,0,horizontalGridlineLenght,verticalGridlineLenght, 0,0,0,0, { class_: "gridlines", patternUnits: 'userSpaceOnUse'});
		if(this.settings.chartOptions.horizontal_grid){
			var line1 = this.svgManager.line(gridlines, 0,0,horizontalGridlineLenght,0,this.settings.chartOptions.gridSettings /*{fill: 'none', strokeDashArray:"2,2", stroke:"green", strokeOpacity:0.7,	 strokeWidth:1}*/);
		}
		if(this.settings.chartOptions.vertical_grid){
			var line2 = this.svgManager.line(gridlines, 0,0,0,verticalGridlineLenght, this.settings.chartOptions.gridSettings/*{fill: 'none', strokeDashArray:"2,2", stroke:"green", strokeOpacity:0.4, strokeWidth:1}*/);
		}

		var marker = this.svgManager.marker(this.defs, 'circle', 8, 8, 15, 15, 'auto',{ markerUnits:"strokeWidth"});
		var markerCircle = this.svgManager.circle(marker, 8,8,1, {stroke: 'green', fill: 'none', strokeWidth:'1'});

		var markerSquare = this.svgManager.marker(this.defs, 'square', 1.5, 1.5, 3, 3, '0',{ markerUnits:"strokeWidth"});
		 this.svgManager.rect(markerSquare, 0,0,10,10, {stroke: 'none', fill: 'green', strokeWidth:'1'});

		var markerX = this.svgManager.marker(this.defs, 'cross', 2.5, 2.5, 5, 5, '0',{ markerUnits:"strokeWidth"});
		this.svgManager.line(markerX,0,0,5,5, {stroke: 'green', fill: 'green', strokeWidth:'1'});
		this.svgManager.line(markerX,0,5,5,0, {stroke: 'green', fill: 'green', strokeWidth:'1'});
		var markerTriangle = this.svgManager.marker(this.defs, 'triangle', 3, 2, 6, 4, '0',{ markerUnits:"strokeWidth"});
		 var path = this.svgManager.createPath();
		 this.svgManager.path(markerTriangle, path.move(0,0).line(6,0).line(3,4).close(), {stroke: 'none', fill: 'DeepSkyBlue', strokeWidth:'1'});

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
					this._series.push(new DataSeries(dataSeries[key],key,this._uniqueID()));
				}
				var tmp = {};
				tmp[key] = dataSeries[key].length;
				$.extend(numberOfNewValuesToDrawInSeries,tmp);
			}
		}
		return numberOfNewValuesToDrawInSeries;
	},
	activateUpdate : function activateUpdate(){
		if(!this._timerID){
			this._timerID = setTimeout(this.callback, this.settings.callbackTime, this);
			console.log("TIMER id " + this._timerID);
		}
		return this;
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
		inst._timerID = setTimeout(inst.callback,inst.settings.callbackTime,inst);
	},
	clearUpdate : function clearUpdate(){
		clearTimeout(this._timerID);
		this._timerID = false;
		LOG(arguments,'', "interval deactivated");
		return this;
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
			arrayOfMaxValues.push(this._series[i].getMaxValue());
		}
		return arrayOfMaxValues.length != 0 ? Math.max.apply(Math,arrayOfMaxValues) : 0;
	},
	_getMinValueFromSeries : function _getMinValueFromSeries(){
		var arrayOfMinValues = [];
		for (var i = this._series.length; i--;) {
			arrayOfMinValues.push(this._series[i].getMinValue());
		}
		return arrayOfMinValues.length != 0 ? Math.min.apply(Math,arrayOfMinValues) : 0;	
	},
	_getDateOfLastUpdateFromAllSeries: function _getDateOfLastUpdateFromAllSeries(){
		var arrayOfDates = [];
		for (var i = this._series.length; i--;) {
			arrayOfDates.push(this._series[i].getDateoFLastMeasurment().getTime());
		}
		return arrayOfDates.length != 0 ? new Date(Math.max.apply(Math,arrayOfDates)) : this._getCurrentTimelineDate();
	},
	_printSeries:function _printSeries(){
		for(var i=0, l=this._series.length; i<l; i++){
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
		this._xAxisDateTimeRange = new Date(this.settings.timePeriod).getTime();
	},
	calculateScale : function calculateScale(size,padding){
		var range = this.calculateRange();
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
	calculateRange : function calculateRange(){
		var range = this._getMaxValueFromSeries() - this._getMinValueFromSeries() ;
		return range != 0 ? range : 1;
	},
	calculateRangeForYAxis : function calculateRangeForYAxis(graphArea){
		var min = this._getMinValueFromSeries();
		var max = this._getMaxValueFromSeries();
		var range = this.calculateRange();
		var chartPadding = graphArea.graphPadding*graphArea._chartSVGSize.height;
		var paddingValue =  chartPadding * range / (graphArea._chartSVGSize.height - 2*chartPadding);
		// LOG(arguments,'',"min = " + min + " max = " + max + " | paddingValue = " + paddingValue + " | chartPadding = " + chartPadding + " | svgSize = " + graphArea._chartSVGSize.height + " | padding = " + graphArea.graphPadding);
		var realRange = range + (2*paddingValue);
		var realMinValue = min - paddingValue;
		var realMaxValue = max + paddingValue;

		var obj = { range : realRange,
				minValue : realMinValue,
				maxValue : realMaxValue};
		return obj;
	},
	getColorForSeries: function getColorForSeries(id){
		id >= COLOR_ARRAY.length ? id = 0 : null;
		return COLOR_ARRAY[id];
	},
	/**
	* Helper function to generate _uniqueID
	*/
	_uniqueID : function _uniqueID () {
		return this.uniqueSeriesID++;
	},
});

//===============================================================================================================
//=============================================== Graph Area =======================================================
function GraphArea(graphManager){
	this.svgManager = graphManager.svgManager;
	this.graphManager = graphManager;
	// this.padding = 0.1;
	// this.paddingLeft=0.1;
	// this.paddingRight = 0.02;
	this.paddingRightPx = 25;
	// this.paddingBottom = 0.15;
	// this.paddingTop = 0.01;
	this.graphPadding = 0.1;
	
};
$.extend(GraphArea.prototype,{
	_draw: function draw(){
		var titleEnabled = this.graphManager.isTitle;
		var yAxisEnabled = this.graphManager.settings.yAxis.enabled;
		var xAxisEnabled = this.graphManager.settings.xAxis.enabled;
		var titleHeight = this.graphManager.regionsSize.titleArea.height;
		var yAxisWidth = this.graphManager.regionsSize.yAxisArea.width;
		var xAxisHeight = this.graphManager.regionsSize.xAxisArea.height;

		var translate = "translate( 0," + (titleEnabled ? titleHeight : 10) + ")";
		this._group = this.svgManager.group(null, {transform : translate, class_ : this.graphManager.settings.name+'graphRegion'});

		var tmpChartSvgHeight = this.svgManager._height() - (titleEnabled ? titleHeight : 0) - (xAxisEnabled ? xAxisHeight : 0); 
		LOG(arguments, '',"width = " + this.svgManager._width() + " | height = " + this.svgManager._height());
		
		this._chartSVGSize = {width : yAxisEnabled ? this.svgManager._width() - yAxisWidth - this.paddingRightPx /*as padding*/: this.svgManager._width() - 50/*as padding*/,
								height : tmpChartSvgHeight};
		this._chartSVG = this.svgManager.svg(this._group, 
									yAxisEnabled ? yAxisWidth : 20/*as padding*/,
									0/*as padding */,
									this._chartSVGSize.width,
									this._chartSVGSize.height );
		var background = this.svgManager.rect(this._chartSVG,0,0,this._chartSVGSize.width,this._chartSVGSize.height, this.graphManager.settings.chartOptions.graphAreaBackground);
		this._gridlinesGroup = this.svgManager.group(this._chartSVG, {class_ : "gridLines"});
		this._graphAreaGroup = this.svgManager.group(this._chartSVG, {class_: this.graphManager.settings.name+'graphArea'});
		

	},
	_drawGridLines : function draw(){
		if(this.graphManager.settings.chartOptions.grid){
			// var gridlines = this.svgManager.rect(this._chartSVG,0,0,this._chartSVGSize.width,this._chartSVGSize.height,{class_: "graphGrlidlines",fill: 'none', fill: 'url(#gridLines)'});
		}
		
	},
	_drawHorizontalGridLines : function _drawHorizontalGridLines (ticks,settings) {
		var axisLength = this._chartSVGSize.height;
		var offset = axisLength / ticks;
		for(var i = 0; i <ticks; i++){
			var y = 0+offset*i;
			this.svgManager.line(this._gridlinesGroup, 0, y,this._chartSVGSize.width,y, settings);
		}
	},
	_drawAxis: function _drawAxis(axis,id, x1,y1,x2,y2, dateOfLastUpdate){
		var x1 = parseInt(x1);
		var y1 = parseInt(y1);
		var x2 = parseInt(x2);
		var y2 = parseInt(y2);
		var gline = this.svgManager.group(this._group,{class_: "axis"})
		axis._line = this.svgManager.line(gline, x1, y1, x2, y2, axis._lineSettings);
		var len = 5;
		if(x1 == x2 ){
			// LOG(arguments,'','Horizontal Axis');
			var axisLength = y2 - y1;
			// var offset = Math.round(axisLength/axis._ticks);
			var offset = axisLength/axis._ticks;
			var counter = 0;
			if(axis._title){
				this.svgManager.text(gline,20, this._chartSVGSize.height/2, axis._title + " " + axis._label_unit, $.extend(true, {transform : 'rotate(-90, 20, ' + this._chartSVGSize.height/2 + ')'},this.graphManager.settings.yAxis.titleSettings));
			}
			while(counter <= axis._ticks){
				lineOffset = counter*offset;
				//this._drawHorizontalGridLines(0,y2 - lineOffset, this._chartSVGSize.width, y2- lineOffset, this.graphManager.settings.chartOptions.gridSettings);
				this.svgManager.line(gline, x1-len, y2 - lineOffset, x1, y2 - lineOffset, axis._lineSettings);
				if(axis._labelsEnabled){
					axis._labelsNodes.push(this.svgManager.text(gline, x1-len - 2, y2 - lineOffset, "...", axis._labelsSettings/*{ alignmentBaseline: 'middle', textAnchor : 'end', stroke:'none', fontSize: 10}*/));
				}
				counter++;
			}
		}
		// ---- old approach ( with simple xAxis (not timeaxis))
		// else if( y1 == y2){			
		// 	var axisLength = x2 - x1;
		// 	var offset = Math.round(axisLength/axis._ticks);
		// 	var counter = 0;
		// 	while(counter < axis._ticks){
		// 		lineOffset = counter*offset;
		// 		this.svgManager.line(gline, x1 + lineOffset, y1, x1 + lineOffset, y1+len, {strokeWidth: 0.5});
		// 		counter++;
		// 	}
			
		// }
	},
	_upscale : function _upscale(series,svgSize,maxValue){
		for(var i=0, len=series.length; i < len; i++){
			var element = series[i].svgElement();

			var measurements = series[i].getMeasurmentsToDraw(-1);
			for(var j=0,l = measurements.length; j < l; j++){
				element.pathNode.pathSegList.getItem(j).y = this.graphManager.calculateYpoint(svgSize,maxValue,measurements[j].value,this.graphPadding);
			}
		}

	}

});

//=======================================================================================================================
//-------------------------------------------------TITLE-----------------------------------------------------------------
function TitleArea(graphManager){
	this.svgManager = graphManager.svgManager;
	this.graphManager = graphManager;
	this.settings = graphManager.settings.title.textSettings;
	this.verticalPos = this.svgManager._width()/2;
	this.paddingTop = 5;
				
	};
$.extend(TitleArea.prototype,{
	_draw : function _draw(){
		this._group = this.svgManager.group(null, {class_: "titleArea"});
		this.svgManager.text(this._group, this.verticalPos, this.paddingTop + this.settings.fontSize, this.graphManager.settings.title.text , this.settings/*{fontFamily: 'Verdana', fontSize : this.settings.fontSize, stroke:'none',textAnchor : 'middle'}*/); 		
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
		// this._group = this.svgManager.group("legendArea"+this.graphManager.settings.name, {transform : 'translate(' +
		// 												calculateRelativeValue(this.graphManager.regions['legend'].x.fromX, this.svgManager._width())
		// 												+ ', '+
		// 												calculateRelativeValue(this.graphManager.regions['legend'].y.fromY, this.svgManager._height()) +') ',
		// 												class_: "legendArea",
		// 												fill: 'blue'});
		// this.svgManager.rect(this._group,0,0,this.svgManager._width()*this.graphManager._getRegionWidthRatio('legend'),this.svgManager._height()*this.graphManager._getRegionHeightRatio('legend'));
		// this.svgManager.text(this._group, 10, 100, "Legend", {fontFamily: 'Verdana', fontSize: '25', fill: 'yellow', stroke: 'none'}); 
		// this.svgManager.text(this._group,10,200, this.graphManager._getCurrentTimelineDate().getHours() +" : " +  this.graphManager._getCurrentTimelineDate().getMinutes(), {fontSize:10, stroke:'none', fill:'white', id:'time'});
		
		// this._group = this.svgManager.group(null,{ transform : 'translate( 0,' + (this.svgManager._height() - 25) + ')', class_ : 'legendArea', fill : 'blue'});
		// this.svgManager.text(this._group, 10, 10, "Legend ", { stroke : 'none', fontSize : 15});
		// this.svgManager.text(this._group,10,20, this.graphManager._getCurrentTimelineDate().getHours() +" : " +  this.graphManager._getCurrentTimelineDate().getMinutes(), {fontSize:10, stroke:'none', fill:'black', class_:'time'});
	}
	
});

//=========================================================================================================================
//----------------------------------------- AXIS -------------------------------------------
function Axis(graphManager, ticks){
	this.svgManager = graphManager.svgManager;
	this.graphManager = graphManager;
	this._line;
	this._lineSettings = graphManager.settings.yAxis.lineSettings/*{stroke:'gray', strokeWidth:0.7}*/;
	this._labelsEnabled = graphManager.settings.yAxis.labelsEnabled;
	this._minValue;
	this._maxValue;
	this._labels;
	this._labelsNodes = [];
	this._labelsSettings = graphManager.settings.yAxis.labelSettings;
	this._ticks = ticks;
	this._title = graphManager.settings.yAxis.title;
	this._tittleSettings = {};
	this._label_unit = graphManager.settings.yAxis.label_unit;
}
$.extend(Axis.prototype,{
	
	calculateStep : function calculateStep(range, targetSteps){
		var tempStep = range/targetSteps;
		mag = Math.floor(log10(tempStep));
		magPow = Math.pow(10, mag);

		magMSD = tempStep/magPow + 0.5;
		// LOG(arguments,'',"magMSD = " + magMSD);

		if(magMSD > 5.0){
			magMSD = 10.0;
		}else if(magMSD > 2.5){
			magMSD = 5.0;
		}else if(magMSD > 2.0){
			magMSD = 2.5;
		}else if (magMSD > 1.0){
			magMSD = 2.0;
		}
		return magMSD*magPow;
	},
	// algotithm for "nice" values, but causes bug with displaying values
	// generateLabelsArray : function generateLabelsArray(tickStep, rangeObj){
	// 	var tmpArray = [];
	// 	var minBound = tickStep * Math.floor(rangeObj.minValue/tickStep);
	// 	var maxBound = tickStep * Math.round(1+rangeObj.maxValue/tickStep);
	// 	var labelValue = minBound; 
	// 	while(tmpArray.length <= this._ticks){
	// 		tmpArray.push(labelValue.toString());
	// 		labelValue += tickStep;
	// 	}
	// 	// tmpArray.push(maxBound);
	// 	LOG(arguments,'','ticks = ' + this._ticks + ' labels = ' + tmpArray + "  minValue = " + rangeObj.minValue + " maxValue = " + rangeObj.maxValue);
	// 	return tmpArray;

	generateLabelsArray : function generateLabelsArray(rangeObj){
		var tmpArray = [];
		var tickValue = rangeObj.range/this._ticks;
		// tmpArray.push(rangeObj.minValue.toString());
		for(var i=0; i <= this._ticks; i++){
			var value = (rangeObj.minValue+(i*tickValue)).toFixed(2);
			tmpArray.push(value.toString());
		}
		return tmpArray;
	},
	refreshLabels : function refreshLabels(graphArea,minValue,maxValue){

		// var rangeObj = this.graphManager.calculateRangeForYAxis(graphArea);
		// var step = this.calculateStep(rangeObj.range,this._ticks);
		// var labels = this.generateLabelsArray(step,rangeObj);
		// for(var len = this._labelsNodes.length; len > 0; len--){
		// 	$(this._labelsNodes[len],this.graphManager.svgManager.root()).text(labels[len]);
		// }

		var rangeObj = this.graphManager.calculateRangeForYAxis(graphArea);
		var labels = this.generateLabelsArray(rangeObj);
		// LOG(arguments,'',"_labelsNodes.length = " + this._labelsNodes.length + " | labels.length = " + labels.length + " | labels = " + labels);
		for(var len = this._labelsNodes.length; len >= 0; len--){
			$(this._labelsNodes[len],this.graphManager.svgManager.root()).text(labels[len]);
		}
	}

});

// TODO take care of font size on labels and order of magnitude of time
function TimeAxis(graphManager){
	var graphManager = graphManager;
	var _axisGroup;
	var _labelsGroup;
	var _labelsNodes = [];
	var _labelsSettings = graphManager.settings.xAxis.labelSettings/*{ textAnchor: 'middle', fontSize: 12, stroke:'none', fill:'blue'}*/;
	var _lineSettings = graphManager.settings.xAxis.lineSettings/*{ strokeWidth: 0.5, class_: 'axis',stroke:'red', scaleSize : 5}*/;
	return {
		drawAxis : function drawTimeAxis(graphArea,x1,y1,x2,y2,settings){
			_axisGroup = graphManager.svgManager.group(graphManager._graphArea._group, 'timeAxis', {class_ : "timeAxis"});
			_labelsGroup = graphManager.svgManager.group(_axisGroup);
			
			graphManager.svgManager.line(_axisGroup,x1,y1,x2,y2, $.extend({},_lineSettings, settings));
			
			var numberOfLabels = Math.ceil(graphManager._xAxisDateTimeRange/graphManager.settings.timeLabelsTick);
			var offset = graphArea._chartSVGSize.width/ numberOfLabels;
			var isFirstLabel = true;
			while(numberOfLabels >= 0){
				var lineOffset = numberOfLabels*offset;
				graphManager.svgManager.line(_labelsGroup, x1 + lineOffset, y1, x1 + lineOffset, y1+_lineSettings.scaleSize, _lineSettings/*{strokeWidth: 0.5}*/);
				var labelTime = (graphManager._getCurrentTimelineDate().getTime() - graphManager.settings.timePeriod) + numberOfLabels*graphManager.settings.timeLabelsTick;
				var labelDate = new Date(labelTime);
				if(!isFirstLabel){
					_labelsNodes.push(graphManager.svgManager.text(_labelsGroup, x1 + lineOffset, y1 + _lineSettings.scaleSize + _labelsSettings.fontSize, labelDate.toLocaleTimeString(), _labelsSettings ));
				}else{
					_labelsNodes.push(graphManager.svgManager.text(_labelsGroup, x1 + lineOffset, y1 + _lineSettings.scaleSize + _labelsSettings.fontSize, labelDate.toLocaleTimeString(), _labelsSettings ));
					isFirstLabel = false;
				}
				numberOfLabels--;
			}
		},
		redrawLabels : function redrawLabels(){
			var len = _labelsNodes.length;
			for(var i = len; i >= 0; i--){
				var labelTime = graphManager._getCurrentTimelineDate().getTime() -  i*graphManager.settings.timeLabelsTick;
				var labelDate = new Date(labelTime);
				$(_labelsNodes[i], graphManager.svgManager.root()).text(labelDate.toLocaleTimeString());
			}
		}

	}
}
// ## New approach to get immutable vars (closures!)
function DataSeries(measurements, name, id){
	var _id = id;
	var _measurements = measurements; // e.g. [ { value : 0.92, timestamp : 12435436 }];
	var _lastMeasurementXpoint = 0;
	var _maxValue = Math.max.apply(Math,_getValues(measurements));
	var _minValue = Math.min.apply(Math,_getValues(measurements));
	var _name = name ;
	var _dateOfLastUpdate = new Date(measurements.last().timestamp);
	var _element;
	var _seriesColor = get_random_color();
	
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
		if(_maxValue < newMaxValue){
				_maxValue = newMaxValue;
		}  
		var newMinValue = Math.min.apply(Math,valuesArray);
		if(_minValue > newMinValue){
			_minValue = newMinValue;
		}
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
		getSeriesID : function getSeriesID () {
			return _id;
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
		getSeriesColor : function getseriesColor () {
			return _seriesColor;
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
		if(this.graphManager.settings.chartOptions.horizontal_grid){
			graphArea._drawHorizontalGridLines(this.graphManager.settings.yAxis.ticks, this.graphManager.settings.chartOptions.gridSettings);
		}
		// if _defineDefs() is invoked here, moving patter doesn't work
		// this.graphManager._defineDefs();
	},
	// instead of using this._series use only new values to attach it to series line
	drawSeries : function drawSeries(graphArea, yScale, numberOfNewValuesToDrawInSeries){
		var seriesLength = this.graphManager._series.length;
		for (key in numberOfNewValuesToDrawInSeries){
			var series = this.graphManager._getSeriesByName(key);
			if(series != undefined){
				var measurementsToDraw = series.getMeasurmentsToDraw(numberOfNewValuesToDrawInSeries[key]);
				var seriesSvgElement = series.svgElement();
				
				var maxValue = this.graphManager._getMaxValueFromSeries();

				var isFirstValueOfSeries;
				if(seriesSvgElement == undefined){
					var timedifference = measurementsToDraw[0].timestamp - this.graphManager._currentTimelineDate.getTime();
					series.setLastMeasurmentXpoint(graphArea._chartSVGSize.width - graphArea._chartSVGSize.width/100 ); //set last valute point to svg width - padding 1/100 width
					var x = series.getLastMeasurmentXPoint() + timedifference*graphArea._chartSVGSize.width/this.graphManager._xAxisDateTimeRange;
					var y = this.graphManager.calculateYpoint(graphArea._chartSVGSize.height,maxValue, measurementsToDraw[0].value,graphArea.graphPadding);
					var tmpPath = graphArea.svgManager.createPath();
					var element = { 'path' : tmpPath,
									'pathNode' : graphArea.svgManager.path(graphArea._graphAreaGroup, tmpPath.move(x,y),
									$.extend({}, { stroke : this.graphManager.getColorForSeries(series.getSeriesID()), markerMid: this.graphManager.settings.dataSeries.seriesMarkers[series.getSeriesID()] ? 'url(#'+this.graphManager.settings.dataSeries.seriesMarkers[series.getSeriesID()]+ ')' : 'none' } , this.graphManager.settings.dataSeries.seriesPathSettings)) };
					series.svgElement(element);
					isFirstValueOfSeries = true;
				}
				
				var element = series.svgElement();
				element.path._path = element.pathNode.getAttribute('d');	
				var x;
				for(var i= isFirstValueOfSeries ? 1 : 0, l = measurementsToDraw.length; i < l; i++){
					var timedifference = measurementsToDraw[i].timestamp - this.graphManager._currentTimelineDate.getTime();
					x = series.getLastMeasurmentXPoint() + timedifference*graphArea._chartSVGSize.width/this.graphManager._xAxisDateTimeRange;
					var y = this.graphManager.calculateYpoint(graphArea._chartSVGSize.height,maxValue,measurementsToDraw[i].value,graphArea.graphPadding);
					element.path.line(x,y).path();
				}

				series.setLastMeasurmentXpoint(x);
				graphArea.svgManager.change(element.pathNode, {d: element.path.path()});
				series.svgElement(element);

			}
		}
	},
	drawAxes: function drawAxes(graphArea){
		// graphArea._drawAxis(this.graphManager._xAxis,'xAxis', 
		// 					graphArea._chartSVG.getAttribute('x'), 
		// 					graphArea._chartSVGSize.height+calculateRelativeValue(graphArea.svgManager._width(),graphArea.paddingTop),
		// 					parseInt(graphArea._chartSVGSize.width)+parseInt(graphArea._chartSVG.getAttribute('x')), 
		// 					graphArea._chartSVGSize.height+calculateRelativeValue(graphArea.svgManager._width(),graphArea.paddingTop));
		if(this.graphManager.settings.xAxis.enabled){
		this.graphManager._xAxis.drawAxis(graphArea, 
								parseInt(graphArea._chartSVG.getAttribute('x')),
								graphArea._chartSVGSize.height,
								graphArea._chartSVGSize.width + parseInt(graphArea._chartSVG.getAttribute('x')),
								graphArea._chartSVGSize.height);
		}
		if(this.graphManager.settings.yAxis.enabled){
			graphArea._drawAxis(this.graphManager._yAxis,'yAxis', 
								graphArea._chartSVG.getAttribute('x'), 
								graphArea._chartSVG.getAttribute('y'),
								graphArea._chartSVG.getAttribute('x'), 
								parseInt(graphArea._chartSVGSize.height)+parseInt(graphArea._chartSVG.getAttribute('y')));
			
		}

	},
	addSeries: function addSeries(){

	},
	// Area should be moved xScale * numberOfNewValuesToDraw px on each response with new values	
	moveArea:function moveArea(offset1){
		var offset = offset1*(-1);
		var objId = "."+this.graphManager.settings.name+'graphArea';

		 $(objId).get(0).setAttribute('transform', 'translate(' + offset +',0)');
		 // $(objId).animate({svgTransform : 'translate(' + offset +',0)'},100);

		var bg = $('#gridLines').get(0);
		var translate = [offset,0];
		translate = 'translate(' + translate + ')';
	    // bg.setAttribute('patternTransform', translate);

	},
	refreshGraph: function refreshGraph	(graphArea,numberOfNewValuesToDraw){
		var shouldUpscale = this.graphManager.calculateScale(graphArea._chartSVGSize.height, graphArea.graphPadding);
		this.drawSeries(graphArea,this.graphManager.yScale,numberOfNewValuesToDraw);// it was on the bottom

		if(shouldUpscale){
			graphArea._upscale(this.graphManager._series, graphArea._chartSVGSize.height, this.graphManager._getMaxValueFromSeries());
			if(this.graphManager.settings.yAxis.enabled){
				this.graphManager._yAxis.refreshLabels(graphArea,this.graphManager._getMinValueFromSeries(), this.graphManager._getMaxValueFromSeries());
			}				
		}
		
		var previousEndTimeLineDate = this.graphManager._getCurrentTimelineDate(); 
		this.graphManager._currentTimelineDate = this.graphManager._getDateOfLastUpdateFromAllSeries();

		if(this.xTranslate == undefined){
			this.xTranslate = 0;
		}
		this.xTranslate +=  ((this.graphManager._currentTimelineDate.getTime() - previousEndTimeLineDate.getTime())*graphArea._chartSVGSize.width/this.graphManager._xAxisDateTimeRange); 

		if(this.graphManager.settings.xAxis.enabled){
			this.graphManager._xAxis.redrawLabels(graphArea);
		}
		
		if(this.xTranslate > 0 ){
			this.moveArea(this.xTranslate);
		}				
	}
});

/**
* Section with built in buttons for activating and clearing interval
* To develop in new versions !
*/
function ControlPanel(graphManager){
	this.graphManager = graphManager;
	this.startStopButton = graphManager.svgManager.rect(graphManager.svgManager._width() - 40, 5,35 , graphManager.regionsSize.titleArea.height, {fill : 'red'}  );
	$(this.startStopButton).mouseover(function() {
		$(this).fadeIn();
	});
	$(this.startStopButton).mouseout(function () {
		$(this).fadeOut();
	});

}
//----------------------------------------------------------------------------
function calculateRelativeValue(ratio, wrapperSize,padding){
	if(padding != undefined){
		return wrapperSize*ratio + wrapperSize*padding;
	}
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
* Helper function to generate random colors for series
*/
function get_random_color(background) {
  function c() {
    return Math.floor(Math.random()*256).toString(16)
  }
  do{
	  var color = "#"+c()+c()+c();
  }while(color == background);
  return color;
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
function log10(val) {
  return Math.log(val) / Math.LN10;
}
/**
* Array of color for series
*/
var COLOR_ARRAY = [
'DeepSkyBlue',
'#2DC800',
'indianRed',
'gold',
'slateGray',
'red',
'limeGreen',
'#999',
'CornflowerBlue',
'mediumAquamarine',
'MidnightBlue',
'darkKhaki',
'peru',
'mediumOrchid',
'firebrick',
'orange',
'brown1',
'plum1',
'grey38'];
/**
* Array of available charts
*/
var CHARTTYPES = [];
CHARTTYPES['LineGraph'] = new LineGraph();
$.ChartsManager.addChartType('LineGraph', new LineGraph());
})(jQuery);











