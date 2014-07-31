
//-----------------------------------------------------VARIABLES DEFINITION---------------------------------
var viewer = new Cesium.Viewer('cesiumContainer', {
	animation: false,
	navigationHelpButton: false,
	timeline: false,
});

var geojsonDataSource = new Cesium.GeoJsonDataSource();		
viewer.dataSources.add(geojsonDataSource);



//---------------------------------------------DATES RETRIEVING FROM CARTODB----------------------------------------------------------
var dates = $.getJSON( 'http://dms-coverage.cartodb.com/api/v2/sql?q=SELECT%20MIN(image_date)%20AS%20min_date,%20MAX%20(image_date)%20AS%20max_date%20FROM%20deimos_1_scenes&api_key=cfe0a8d8ed214abdd0e1f735e77ac2972a76a916', success);
function success(){
	
	var startDate = new Date(dates.responseJSON.rows[0].min_date);	
	var stopDate = new Date(dates.responseJSON.rows[0].max_date);
		
	createDateSlider(startDate, stopDate);

}


//-------------------------------------------DATA SLIDER CREATION--------------------------------------------------------------
function createDateSlider(startDate, stopDate){
	
	$("#dateSlider").dateRangeSlider({
		bounds: {min: startDate, max: stopDate},
		defaultValues: {min: startDate, max: new Date(new Date(startDate).setMonth(startDate.getMonth()+12))},
	});	
	importGeoJSON(startDate, new Date(new Date(startDate).setMonth(startDate.getMonth()+12)));

	$("#dateSlider").bind("valuesChanged", function(e, data){			
		
		$('#loading').css({
			display: 'block'
		});
		
		importGeoJSON(data.values.min, data.values.max);
	});
	
}


//---------------------------------------------IMPORT GEOJSON------------------------------------------------
function importGeoJSON(startDate, stopDate){	
	
	var startDay = startDate.getDate();
	var startMonth = startDate.getMonth();
	var startYear = startDate.getFullYear();

	var stopDay = stopDate.getDate();
	var stopMonth = stopDate.getMonth();
	var stopYear = stopDate.getFullYear();
		
	if(startDay < 10)	startDay = '0'+startDay;
	if(startMonth < 10)	startMonth = '0'+startMonth;
	if(stopDay < 10)	stopDay = '0'+stopDay;
	if(stopMonth < 10)	stopMonth = '0'+stopMonth;
	
	
	var index = viewer.dataSources.indexOf(geojsonDataSource);
	var promise = viewer.dataSources.get(index).loadUrl('http://dms-coverage.cartodb.com/api/v2/sql?'+
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
	});	
	promise.otherwise(function(){
		$('#loading').css({
			display: 'none'
		});
	});	
			
}
