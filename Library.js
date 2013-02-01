$(function(){
	var svgline = $('div#svgLineGraph').SVGDynamicGraph_1('LineGraph',400,200, {legend: false, title:true,titleText: "Dynamic graph", yAxis: true, yAxisTicks: 5, timePeriod: 1000*30, timeLabelsTick : 1000*10, marker: 'circle'});
	$("button.clear").click(function(){
		svgline.clearUpdate();
	});$("button.activate").click(function(){
		svgline.activateUpdate();
	});

	
	// var svg3 = $('div#svgLineGraph3').SVGDynamicGraph_1('LineGraph',400,200,{title:false, yAxis:true}).draw();
	// var svg1 = $('div#svgLineGraph2').SVGDynamicGraph_1('LineGraph',400,200,{title:true, yAxis:true}).draw();
	
	
	var svg2 = $('div#svg').SVGDynamicGraph_1('LineGraph',400,200,{title:true, yAxis:true});
	$("button.clear1").click(function(){
		svg2.clearUpdate();
	});$("button.activate1").click(function(){
		svg2.activateUpdate();
	});
	svgline.draw();
	svg2.draw();
//	svgline.setCallback(function(){});

});
