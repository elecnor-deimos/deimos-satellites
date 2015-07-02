
//-----------------------------------------------------VARIABLES DEFINITION---------------------------------
var viewer = new Cesium.Viewer('cesiumContainer', {
	animation: false,
	navigationHelpButton: false,
	timeline: false,
});

viewer.scene.debugShowFramesPerSecond = true;

var geojsonDataSource = new Cesium.GeoJsonDataSource();	
var startDate = new Date();
var stopDate = new Date();

var handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
handler.setInputAction(highlightOpp, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);

var mouseHighlightHandler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);

var outlineColor = new Cesium.Color(0.2, 0.3, 0.3, 0.6);
var materialColor = new Cesium.Color(1.0, 1.0, 0.0, 0.3);
var outlineColorSelected = Cesium.Color.ORANGERED;
var materialColorSelected = Cesium.Color.ORANGE;

//dates retrieving from cartoDb
var dates = $.getJSON( 'http://elecnor-deimos.cartodb.com/api/v2/sql?q=SELECT%20MIN(image_date)%20AS%20min_date,%20MAX%20(image_date)%20AS%20max_date%20FROM%20deimos_1_scenes&api_key=a62745a5151fa50609933469281541bd20f38a31', success);
function success(){
		
	var minDate = new Date(dates.responseJSON.rows[0].min_date);	
	var maxDate = new Date(dates.responseJSON.rows[0].max_date);
			
	createDateSlider(minDate, maxDate);	
}



//-------------------------------------------DATA SLIDER CREATION--------------------------------------------------------------
function createDateSlider(minDate, maxDate){		
	
	var maxDateDefVal = new Date(new Date(minDate).setMonth(minDate.getMonth()+6));
	
	$('#dateSlider').dateRangeSlider({
		bounds: {
			min: minDate, 
			max: maxDate
		},
		defaultValues: {
			min: minDate, 
			max: maxDateDefVal
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
		$( '#globalData' ).html( '' );
		$( '#imgSelected' ).attr("src", '');
		$( '#selectedData' ).html( '' );
		startDate.setTime(data.values.min.getTime());
		stopDate.setTime(data.values.max.getTime());
		importGeoJSON();
	});
	
	
	$('#dateSlider >').css({
		background: 'rgba(38, 38, 38, 0.75)',
	});	
	$('.ui-rangeSlider-bar').css({
		background: 'rgba(100, 100, 0, 0.75)',
	});		
	
	startDate.setTime(minDate.getTime());
	stopDate.setTime(maxDateDefVal.getTime());
	importGeoJSON();

}



//--------------------------------------------ADAPT DATE TO QUERY--------------------------------------------
function adapt(startDate, stopDate){
	
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
	
	
	return [startDay, startMonth, startYear, stopDay, stopMonth, stopYear];
}



//---------------------------------------------IMPORT GEOJSON------------------------------------------------
function importGeoJSON(){	
	
	viewer.dataSources.removeAll();
	mouseHighlightHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
	mouseHighlightHandler.removeInputAction(Cesium.ScreenSpaceEventType.RIGHT_CLICK);
	
	var adaptDates = adapt(startDate, stopDate);	
	var startDay = adaptDates[0];
	var startMonth = adaptDates[1];
	var startYear = adaptDates[2];	
	var stopDay = adaptDates[3];
	var stopMonth = adaptDates[4];
	var stopYear = adaptDates[5];	
	
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
		debugBox(true);
		viewer.dataSources.add(geojsonDataSource);
		changeOutlineColor();
	});	
	promise.otherwise(function(){	
		$('#loading').css({
			display: 'none'
		});		
		debugBox(false);
		viewer.dataSources.remove(geojsonDataSource);
	});	
	
	
}



//--------------------------------------------CHANGE OUTLINE COLOR--------------------------------------
function changeOutlineColor(){
    for (var i = 0; i < geojsonDataSource.entities.entities.length; i++) {   
    	geojsonDataSource.entities.entities[i].polygon.outlineColor = new Cesium.ConstantProperty(outlineColor);
    }    
}



//---------------------------------------------DEBUG BOX------------------------------------------------
function debugBox(loaded){
	var numPolygons = geojsonDataSource.entities.entities.length;	
	
	if(numPolygons > 0 && loaded){	
		var numVertex = 0;
		for(var i=0; i<numPolygons; i++){
			numVertex += geojsonDataSource.entities.entities[i].polygon.positions.getValue().length;
		}
			
		var str = 'Number of Polygons: '+ numPolygons +'</br>'+ 
				  'Number of Outlines: '+ numPolygons +'</br>'+
				  'Number of Vertices: '+ numVertex;
		$( '#debugBox' ).html( str );		
		var str2 = 'Number of Opportunities displayed: ' + numPolygons +'</br>';
		$( '#opp' ).html( str2 );
	}
	else{		
		var str = 'No Opportunities Availables In This Date Range';
		$( '#debugBox' ).html( str );
		var str2 = 'Number of Opportunities displayed: ' + numPolygons +'</br>';
		$( '#opp' ).html( str2 );
	}
	
	
}



//--------------------------------------------------------------HIGHLIGHT OPPORTUNITIES-------------------------------------------------------------------------------
function highlightOpp(movement){
	
	var HighlightOppHelper = function() {
		this._viewer = viewer;				      
        this._mouseHandler = mouseHighlightHandler;
        this._dataSource = new Cesium.GeoJsonDataSource();
        this._longitudeDegrees = 0;
        this._latitudeDegrees = 0;	
        this._indexSelectedImg = 0;	
        this._indexPrecedentImg = -1;	
    };
    
    HighlightOppHelper.prototype.getLngLat = function(){ 
    	
    	var cartesianRad = viewer.scene.camera.pickEllipsoid(movement.position, viewer.scene.globe.ellipsoid);    	
        if (cartesianRad) {
            var cartographicRad = viewer.scene.globe.ellipsoid.cartesianToCartographic(cartesianRad);
            this._longitudeDegrees = Cesium.Math.toDegrees(cartographicRad.longitude);
            this._latitudeDegrees = Cesium.Math.toDegrees(cartographicRad.latitude);
            this.getImages();
        } 
    };
    
    HighlightOppHelper.prototype.getImages = function(){ 
    	
    	var adaptDates = adapt(startDate, stopDate);	
    	var startDay = adaptDates[0];
    	var startMonth = adaptDates[1];
    	var startYear = adaptDates[2];	
    	var stopDay = adaptDates[3];
    	var stopMonth = adaptDates[4];
    	var stopYear = adaptDates[5];	
    	var that = this;
    	
    	var promise = this._dataSource.loadUrl( 'http://dms-coverage.cartodb.com/api/v2/sql?'+
    			'format=GeoJSON'+
    			'&q=SELECT%20*%20FROM%20deimos_1_scenes%20where%20'+
    			'(ST_Intersects(%20the_geom,%20ST_SetSRID(ST_POINT('+ this._longitudeDegrees + ',' + this._latitudeDegrees + ')%20,%204326)))'+
    			'%20AND%20(image_date%20BETWEEN%20'+
    			'%27'+ startYear + startMonth + startDay +'%2000:00:00.000%27'+
    			'%20AND%20'+
    			'%27'+ stopYear + stopMonth + stopDay + '%2000:00:00.000%27)'+
    			'&api_key=cfe0a8d8ed214abdd0e1f735e77ac2972a76a916');
    	
    	promise.then(function(){        				
        	that._viewer.dataSources.add(that._dataSource);
        	that.loadedJson();
        });   	
    };
    
    
    HighlightOppHelper.prototype.loadedJson = function() {      	
    	
    	for (var i = 0; i < this._dataSource.entities.entities.length; i++) {   
    		this._dataSource.entities.entities[i].polygon.outlineColor = new Cesium.ConstantProperty(outlineColorSelected);
    		this._dataSource.entities.entities[i].polygon.height = new Cesium.ConstantProperty(1000);
        } 
    	this._dataSource.entities.entities[this._indexSelectedImg].polygon.material = new Cesium.ColorMaterialProperty.fromColor(materialColorSelected);
    	this._dataSource.entities.entities[this._indexSelectedImg].polygon.extrudedHeight = new Cesium.ConstantProperty(40000);
    	
 
		this.displayInfo();
		var that = this;
		   		
		this._mouseHandler.setInputAction(
			function (movement) {
				that._indexPrecedentImg = that._indexSelectedImg;
				that._indexSelectedImg = ((that._indexSelectedImg+1) % that._dataSource.entities.entities.length);
				that.changeAppearance();
				that.displayInfo();
			},
			Cesium.ScreenSpaceEventType.RIGHT_CLICK
		);
		
		this._mouseHandler.setInputAction(
    			function () {
    				that.destroy();
    			},
    			Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK
    		);
	};
    
	
    HighlightOppHelper.prototype.changeAppearance = function() {  

    	this._dataSource.entities.entities[this._indexPrecedentImg].polygon.material = new Cesium.ColorMaterialProperty.fromColor(materialColor);
    	this._dataSource.entities.entities[this._indexPrecedentImg].polygon.extrudedHeight = new Cesium.ConstantProperty(5000);
    	
    	this._dataSource.entities.entities[this._indexSelectedImg].polygon.material = new Cesium.ColorMaterialProperty.fromColor(materialColorSelected);
    	this._dataSource.entities.entities[this._indexSelectedImg].polygon.extrudedHeight = new Cesium.ConstantProperty(40000);    	
    	
    };
    
    HighlightOppHelper.prototype.displayInfo = function() {    
    	
    	var currentImg = this._dataSource.entities.entities[this._indexSelectedImg];    	
    	
    	var str = 	'SELECTED POINT </br>'+
    				'Number of oppurtunities:   '+ this._dataSource.entities.entities.length +'</br>'+
    				'Lng: '+ this._longitudeDegrees +'</br>'+ 
		  			'Lat: '+ this._latitudeDegrees;		  			
    	$( '#globalData' ).html( str );

    	
    	var str2 = 	'SELECTED IMAGE </br>'+
    				'Name: '+ currentImg.properties.image_name +'</br>'+ 
    				'Area: '+ currentImg.properties.area +' KM^2</br>'+
					'Date: '+ currentImg.properties.friendly_date +'</br>'+ 
					'Hour: '+ currentImg.properties.friendly_hour;			
    	$( '#selectedData' ).html( str2 );

    	$( '#imgSelected' ).attr("src", currentImg.properties.image_url);
    	
    	
	};
    
    HighlightOppHelper.prototype.destroy = function(){    
    	this._viewer.dataSources.remove(this._dataSource, true);										
    };
    

    var HighlightOppHelper = new HighlightOppHelper();
    HighlightOppHelper.getLngLat();
     
}










