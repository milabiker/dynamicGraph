
var database = {};
var generatorTime = 100;
var counterForSin = 1;
var timer = setTimeout(generator,generatorTime,'seria_1');

function generator(seriesName){
	//console.log("generator on " + seriesName);
	var measure = generateMeasure();
	if(database[seriesName] == undefined){
		database[seriesName] = [];
	}
	database[seriesName].push(measure);
	timer = setTimeout(generator,generatorTime,'seria_1');
}
/**
* returns one measure
*/
function generateMeasure(){
	var tmp = {};
	// -------- random -------------
	//tmp.value = Math.random()*10;
	// -------- sinus --------------
	tmp.value = Math.abs(Math.sin(counterForSin*100));
	counterForSin++;

	tmp.timestamp = new Date().getTime();
	//console.log("Measure : value =" + tmp.value + " timestamp = " + new Date(tmp.timestamp).getHours() + ":" + new Date(tmp.timestamp).getMinutes() + ":" + new Date(tmp.timestamp).getSeconds());
	return tmp;

}

/**
* Function which returns proper measurements based on date
*/
function getData(dateOfLastMesaurement){
	//console.log("getData !!!-------------");
	var toReturn = {};
	for(key in database){
		for(var i=database[key].length-1; i > 0; i--){
	//		console.log("getData iterate " + i);
			if( database[key][i].timestamp <= dateOfLastMesaurement ){
				var tmpObj = {};
				tmpObj[key] = database[key].slice(i);
				$.extend(toReturn,tmpObj);
				break;
			}
		}
	}
	return toReturn;
}