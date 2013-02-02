$(function(){
	var svgline = $('div#svgLineGraph').SVGDynamicGraph_1('LineGraph',600,300, 
		// {legend: false, title:false,titleText: "Dynamic graph", yAxis: true, yAxisTicks: 10, timePeriod: 1000*30, timeLabelsTick : 1000*10, marker: 'circle'});
	{
		title : {
			text: "Dynamic graph"
		},  
		timePeriod: 1000*20, 
		timeLabelsTick : 1000*20, 
		callbackTime: 100,
		dataSeries : {
			seriesMarkers: [false]
		},
		yAxis : {
			title : "Sinus"
		},
		chartOptions : {
			// background : { fill : '#eee'}
		}
	});
	$("button.clear").click(function(){
		svgline.clearUpdate();
	});$("button.activate").click(function(){
		svgline.activateUpdate();
	});

	
	// var svg3 = $('div#svgLineGraph3').SVGDynamicGraph_1('LineGraph',400,200,{title:false, yAxis:true}).draw();
	// var svg1 = $('div#svgLineGraph2').SVGDynamicGraph_1('LineGraph',400,200,{title:true, yAxis:true}).draw();
	
	svgline.draw();
	
	var svg2 = $('div#svg').SVGDynamicGraph_1('LineGraph',800,400, { timePeriod : 1000*10, timeLabelsTick: 1000, callbackTime : 100});
	$("button.clear1").click(function(){
		svg2.clearUpdate();
	});$("button.activate1").click(function(){
		svg2.activateUpdate();
	});
	svg2.draw();
//	svgline.setCallback(function(){});

});
