
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
$.fn.SVGDynamicGraph = function(width, height, settings){
	alert(calculateElementRelativeSize(100,100, 0.8,1.0,[0.1,0.2,0.1,0.2]));
	$(this).svg({settings : { width: width, height : height}});
	svg = $(this).svg('get');
	//svg.container(svg);
//--------------- important!------------------
// -------changed container from div to SVGElement -----------
	svg._container = svg._svg;
	GraphManager = new GraphManager(svg);
	return svg;
};
//===============================================================================================================
//========================================== Graph Manager ======================================================

function GraphManager(SVG){
	this.svgManager = SVG;
	this.isLegend = false;
	this.isTitle = false;
	this._series = {};
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
	var line = new LineGraph(this);
}
$.extend(GraphManager.prototype,{
	_getRegionWidthRatio : function _getRegionWidthRatio(regionName){
		return this.regions[regionName].x.toX - this.regions[regionName].x.fromX;
	},
	_getRegionHeightRatio : function _getRegionHeightRatio(regionName){
		return this.regions[regionName].y.toY - this.regions[regionName].y.fromY;
	},
	_defineDefs : function(){
		var defs = this.svgManager.defs('myDefs1');
		var gridlines = this.svgManager.pattern(defs, "gridLines", 0,0,200,100, 0,0,100,50, {patternUnits: 'userSpaceOnUse'});
		var line1 = this.svgManager.line(gridlines, 0,0,100,0,{strokeDashArray:"2,2", stroke:"green", strokeOpacity:0.7,	 strokeWidth:1});
		var line2 = this.svgManager.line(gridlines, 0,0,0,100,{strokeDashArray:"2,2", stroke:"green", strokeOpacity:0.4, strokeWidth:1});

		var marker = this.svgManager.marker( defs, 'circles', 8, 8, 15, 15, 'auto',{ markerUnits:"strokeWidth"});
		var markerCircle = this.svgManager.circle(marker, 8,8,2, {fill:"none", stroke:'red', strokeWidth:'1'});

	}
});

//===============================================================================================================
//=============================================== Graph Area =======================================================
function GraphArea(GraphManager){
	this.svgManager = GraphManager.svgManager;
	this.padding = 0.1;
	this.paddingLeft=0.05;
	this.paddingRight = 0.01;
	this.paddingBottom = 0.15;
	this._group = this.svgManager.group("graphRegion", {class: "group1", transform: 'scale(1,1)'});
	
	// --- changing group position if legend or title are shown
	this.svgManager.change(this._group, {transform:'scale(1,1) translate('+ 
					(GraphManager.isLegend == true ? calculteRelativeValue(GraphManager.regions.graph.x.fromX,this.svgManager._width()) : 0) 
					+','+ 
					(GraphManager.isTitle == true ? calculteRelativeValue(GraphManager.regions.graph.y.fromY,this.svgManager._height()) : 0) 
					+')'});

	// [width,height]
	this._chartSVGSize = calculateElementRelativeSize(this.svgManager._width(),
													this.svgManager._height(), 
													 (GraphManager.isLegend == true ? GraphManager._getRegionWidthRatio('graph') : 0), 
													 (GraphManager.isTitle == true ? GraphManager._getRegionHeightRatio('graph') : 0),
													[this.paddingLeft, 0, this.paddingRight, this.paddingBottom]);
	//alert(this._chartSVGSize); 	
	this._chartSVG = this.svgManager.svg(this._group,
										this.svgManager._width()*this.paddingLeft,
										0, 
										this._chartSVGSize[0],
										this._chartSVGSize[1]);
	this._graphAreaGroup = this.svgManager.group(this._chartSVG, "graphArea", {class: 'graphArea'});
//------------------------------------------------------------------------------------------------------
// trail with animation
	this._drawGridLines();
	var polyline = svg.polyline(this._graphAreaGroup, [[0,300],[10,250],[30,100],[50,124],[70,190],[100,20],[130,170],[170,120],[200, 100],[220,140],[250,190],[300,250],[500,10]],{fill:"none", stroke:"red", strokeWidth:2, markerMid:"url(#circles)"});	
	
	this.path = svg.createPath();
	//svg.path(this._graphAreaGroup, this.path.line(250,100), {fill: 'none',stroke: 'red', markerMid: 'url(#circles)'});
	var path2 = svg.path(this._graphAreaGroup, this.path.move(0,0).line(20,250).line(40,200).line(60,220).line(80,240).line(100,220), {fill: 'none',stroke: 'red', strokeWidth: 2});
	alert(this.path);
	alert(this.path.line(320,150).path());
	svg.change(path2, {d: this.path.line(340,180).path()});

//	this.svgManager.rect(this._group,0,0,40,50, {fill:'yellow'});

	var liczba = 0;
	//self.setInterval(this._moveArea,1000,{polyline : polyline, offset : liczba, svgManager : this.svgManager});
	self.setInterval(this._moveArea,3000,{path : this.path, pathElement: path2, offset : liczba, svgManager : this.svgManager, _chartSVGSize : this._chartSVGSize});

};
$.extend(GraphArea.prototype,{
	_drawGridLines : function(){
		var background = this.svgManager.rect(this._chartSVG,0,0,this._chartSVGSize[0],this._chartSVGSize[1],{id: "graphBackground",fill: 'none', fill: 'url(#gridLines)'});
		
	},
	_moveArea: function(obj){
		//var attr = obj.polyline.getAttribute('transform');
		obj.offset -= 10;
		obj.path.line(340+(obj.offset*(-1)),(Math.random()*obj._chartSVGSize[1])*0.5);
		svg.change(obj.pathElement,{d:  obj.path.path()} );
//		$(linia).animate( {svgTransform: 'translate('+obj.offset+',0)'},0);

		$('#graphArea').animate( {svgTransform: 'translate(' + obj.offset +',0)'}, 100);
		// --------------- moving gridlines ---------------
		var bg = $('#gridLines').get(0);
		var matrix = [obj.offset,0,0,0,obj.offset,100];
		matrix = 'matrix(' + matrix + ')';
		var translate = [obj.offset,0];
		translate = 'translate(' + translate + ')';
	    //bg.setAttribute('patternTransform', matrix);
	    bg.setAttribute('patternTransform', translate);
	},
	addSeries : function(obj){
		GraphManager.series = obj;
	}
});

//=======================================================================================================================
//-------------------------------------------------TITLE-----------------------------------------------------------------
function TitleArea(GraphManager){
	this.svgManager = GraphManager.svgManager;
	this._group = this.svgManager.group("titleArea", 
										{transform : 'translate(' + 
														calculteRelativeValue(GraphManager.regions['title'].x.fromX, this.svgManager._width())
														+ ', '+
														calculteRelativeValue(GraphManager.regions['title'].y.fromY, this.svgManager._height())+')',
														class: "title", 
														fill: 'red'});
	var size = calculateElementRelativeSize(this.svgManager._width(), this.svgManager._height(), GraphManager._getRegionWidthRatio('title'), GraphManager._getRegionHeightRatio('title')); 
	svg.rect(this._group,0,0,size[0],size[1]);
};
$.extend(TitleArea.prototype,{

});
//=======================================================================================================================
//----------------------------------------------- LEGEND ----------------------------------------------------------------
function LegendArea(GraphManager){
	this.svgManager = GraphManager.svgManager;
	this._group = this.svgManager.group("legendArea", {transform : 'translate(' +
														calculteRelativeValue(GraphManager.regions['legend'].x.fromX, this.svgManager._width())
														+ ', '+
														calculteRelativeValue(GraphManager.regions['legend'].y.fromY, this.svgManager._height()) +') ',
														fill: 'blue'});
	svg.rect(this._group,0,0,this.svgManager._width()*GraphManager._getRegionWidthRatio('legend'),this.svgManager._height()*GraphManager._getRegionHeightRatio('legend'));
}

//===============================================================================================================
//------------------------------------------------ Line Graph --------------------------------------------------
function LineGraph(graphManager){
	this._graphManager = graphManager;
};

$.extend(LineGraph.prototype, {
	draw: function(){

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
})(jQuery);











