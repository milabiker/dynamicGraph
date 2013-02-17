$(document).ready(function(){



	// function Cos(){
	// 	alert('cos');
	// };

	// $.ChartsManager.addChartType('Graph2', new Cos());

	var svgline = $('div#svgLineGraph').SVGDynamicGraph('LineGraph',600,300
						,{
							title : {
								enabled : false,
								text: "Dynamic graph"
							},  
							timePeriod: 1000*60, 
							timeLabelsTick : 1000*20, 
							callbackTime: 1000,
							dataSeries : {
								seriesMarkers: [false,'circle','square']
							},
							yAxis : {
								enabled : true,
								title: 'Nazwa osi',
								// label_unit:' [ j ]',
								// lineSettings : {stroke : "#fff"}
							},
							xAxis : {
								enabled : true,
								// lineSettings : {stroke : "#fff" },
								// labelSettings : { fill : '#fff'}
							},
							chartOptions : {
								background : { fill : '#ddd', fillOpacity: 0.5},
								graphAreaBackground : { fill : "white"},
								gridSettings : {stroke : "green", strokeWidth : 1 }
							},

					}

					);
	
	$("button.clear").click(function(){
		svgline.clearUpdate();
	});$("button.activate").click(function(){
		svgline.activateUpdate();
	});
	svgline.setCallback(function(inst){
		
		var numberOfNewValues = inst._addSeries(getData(inst._currentTimelineDate.getTime()));
		inst.charttype.refreshGraph(inst._graphArea,numberOfNewValues);
		inst._timerID = setTimeout(inst.callback,inst.settings.callbackTime,inst);
	});
	svgline.draw();

//--------------------------------------------------------------------------------
	
	// var svg3 = $('div#svgLineGraph3').SVGDynamicGraph('LineGraph',400,200, { timeLabelsTick: 2000, timePeriod : 1000*10}).draw();
	// var svg1 = $('div#svgLineGraph2').SVGDynamicGraph('LineGraph',400,200, { timeLabelsTick: 2000, timePeriod : 1000*10}).draw();
	
	
	var svg2 = $('div#svg').SVGDynamicGraph('LineGraph',600,300, 
		{ timePeriod : 1000*10, 
			timeLabelsTick: 1000, 
			callbackTime : 100, 
			chartOptions : { 
						horizontal_grid: true,
						background : { fill: '#eee'},
						graphAreaBackground: { fill : '#fff'},
						gridSettings : { stroke : '#999', strokeOpacity: 1}
			}, 
			dataSeries : {
						seriesMarkers: ['triangle','circle',false] 
			},
			yAxis : {
				lineSettings : { stroke: 'black', strokeOpacity: 1}
			},
			xAxis : {
				lineSettings : { stroke: 'black'}
				
			},
			title : {
				text : 'Example',
				textSettings : { fill : '#000', fontWeight: 'bold'}
			}
		});
	svg2.draw();
	
	$("button.clear1").click(function(){
		svg2.clearUpdate();
	});$("button.activate1").click(function(){
		svg2.activateUpdate();
	});

});
