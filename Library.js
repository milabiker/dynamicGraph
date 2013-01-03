$(function(){
	//var svg = $('div#svg1').SVGDynamicGraph(600,400);	
//	var svg2 = $('div#svg').SVGDynamicGraph(400,200).draw().addSeries({seriapierwsza : [12,12,13], seriadruga : [12,12,13]});
	//var svgline = $('div#svgLineGraph').SVGDynamicGraph_1.LineGraph.initialize(200,200).show();
	var svgline = $('div#svgLineGraph').SVGDynamicGraph_1('LineGraph',500,300);

	svgline.draw();
});

/*$(function() {
	$("div#svg").svg({onLoad: draw , settings: {width:400, height:500}});
	//$("div#svg1").svg();
	//var mySvg = $("div#svg1").svg('get');
	//var myLib = mySvg.dynamicGraph.init();
});
 
function draw(svg){
	xDim = svg._svg.getAttribute('width');
	yDim = svg._svg.getAttribute('height');
// defs
	var defs = svg.defs('myDefs');
	var gridlines = svg.pattern(defs, "gridLines", 0,0,10,10, 0,0,10,10, {patternUnits: 'userSpaceOnUse'});
	var line1 = svg.line(gridlines, 0,0,xDim*0.1,0,{strokeDashArray:"2,2", stroke:"blue", strokeOpacity:0.7,	 strokeWidth:1});
	var line2 = svg.line(gridlines, 0,0,0,xDim*0.1,{strokeDashArray:"2,2", stroke:"blue", strokeOpacity:0.4, strokeWidth:1});
	var marker = svg.marker( defs, 'circles', 8, 8, 15, 15, 'auto',{ markerUnits:"strokeWidth"});
	var markerCircle = svg.circle(marker, 8,8,2, {fill:"none", stroke:'red', strokeWidth:'1'});
	var patternAxisgrad = svg.pattern(defs, "graduationLinesAxisX", 0,0,60,60, 0,0,50,50, {patternUnits: 'userSpaceOnUse'});
	var graduationLine = svg.line(patternAxisgrad, 0,0,10,10, {stroke:"red", strokeWidth:2});

//graphing area
	var graphAreaGroup = svg.group("graphArea",{stroke:"green"});
	var background = svg.rect(graphAreaGroup,0,0,calc(0.9,'x',svg),calc(0.9,'y',svg),{fill:"none", fill:"url(#gridLines)"});
	var polyline = svg.polyline(graphAreaGroup, [[0,300],[10,250],[30,100],[50,124],[70,190],[100,20],[130,170],[170,120],[200, 100],[220,140],[250,190],[300,250],[500,10]],{fill:"none", stroke:"red", strokeWidth:2, markerMid:"url(#circles)"});	
//	alert(background.getAttribute('width'));
	
	// graphing
	var xAxis = svg.line(graphAreaGroup, 0,background.getAttribute('height'), background.getAttribute('width'), background.getAttribute('height') , {strokeWidth:3, fill:"url(#graduationLinesAxisX)"});
	//alert(svg._svg.getAttribute('width'));
	
	var points = polyline.getAttribute('points');
	//alert(points);
	// grupy
	g2 = svg.group();
	var path = svg.createPath(); 
	svg.path(g2,path.move(50, 90).line(100,200).line(200,300),  
		{fill: 'none', stroke: '#D90000', strokeWidth: 10});
	path.path(path.line(300,400));
	//var table = pathArray.split(',');
//	alert(svg._svg.getAttribute('x'));
	console.log(path._path);
	
	// zeby poruyszyc ca³a grup¹, np ca³ym wykresem, zamiast tylko linia !
	$(g2).animate( {svgTransform: 'translate(100,0)'},900);
	$(graphAreaGroup).animate({svgTransform: 'translate(150,0)'}, 2000);
	
	//----------------------------------------------------------
	
	 svg.graph.noDraw().title('Browser Usage', 'blue'). 
        addSeries('IE', [95.97, 91.80, 88.16, 86.64], 
            'lightblue', 'blue', 3). 
        addSeries('Netscape', [3.39, 2.83, 1.61, 0.00], 
            'pink', 'red', 3). 
        addSeries('Firefox', [0.00, 4.06, 8.13, 9.95], 
            'lightgreen', 'green', 3). 
        format('ivory', 'gray'). 
        gridlines({stroke: 'gray', strokeDashArray: '2,2'}, 'gray').type('line', {explode: 2, explodeDist: 10}).redraw();
	
}*/

/*function calc(number, whichDim, svg){
	xDim = svg._svg.getAttribute('width');
	yDim = svg._svg.getAttribute('height');	
	if(whichDim == 'x'){
		return xDim*number;
	}else if(whichDim == 'y'){
		return yDim*number;
	}
};
function valuesToPx(values,areaWidth,areaHeight){
	var max = Math.max(values);
	var min = Math.min(values);
	
	
}*/