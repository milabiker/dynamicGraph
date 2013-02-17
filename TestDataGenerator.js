toggle = true;
var database = {};
var generatorTime = 100;
var counterForSin = 1;
// var timer = setTimeout(generator,1000,{seriesName : 'seria_1', dataType : "random", odjemna : 17} );
var timer = setTimeout(generator,1000,{seriesName : 'seria_1', dataType : "sinus", mnoznik : 20}); // , count : 0 / add this to get limited number of measurements
var timer = setTimeout(generator,1000,{seriesName : 'seria_4', dataType : "sinus", mnoznik : 15, phase : 3.14/2}); // , count : 0 / add this to get limited number of measurements
var timer = setTimeout(generator,1000,{seriesName : 'seria_2', dataType : "sinus" , mnoznik : 10,phase : 2*3.14}); // , count : 0 / add this to get limited number of measurements
// var timer = setTimeout(generator,1000,{seriesName : 'seria_3', dataType : "random"});

function generator(obj){
	//console.log("generator on " + seriesName);
	var measure = generateMeasure(obj);
	if(database[obj.seriesName] == undefined){
		database[obj.seriesName] = [];
	}
	database[obj.seriesName].push(measure);

	if(obj.count!= undefined){
		obj.count++;
		if( obj.count < 20){
			timer = setTimeout(generator,generatorTime,{ seriesName : obj.seriesName, dataType : obj.dataType , count : obj.count});
		}

	}else{
		
		timer = setTimeout(generator,generatorTime,{ seriesName : obj.seriesName, dataType : obj.dataType, mnoznik : obj.mnoznik , odjemna : obj.odjemna, phase : obj.phase});
	}
}
/**
* returns one measure
*/
function generateMeasure(obj){
	var tmp = {};
	if(obj.dataType == "random"){
	// -------- random -------------
		tmp.value = Math.random();
		if(obj.odjemna !=undefined){
			tmp.value -= obj.odjemna;
		}
	}else if(obj.dataType == "sinus"){
	
		// if(counterForSin > 100){
		// 	tmp.value = Math.sin(counterForSin/10)*10;
		// }else{
		// 	tmp.value = Math.sin(counterForSin/10);
		// }		

			tmp.value = Math.sin(counterForSin/10);
		if(obj.mnoznik !=undefined){
			tmp.value = Math.sin(	(counterForSin / obj.mnoznik) + (obj.phase != undefined ? Math.sin(obj.phase) : 0));

		}
	}else if( dataType == "number"){
		// -------- number ------------
		// tmp.value = counterForSin;
	}
	
	counterForSin++;

	tmp.timestamp = new Date().getTime();
	return tmp;

}

/**
* Function which returns proper measurements based on date
*/
function getData(dateOfLastMesaurement){
	var time = new Date(dateOfLastMesaurement);
	var toReturn = {};
	for(key in database){
		
		var i = database[key].length-1;
		while(database[key][i].timestamp > dateOfLastMesaurement ){
			i--;
			if(i <= 0){
				break;
			}
		}
		var tmpObj = {};
		var tmpArray = database[key].slice(i+1);


		//to avoid returning series without measurements
		if(tmpArray.length > 0){
			tmpObj[key] = tmpArray;
			$.extend(toReturn,tmpObj);
		}

	}
	return toReturn;
}
