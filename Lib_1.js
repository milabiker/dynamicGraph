// feautres 
//  -- dać uzytkownikowi możliwość tworzenia templatów wygladu wykresu (Elycharts)
// 	-- każda wartość powinna mieć swoją labelke, zastanwić sie jak je wyświetlać, uzytkownik powinien miec mozliwosc
//		ustawienia ile labalek powinno byc w polu wykresu 
		/*series = { 	seria_1 : { values : [10.1, 10.5, 10.8, 9.50], labels : ['2000','2001','2002','2003']}, 
						seria_2 : { values : [9.50, 10, 9.2, 9.8,],    labels : ['2001','2002','2003','2004']}   
					};*/
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
		ticks : 10,
	}

	$(element).svg({settings : { width: width, height : height}});
	mysvg = $(element).svg('get');
	mysvg._container = mysvg._svg;
	this.svgManager = mysvg;
	this.charttype = charttype;
	this.settings = $.extend({}, this.defaultSettings, settings);
	//------- set up legend or title visible (temporary) ---------------------
	this.isLegend = true;
	this.isTitle = true;
	//-----------------
	this._series = [new DataSeries([1.0,800,4.5,2.0,1.0,3.0,1.4,8.0,2.0,7.0], [1,2,3,4,5,6,7,8,9,10], 'First')];
	this._addSeries({ 	'seria_1' : { values : [10.1, 10.5, 10.8, 9.50], labels : ['2000','2001','2002','2003']}, 
						'seria_2': { values : [9.50, 10, 9.2, 9.8,],    labels : ['2001','2002','2003','2004']}});
	this._addSeries({ 	'seria_1' : { values : [10.1, 10.5, 10.8, 9.50], labels : ['2000','2001','2002','2003']}, 
						'seria_2': { values : [9.50, 10, 9.2, 9.8,],    labels : ['2001','2002','2003','2004']}});
	this._printSeries();
	this._xAxis = new Axis(this,12);
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

		/* returning this to be able to use it after other SVGDynamicGraph function */		
		return this;
	},
	_defineDefs : function(){
		var defs = this.svgManager.defs('myDefs1');
		var gridlines = this.svgManager.pattern(defs, "gridLines", 0,0,200,100, 0,0,100,50, {patternUnits: 'userSpaceOnUse'});
		var line1 = this.svgManager.line(gridlines, 0,0,100,0,{strokeDashArray:"2,2", stroke:"green", strokeOpacity:0.7,	 strokeWidth:1});
		var line2 = this.svgManager.line(gridlines, 0,0,0,100,{strokeDashArray:"2,2", stroke:"green", strokeOpacity:0.4, strokeWidth:1});

		var marker = this.svgManager.marker( defs, 'circles', 8, 8, 15, 15, 'auto',{ markerUnits:"strokeWidth"});
		var markerCircle = this.svgManager.circle(marker, 8,8,2, {fill:"white", stroke:'red', strokeWidth:'1'});

	},	
	/*
	* Function to add new series or update existing with new values
	* @param DataSeries - object literal (JSON) with new values	
	*/
	_addSeries : function(dataSeries){
		if(typeof dataSeries == 'object'){
			console.log("array size compare : " + Object.size(dataSeries) + " > " + this._series.length);
			// if length of DataSeries is larger than _series, we need to add new DataSeries, else we just update current series 
			if(Object.size(dataSeries) > this._series.length){

				console.log("_addSeries | adding new series");
				for( key in dataSeries){
					if(dataSeries.hasOwnProperty(key)){
						// console.log("Klucz : " + key);
						// console.log("Values : " + dataSeries[key].values);
						// console.log("labels : " + dataSeries[key].labels);
						this._series.push(new DataSeries(dataSeries[key].values, dataSeries[key].labels, key));
					}
				}
			}else{

				// TODO does't work
				console.log("_addSeries | updating series");
				for( key in dataSeries){
					if(dataSeries.hasOwnProperty(key)){
						for(var i=0, l=this._series.length; i < l; i++){
							// console.log("Klucz : " + key);
							// console.log("Values : " + DataSeries[key].values);
							// console.log("labels : " + DataSeries[key].labels);
							if(this._series[i].name() == key){
								console.log("Series " + key + "found");
								this._series[i].update(dataSeries[key].values,dataSeries[key].labels);
							}else{
								console.log("Series not found yet");
							}
						}
					}
				}
			}
		}
//		returning this to be able to use it after other SVGDynamicGraph function 
		return this;
	},
	_getMaxValueFromSeries: function(){
		var arrayOfMaxValues = [];
		for(var i=0, l=this._series.length; i<l; i++){
			console.log(this._series[i]._name + ' maxValue = ' + this._series[i]._maxValue);
			arrayOfMaxValues.push(this._series[i]._maxValue);
		}
		return arrayOfMaxValues.length != 0 ? Math.max.apply(Math,arrayOfMaxValues) : undefined;
	},
	_printSeries:function(){
		for(var i=0, l=this._series.length; i<l; i++){
			console.log("Name : " + this._series[i].name());
			console.log("\tValues : " + this._series[i].values());
			console.log("\tLabels : " + this._series[i].labels());

		}
	}
});

//===============================================================================================================
//=============================================== Graph Area =======================================================
function GraphArea(GraphManager){
	this.svgManager = GraphManager.svgManager;
	this.GraphManager = GraphManager;
	this.padding = 0.1;
	this.paddingLeft=0.1;
	this.paddingRight = 0.01;
	this.paddingBottom = 0.1;
	this.paddingTop = 0.01;
};
$.extend(GraphArea.prototype,{
	_draw: function(){
		this._group = this.svgManager.group("graphRegion", {class: "group1", transform: 'scale(1,1)'});
	
		// --- changing group position if legend or title are shown
		this.svgManager.change(this._group, {transform:'scale(1,1) translate('+ 
						(this.GraphManager.isLegend == true ? calculteRelativeValue(this.GraphManager.regions.graph.x.fromX,this.svgManager._width()) : 0) 
						+','+ 
						(this.GraphManager.isTitle == true ? calculteRelativeValue(this.GraphManager.regions.graph.y.fromY,this.svgManager._height()) : 0) 
						+')'});

		// [width,height]
		this._chartSVGSize = calculateElementRelativeSize(this.svgManager._width(),
														this.svgManager._height(), 
														 (this.GraphManager.isLegend == true ? this.GraphManager._getRegionWidthRatio('graph') : 0), 
														 (this.GraphManager.isTitle == true ? this.GraphManager._getRegionHeightRatio('graph') : 0),
														[this.paddingLeft, 0, this.paddingRight, this.paddingBottom]);
		
		//alert(this._chartSVGSize); 	
		this._chartSVG = this.svgManager.svg(this._group,
											this.svgManager._width()*this.paddingLeft,
											this.svgManager._width()*this.paddingTop, 
											this._chartSVGSize[0],
											this._chartSVGSize[1]);

		this._graphAreaGroup = this.svgManager.group(this._chartSVG, "graphArea", {class: 'graphArea'});


		//------------------------------------------------------------------------------------------------------

		//var polyline = this.svgManager.polyline(this._graphAreaGroup, [[0,300],[10,250],[30,100],[50,124],[70,190],[100,20],[130,170],[170,120],[200, 100],[220,140],[250,190],[300,250],[500,10]],{fill:"none", stroke:"red", strokeWidth:2, markerMid:"url(#circles)"});	
	
	},
	_drawGridLines : function(){
		var background = this.svgManager.rect(this._chartSVG,0,0,this._chartSVGSize[0],this._chartSVGSize[1],{id: "graphBackground",fill: 'none', fill: 'url(#gridLines)'});
		
	},
	_drawAxis: function(axis,id, x1,y1,x2,y2){
		var x1 = parseInt(x1);
		var y1 = parseInt(y1);
		var x2 = parseInt(x2);
		var y2 = parseInt(y2);
		
		axis._line = this.svgManager.line(this._group, x1, y1, x2, y2, axis._lineSettings);
		var len = 10;
		if(x1 == x2 ){
			console.log('Horizontal Axis');
			var axisLength = y2 - y1;
			var offset = Math.round(axisLength/axis._ticks);
			var counter = 0;
			while(counter < axis._ticks){
				lineOffset = counter*offset;
				this.svgManager.line(this._group, x1-len, y2 - lineOffset, x1, y2 - lineOffset);
				counter++;
			}
		}else if( y1 == y2){			
			var axisLength = x2 - x1;
			var offset = Math.round(axisLength/axis._ticks);
			var counter = 0;
			while(counter < axis._ticks){
				lineOffset = counter*offset;
				this.svgManager.line(this._group, x1 + lineOffset, y1, x1 + lineOffset, y1+len, {strokeWidth: 1});
				counter++;
			}
			
		}
	},

	// TODO - should be implemented in each graph type later!
	_moveArea: function(obj){
		//var attr = obj.polyline.getAttribute('transform');
		for (var i=0;i<5;i++){
			obj.offset -= 20;
			obj.path.line(340+(obj.offset*(-1)),(Math.random()*obj._chartSVGSize[1])*0.5);
		}
		obj.svgManager.change(obj.pathElement,{d:  obj.path.path()} );
//		$(linia).animate( {svgTransform: 'translate('+obj.offset+',0)'},0);

		$('#graphArea').animate( {svgTransform: 'translate(' + obj.offset +',0)'}, 10*100);
		
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
function TitleArea(GraphManager){
	this.svgManager = GraphManager.svgManager;
	this.GraphManager = GraphManager;
	};
$.extend(TitleArea.prototype,{
	_draw : function(){
		this._group = this.svgManager.group("titleArea", 
											{transform : 'translate(' + 
															calculteRelativeValue(this.GraphManager.regions['title'].x.fromX, this.svgManager._width())
															+ ', '+
															calculteRelativeValue(this.GraphManager.regions['title'].y.fromY, this.svgManager._height())+')',
															class: "title", 
															fill: 'red',stroke: 'none'});
		var size = calculateElementRelativeSize(this.svgManager._width(), this.svgManager._height(), this.GraphManager._getRegionWidthRatio('title'), this.GraphManager._getRegionHeightRatio('title')); 
		this.svgManager.rect(this._group,0,0,size[0],size[1]);
		this.svgManager.text(this._group, 10, 25, "Title", {fontFamily: 'Verdana', fontSize: '25', fill: 'yellow', stroke: 'none'}); 		
	}
});
//=======================================================================================================================
//----------------------------------------------- LEGEND ----------------------------------------------------------------
function LegendArea(GraphManager){
	this.svgManager = GraphManager.svgManager;
	this.GraphManager = GraphManager;
}
$.extend(LegendArea.prototype,{
	_draw: function(){
		this._group = this.svgManager.group("legendArea", {transform : 'translate(' +
														calculteRelativeValue(this.GraphManager.regions['legend'].x.fromX, this.svgManager._width())
														+ ', '+
														calculteRelativeValue(this.GraphManager.regions['legend'].y.fromY, this.svgManager._height()) +') ',
														fill: 'blue'});
		this.svgManager.rect(this._group,0,0,this.svgManager._width()*this.GraphManager._getRegionWidthRatio('legend'),this.svgManager._height()*this.GraphManager._getRegionHeightRatio('legend'));
		this.svgManager.text(this._group, 10, 100, "Legend", {fontFamily: 'Verdana', fontSize: '25', fill: 'yellow', stroke: 'none'}); 
	}
});

//=========================================================================================================================
//----------------------------------------- AXIS -------------------------------------------
function Axis(graphManager, ticks){
	this.svgManager = graphManager.svgManager;
	this.GraphManager = graphManager;
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
function DataSeries(values, labels, name){
	this._values = values || [];
	this._maxValue = Math.max.apply(Math,this._values);
	this._labels = labels || [];
	this._name = name || '';
	this._dateOfLastUpdate; // Value which allows to get new values since last update
}
$.extend (DataSeries.prototype, {
	// values - array of new values
	// extendValues - (boolean) if true extend current array, else override _values
	values : function (values,extendValues){
		if(arguments.length == 0){
			return this._values;
		}
		if(extendValues){
			$.extend(this._values, values);
			console.log("Values = " + this._values);
		}
		this._minValue = Math.max.apply(Math,this._values);
	},
	labels : function(labels, extendLabels){
		if(arguments.length == 0){
			return this._labels;
		}
		if(extendLabels){
			$.extend(this._labels, labels);
		}	
	},
	name : function(name){
		if(arguments.length == 0){
			return this._name;
		}
		this._name = name ;
	},
	update : function(values, labels, dateOfLastUpdate){
		this.values(values, true);
		this.labels(labels,true);
		this._dateOfLastUpdate = dateOfLastUpdate;
	}
});
//===============================================================================================================
//------------------------------------------------ Line Graph --------------------------------------------------
function LineGraph(){
};

$.extend(LineGraph.prototype, {
	initialize: function(graphManager){
		this.GraphManager = graphManager;
	},
	draw: function(graphArea){
		var xScale = Math.round(graphArea._chartSVGSize[0]/this.GraphManager.settings.ticks);
		var yScale = Math.round(graphArea._chartSVGSize[1]/this.GraphManager._getMaxValueFromSeries());
		console.log("xScale = " + xScale);
		console.log("yScale = " + yScale);

/*		this.path = graphArea.svgManager.createPath();
		var pathElement = graphArea.svgManager.path(graphArea._graphAreaGroup, this.path.move(,0).line(20,250).line(40,200).line(60,220).line(80,240).line(100,220), {fill: 'none',stroke: 'red', strokeWidth: 2, markerMid: 'url(#circles)'});
		graphArea.svgManager.change(pathElement, {d: this.path.line(340,180).path()});
*/
		//var liczba = 0;
		//self.setInterval(graphArea._moveArea,3000,{path : this.path, pathElement: path2, offset : liczba, svgManager : graphArea.svgManager, _chartSVGSize : graphArea._chartSVGSize});
		this.drawSeries(graphArea,xScale,yScale);
		this.drawAxes(graphArea);
		graphArea._drawGridLines();
	},
	drawSeries : function(graphArea, xScale, yScale){
		for(var i=0, l=this.GraphManager._series.length; i<l; i++){
			var values = this.GraphManager._series[i].values();
			var path = graphArea.svgManager.createPath();
			var pathElement = graphArea.svgManager.path(graphArea._graphAreaGroup, path.move(0,graphArea._chartSVGSize[1] - values[0]*yScale),{fill: 'none',stroke: 'gray', strokeWidth: 2, markerMid: 'url(#circles)'});

				//.line(20,250).line(40,200).line(60,220).line(80,240).line(100,220), {fill: 'none',stroke: 'red', strokeWidth: 2, markerMid: 'url(#circles)'});
			for(var j=1, len=this.GraphManager._series[i]._values.length; j<len; j++){
				var x = j*xScale;
				var y = graphArea._chartSVGSize[1] - values[j]*yScale;
				// console.log("(" + x + ", " + y + " )");
				// console.log("#(" + j*xScale + " ," + values[j]*yScale);
				graphArea.svgManager.change(pathElement, {d: path.line(x,y).path()});
			}
		}
	},
	drawAxes: function(graphArea){
		graphArea._drawAxis(this.GraphManager._xAxis,'xAxis', 
							graphArea._chartSVG.getAttribute('x'), 
							graphArea._chartSVGSize[1]+calculteRelativeValue(graphArea.svgManager._width(),graphArea.paddingTop),
							parseInt(graphArea._chartSVGSize[0])+parseInt(graphArea._chartSVG.getAttribute('x')), 
							graphArea._chartSVGSize[1]+calculteRelativeValue(graphArea.svgManager._width(),graphArea.paddingTop));
		graphArea._drawAxis(this.GraphManager._yAxis,'yAxis', 
							graphArea._chartSVG.getAttribute('x'), 
							graphArea._chartSVG.getAttribute('y'),
							graphArea._chartSVG.getAttribute('x'), 
							parseInt(graphArea._chartSVGSize[1])+parseInt(graphArea._chartSVG.getAttribute('y')));

	},
	addSeries: function(){

	},

});
//-------------------------------------------------------------------------

function calculteRelativeValue(wrapperSize, ratio){
	return wrapperSize*ratio;
}

/**
* # Function to calcute relative size inside element
* wprapperSize - size of containing element (e.g SVG)
* ratio - ratio of element size to wrapper size, leave blank if not needed
* optPadding - array [leftPadding, topPadding, rightPadding, bottomPadding] 
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
* Array of available charts
*/
var CHARTTYPES = [];
CHARTTYPES['LineGraph'] = new LineGraph();
})(jQuery);











