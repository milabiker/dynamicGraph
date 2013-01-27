
var database = {};
var generatorTime = 100;
var counterForSin = 1;
var timer = setTimeout(generator,0,'seria_1');

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
	tmp.value = Math.abs(Math.sin(counterForSin/10));
	counterForSin++;

	tmp.timestamp = new Date().getTime();
	//console.log("Measure : value =" + tmp.value + " timestamp = " + new Date(tmp.timestamp).getHours() + ":" + new Date(tmp.timestamp).getMinutes() + ":" + new Date(tmp.timestamp).getSeconds());
	return tmp;

}

/**
* Function which returns proper measurements based on date
*/
function getData(dateOfLastMesaurement){
	var time = new Date(dateOfLastMesaurement);
	// console.log("getData from " + time.getHours() + " : " + time.getMinutes() + " : " + time.getMinutes());
	var toReturn = {};
	for(key in database){
		//console.log("database length = " + database[key].length);
		
		var i = database[key].length-1;
		while(database[key][i].timestamp > dateOfLastMesaurement ){
			// console.log("i = " + i);
			i--;
			if(i <= 0){
				break;
			}
		}
		var tmpObj = {};
		var tmpArray = database[key].slice(i);
		// console.log("data length = " + tmpArray.length); 
		tmpObj[key] = tmpArray;

		$.extend(toReturn,tmpObj);
	}
	return toReturn;
}