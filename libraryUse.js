$(function(){
	//--------------------------------------------------------------------------
	var svgline = $('div#svgLineGraph').SVGDynamicGraph_1('LineGraph',600,300, 
						{
							title : {
								enabled : false,
								text: "Dynamic graph"
							},  
							timePeriod: 1000*10, 
							timeLabelsTick : 1000*1, 
							callbackTime: 1000,
							dataSeries : {
								seriesMarkers: [false,'circle']
							},
							yAxis : {
								enabled : true,
								title: 'My title',
								label_unit:' [ j ]'
							},
							xAxis : {
								enabled : true
							},
							chartOptions : {
								background : { fill : '#eee'}
							}
					});
	/*svgline.setCallback(function(){
		console.log("it's my callback !")
		svgline._timerID = setTimeout(svgline.callback,1000,svgline);
	});*/
	$("button.clear").click(function(){
		svgline.clearUpdate();
	});$("button.activate").click(function(){
		svgline.activateUpdate();
	});
	
	svgline.draw();

//--------------------------------------------------------------------------------
	
	var svg3 = $('div#svgLineGraph3').SVGDynamicGraph_1('LineGraph',400,200, { timeLabelsTick: 2000, timePeriod : 1000*10}).draw();
	var svg1 = $('div#svgLineGraph2').SVGDynamicGraph_1('LineGraph',400,200, { timeLabelsTick: 2000, timePeriod : 1000*10}).draw();
	
	
	var svg2 = $('div#svg').SVGDynamicGraph_1('LineGraph',600,300, { timePeriod : 1000*10, timeLabelsTick: 1000, callbackTime : 100});
	svg2.draw();
	
	$("button.clear1").click(function(){
		svg2.clearUpdate();
	});$("button.activate1").click(function(){
		svg2.activateUpdate();
	});

});
