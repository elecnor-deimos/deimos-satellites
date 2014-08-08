
//-----------------------------------------------------VARIABLES DEFINITION---------------------------------
var viewer = new Cesium.Viewer('cesiumContainer', {
	animation: false,
	navigationHelpButton: false,
	timeline: false,
});

viewer.scene.debugShowFramesPerSecond = true;

var geojsonDataSource = new Cesium.GeoJsonDataSource();	



//---------------------------------------------DATES RETRIEVING FROM CARTODB----------------------------------------------------------
var dates = $.getJSON( 'http://dms-coverage.cartodb.com/api/v2/sql?q=SELECT%20MIN(image_date)%20AS%20min_date,%20MAX%20(image_date)%20AS%20max_date%20FROM%20deimos_1_scenes&api_key=cfe0a8d8ed214abdd0e1f735e77ac2972a76a916', success);
function success(){
	
	var startDate = new Date(dates.responseJSON.rows[0].min_date);	
	var stopDate = new Date(dates.responseJSON.rows[0].max_date);
		
	createDateSlider(startDate, stopDate);

}



//-------------------------------------------DATA SLIDER CREATION--------------------------------------------------------------
function createDateSlider(startDate, stopDate){		
	
	$('#dateSlider').dateRangeSlider({
		bounds: {
			min: startDate, 
			max: stopDate
		},
		defaultValues: {
			min: startDate, 
			max: new Date(new Date(startDate).setMonth(startDate.getMonth()+6))
		},
		range:{
		    min: {days: 1},
		    max: {years: 1}
		 },
	});	

	$('#dateSlider').bind("valuesChanged", function(e, data){			
		$('#loading').css({
			display: 'block'
		});		
		importGeoJSON(data.values.min, data.values.max);
	});
	
	
	$('#dateSlider >').css({
		background: 'rgba(38, 38, 38, 0.75)',
	});	
	$('.ui-rangeSlider-bar').css({
		background: 'rgba(100, 100, 0, 0.75)',
	});		
	
	importGeoJSON(startDate, new Date(new Date(startDate).setMonth(startDate.getMonth()+6)));

}



//---------------------------------------------IMPORT GEOJSON------------------------------------------------
function importGeoJSON(startDate, stopDate){	
	
	viewer.dataSources.remove(geojsonDataSource);
	
	var startDay = startDate.getDate();
	var startMonth = startDate.getMonth();
	var startYear = startDate.getFullYear();
	
	var stopDay = stopDate.getDate();
	var stopMonth = stopDate.getMonth();
	var stopYear = stopDate.getFullYear();
		
	if(startDay < 10)	startDay = '0'+startDay;
	if(startMonth < 9)	startMonth = '0'+(startMonth+1);
	else	startMonth +=1;
	if(stopDay < 10)	stopDay = '0'+stopDay;
	if(stopMonth < 9)	stopMonth = '0'+(stopMonth+1);
	else	stopMonth +=1;
	
	
	var promise = geojsonDataSource.loadUrl('http://dms-coverage.cartodb.com/api/v2/sql?'+
											'format=GeoJSON'+
											'&q=SELECT%20*%20FROM%20deimos_1_scenes%20where%20image_date%20BETWEEN%20'+
											'%27'+ startYear + startMonth + startDay +'%2000:00:00.000%27'+
											'%20AND%20'+
											'%27'+ stopYear + stopMonth + stopDay +'%2000:00:00.000%27'+
											'&api_key=cfe0a8d8ed214abdd0e1f735e77ac2972a76a916');
			
			
	promise.then(function(){	
		$('#loading').css({
			display: 'none'
		});		
		infoBox(true);
		viewer.dataSources.add(geojsonDataSource);
		changeOutlineColor();
	});	
	promise.otherwise(function(){	
		console.log('otherwise');
		$('#loading').css({
			display: 'none'
		});		
		infoBox(false);
		viewer.dataSources.remove(geojsonDataSource);
	});	
	
	
}



//--------------------------------------------CHANGE OUTLINE COLOR--------------------------------------
function changeOutlineColor(){

	var outlineColor = new Cesium.Color(0.4, 0.5, 0.5, 0.3);
    for (var i = 0; i < geojsonDataSource.entities.entities.length; i++) {   
    	geojsonDataSource.entities.entities[i].polygon.outlineColor = new Cesium.ConstantProperty(outlineColor);
    }
    
}



//---------------------------------------------INFOBOX------------------------------------------------
function infoBox(loaded){
	var numPolygons = geojsonDataSource.entities.entities.length;	
	
	if(numPolygons > 0 && loaded){	
		var numVertex = 0;
		for(var i=0; i<numPolygons; i++){
			numVertex += geojsonDataSource.entities.entities[i].polygon.positions.getValue().length;
		}
			
		var str = 'Number of Polygons: '+ numPolygons +'</br>'+ 
				  'Number of Outlines: '+ numPolygons +'</br>'+
				  'Number of Vertices: '+ numVertex;
		$( '#infoBox' ).html( str );
	}
	else{		
		var str = 'Zero Opportunities Availables In This Date Range';
		$( '#infoBox' ).html( str );
	}
	
	
}










