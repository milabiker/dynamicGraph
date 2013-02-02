toggle = true;
var database = {};
var generatorTime = 100;
var counterForSin = 1;
var timer = setTimeout(generator,0,{seriesName : 'seria_1', dataType : "sinus"});
var timer = setTimeout(generator,0,{seriesName : 'seria_2', dataType : "random"});

function generator(obj){
	//console.log("generator on " + seriesName);
	var measure = generateMeasure(obj.dataType);
	if(database[obj.seriesName] == undefined){
		database[obj.seriesName] = [];
	}
	database[obj.seriesName].push(measure);
	timer = setTimeout(generator,generatorTime,{ seriesName : obj.seriesName, dataType : obj.dataType });
}
/**
* returns one measure
*/
function generateMeasure(dataType){
	var tmp = {};
	if(dataType == "random"){
	// -------- random -------------
		tmp.value = Math.random()*10;
	}else if(dataType == "sinus"){
		// -------- sinus --------------
		// tmp.value = Math.abs(Math.sin(counterForSin/10));
		// tmp.value = Math.sin(counterForSin/10)*10;
		if(counterForSin > 100){
			tmp.value = Math.sin(counterForSin/10)*10;
		}else{
			tmp.value = Math.sin(counterForSin/10);
		}		
	}else if( dataType == "number"){
		// -------- number ------------
		// tmp.value = counterForSin;
	}
	
	// 1 or 2
		// if(toggle){
		// 	toggle = false;
		// 	tmp.value = 1;
		// }else{
		// 	toggle = true;
		// 	tmp.value = 5;
		// }
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
		var tmpArray = database[key].slice(i+1);
		// console.log("data length = " + database[key].length); 
		// console.log("tmpArray length = " + tmpArray.length); 

		//to avoid returning series without measurements
		if(tmpArray.length > 0){
			tmpObj[key] = tmpArray;
			$.extend(toReturn,tmpObj);
		}

	}
	return toReturn;
}
function log10(val) {
  return Math.log(val) / Math.LN10;
}
function calculateYaxisStep(range, targetSteps){
	var tempStep = range/targetSteps;

	mag = Math.floor(log10(tempStep));
	magPow = Math.pow(10, mag);

	magMSD = tempStep/magPow + 0.5;

	if(magMSD > 5.0){
		magMSD = 10.0;
	}else if(magMSD > 2.0){
		magMSD = 5.0;
	}else if (magMSD > 1.0){
		magMSD = 2.0;
	}
	return magMSD*magPow;
}