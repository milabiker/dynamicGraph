// feautres 
//  -- dać uzytkownikowi możliwość tworzenia templatów wygladu wykresu (Elycharts)
// 	-- każda wartość powinna mieć swoją labelke, zastanwić sie jak je wyświetlać, uzytkownik powinien miec mozliwosc
//		ustawienia ile labalek powinno byc w polu wykresu 
		/*series = { 	seria_1 : [ {value : 10.1, label : '2000'}, 
							 	{value : 10.5, label : '2001'}
							 	{value : 10.9, label : '2002'}],
					seria_2 : [	{value : 9.50, label : '2001'}]   
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
			this.graphManager = new GraphManager(this, charttype, width,height);
			charttype.initialize(this.graphManager);
			return this.graphManager;
		}else{
			console.error('SVGDynamincGraph: Wrong chart type');
		}
	};
//===============================================================================================================
//========================================== Graph Manager ======================================================

function GraphManager(element, charttype, width, height){
	$(element).svg({settings : { width: width, height : height}});
	mysvg = $(element).svg('get');
	mysvg._container = mysvg._svg;
	this.svgManager = mysvg;
	this.charttype = charttype;
	//------- set up legend or title visible (temporary) ---------------------
	this.isLegend = true;
	this.isTitle = true;
	//-----------------
	this._series = [];
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
	this._xAxis = new Axis(this,12);
	this._yAxis = new Axis(this,5);
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
	addSeries : function(valuesArray){
		if(typeof valuesArray == 'object'){
			for( key in valuesArray){
				if(valuesArray.hasOwnProperty(key)){
					console.log("Klucz : " + key);
				}
			}
		}
//		returning this to be able to use it after other SVGDynamicGraph function 
		return this;
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
		this._drawGridLines();


		//------------------------------------------------------------------------------------------------------
	// trail with animation

		var polyline = this.svgManager.polyline(this._graphAreaGroup, [[0,300],[10,250],[30,100],[50,124],[70,190],[100,20],[130,170],[170,120],[200, 100],[220,140],[250,190],[300,250],[500,10]],{fill:"none", stroke:"red", strokeWidth:2, markerMid:"url(#circles)"});	
		
		this.path = this.svgManager.createPath();
		//svg.path(this._graphAreaGroup, this.path.line(250,100), {fill: 'none',stroke: 'red', markerMid: 'url(#circles)'});
		var path2 = this.svgManager.path(this._graphAreaGroup, this.path.move(0,0).line(20,250).line(40,200).line(60,220).line(80,240).line(100,220), {fill: 'none',stroke: 'red', strokeWidth: 2, markerMid: 'url(#circles)'});
		this.svgManager.change(path2, {d: this.path.line(340,180).path()});

	//	this.svgManager.rect(this._group,0,0,40,50, {fill:'yellow'});

		var liczba = 0;
		//self.setInterval(this._moveArea,1000,{polyline : polyline, offset : liczba, svgManager : this.svgManager});
		self.setInterval(this._moveArea,3000,{path : this.path, pathElement: path2, offset : liczba, svgManager : this.svgManager, _chartSVGSize : this._chartSVGSize});
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

	// - should be implemented in each graph type later!
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
	this._labels = labels || [];
	this._name = name || '';
	this._dateOfLastUpdate; // Value which allows to get new values since last update
}
$.extend (Series.prototype, {
	// values - array of new values
	// extendValues - (boolean) if true extend current array, else override _values
	values : function (values,extendValues){
		if(arguments.length == 0){
			return this._values;
		}
		if(extendValues){
			$.extend(this._values, values);
		}
	}
	labels : function(labels, extendLabels){
		if(arguments.length == 0){
			return this._labels;
		}
		if(extendLabels){
			$.extend(this._labels, labels);
		}	
	}
	name : function(name){
		if(arguments.length == 0){
			return this._name;
		}
		this._name = name ;
	}
	newValues : function(values, labels, dateOfLastUpdate){
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
		this.drawAxes(graphArea);
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
/**
* Array of available charts
*/
var CHARTTYPES = [];
CHARTTYPES['LineGraph'] = new LineGraph();
})(jQuery);











