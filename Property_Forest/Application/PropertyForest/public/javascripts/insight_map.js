var startDate ='2012-03-01';
var endDate ='2016-02-01';
var apiKey='AIzaSyDPcjLwNaGB_PRNjdhotnT7H95cgZKtwyw';
var tableId = '1mkS-Br95q5mKW1CWuafERihCLxHF467USPkSjf5Z';
var markers = [];
var mrtMarkers=[];
var schMarkers=[];
var circles=[];
var percent75=0;
var percent25=0;
var map;
var heatmap;

$(function() {
  $('#mrt').change(
    function(){
        if ($(this).is(':checked')) {
            //alert('checked');
            createMrtMarker();
        }else{
          for (var i = 0; i < mrtMarkers.length; i++) {
            mrtMarkers[i].setMap(null);
          }
          mrtMarkers=[];
        }
  });

  $('#pri').change(
    function(){
        if ($(this).is(':checked')) {
            //alert('checked');
            createSchMarker()
        }else{
          for (var i = 0; i < schMarkers.length; i++) {
            schMarkers[i].setMap(null);
            circles[i].setMap(null);
          }
          schMarkers=[];
          circles=[];
        }
  });


  countMakers();
  // Handler for .ready() called.
  //Date range picker
  $('#dateRange').daterangepicker({
    "startDate": "03/01/2012",
    "endDate": "02/01/2016"
  });
/*
  $("#heat_range").ionRangeSlider({
    min: 1,
    max: 20,
    from: 3,
    type: 'single',
    step: 1,
    prefix: "Heatmap Radius: ",
    prettify: false,
    hideMinMax: true,
    hasGrid: true,
    grid_snap: true,
    onChange: function (obj) {
      console.log($("#heat_range").val());
      var rval=$("#heat_range").val();
      if(heatmap)
      heatmap.set('radius', heatmap.get('radius') ? null : rval);
    },
  });*/

  $('#dateRange').on('apply.daterangepicker', function(ev, picker) {
      startDate=picker.startDate.format('YYYY-MM-DD');
      endDate=picker.endDate.format('YYYY-MM-DD')
      console.log(picker.startDate.format('YYYY-MM-DD'));
      console.log(picker.endDate.format('YYYY-MM-DD'));
  });

  var options1 = $("#towns");
  $.getJSON("javascripts/town.json", function(result) {
      options1.append($("<option />").val("").text("ALL"));
      $.each(result.towns, function() {
        options1.append($("<option />").val(this.Name).text(this.Name));
     });
   });

   var options2 = $("#flat_type");
   $.getJSON("javascripts/flat_type.json", function(result) {
       options2.append($("<option />").val("").text("ALL"));
       $.each(result.flat_types, function() {
         options2.append($("<option />").val(this.TypeName).text(this.TypeName));
      });
    });
});


var conditions="yr_mth >= '" + startDate + "' and yr_mth <= '"+endDate+"'";

function loadApi() {
  gapi.client.load('fusiontables', 'v1', initialize);
}

function makeQuery (town,flatType,startDate,endDate){
  var qry="";
  if (town!=''){
    qry= "town = '" + town + "'"
  }
  if (flatType!=''){
    if(qry!=""){qry=qry+" AND ";}
    qry=qry+"flat_type = '" + flatType + "'";
  }

  if(qry!=""){qry=qry+" AND ";}
  qry=qry+"yr_mth >= '" + startDate + "' and yr_mth <= '"+endDate+"'";

  return qry;
}
var geocoder = new google.maps.Geocoder();
function updateMap() {
  heatmap.setMap(null);
  heatmap=null;
  for (var i = 0; i < markers.length; i++) {
    markers[i].setMap(null);
  }
  markers=[];
  var zoom = map.getZoom();
  var town = document.getElementById('towns').value;
  //if (town!=''){
    var zoomlv=16;
    if (town=='') {zoomlv=mapZoom;}
    if (town=='CENTRAL AREA') {town='CITY HALL';}
    geocoder.geocode({
                address: town+ ", Singapore"
    }, function(results, status) {
      if (status == google.maps.GeocoderStatus.OK) {
                    mapCenter=results[0].geometry.location;
                    map.setCenter(mapCenter);
                    map.setZoom(zoomlv);
      }
    });
  //}
  var flatType = document.getElementById('flat_type').value;
  conditions=makeQuery(town,flatType,startDate,endDate);

  $('#townFilter').html((town=='')? 'ALL':town);
  $('#typeFilter').html((flatType=='')? 'ALL':flatType);
  $('#fromFilter').html((startDate=='')? 'ALL':startDate);
  $('#toFilter').html((endDate=='')? 'ALL':endDate);


  console.log(conditions);
  countMakers();
  var queryUrlHead = '../apis/getCordinates';
  var para = '?conditions='+ conditions;
  var queryurl = encodeURI(queryUrlHead + para);
  showMarkers();
  /*
  if (zoom > 15){
    //heatmap.setMap(null);
    showMarkers();
  }*/
    $('#mapLoader').show();
    $.get(queryurl,function(data){
        try{
    //  console.log(data);
      if(data.length>0){
        var retData=JSON.parse(data);
        percent75=retData.percent75;
        percent25=retData.percent25;
        onDataFetched(retData);
        //heatmap.set('radius', 16);
        //onDataFetched(data);
      }

        }
        catch(err){
          console.log(err);
          alert('Unable to fetch data.');
        }
        //console.log("load close");
        $('#mapLoader').hide();
    });
}
var mapZoom=11;
function initialize() {
  $('#mapLoader').hide();
  var mapCenter=new google.maps.LatLng(1.352083,103.819836);
  var isMobile = (navigator.userAgent.toLowerCase().indexOf('android') > -1) ||
    (navigator.userAgent.match(/(iPod|iPhone|iPad|BlackBerry|Windows Phone|iemobile)/));
  if (isMobile) {
    var viewport = document.querySelector("meta[name=viewport]");
    viewport.setAttribute('content', 'initial-scale=1.0, user-scalable=no');
    mapZoom=mapZoom-2;
  }
  var mapDiv = document.getElementById('map-canvas');
  //mapDiv.style.width = isMobile ? '100%' : '100%';
  //mapDiv.style.height = isMobile ? '200px' : '420px';
  map = new google.maps.Map(mapDiv, {
    center: mapCenter,
    zoom: mapZoom,
    mapTypeId: google.maps.MapTypeId.ROADMAP
  });
  /*
  var query = "select col11, col12, average(price_sqm) from "+tableId+
  " group by col11, col12";
  var request = gapi.client.fusiontables.query.sqlGet({ sql: query, key:apiKey });
  request.execute(function(response) {
    onDataFetched(response);
  });*/

  var queryUrlHead = '../apis/getCordinates';
  var para = '?conditions='+ conditions;
  var queryurl = encodeURI(queryUrlHead + para);
  console.log(queryurl);
  $('#mapLoader').show();
  $.get(queryurl,function(data){
      try{
        //console.log(data);
        var retData=JSON.parse(data);
        percent75=retData.percent75;
        percent25=retData.percent25;

        onDataFetched(retData);
      }
      catch(err){
        console.log(err);
        alert('Unable to fetch data.');
      }
      //console.log("load close");
      $('#mapLoader').hide();
  });


  new ResizeSensor($('#map-canvas'), function(){
      //console.log('map dimension changed');
      google.maps.event.trigger(map, 'resize');
      map.setCenter(mapCenter);
  });
google.maps.event.addListener(map, 'idle', showMarkers);
  google.maps.event.addListener(map, 'zoom_changed', function(){
        if (heatmap){
            var zoom = map.getZoom();
            console.log(zoom);
            if (zoom == 15)
              heatmap.set('radius', 35);
            if (zoom == 14)
                heatmap.set('radius', 16);
            if (zoom == 13)
              heatmap.set('radius', 8);
            if (zoom == 12)
                  heatmap.set('radius', 5);
            if (zoom == 11)
                heatmap.set('radius', 3);
            if (zoom == 10)
                    heatmap.set('radius', 2);

            if (zoom > 15){
              heatmap.setMap(null);
                //heatmap.set('radius', 90);
            } else {
              heatmap.setMap(map);
              for (var i = 0; i < markers.length; i++) {
                markers[i].setMap(null);
              }
              markers=[];
                //heatmap.set('radius', Math.round(0.8*zoom));
            }
            //console.log ( zoom+" "+ heatmap.get('radius'));
        }
    });
}

function onDataFetched(data) {
    console.log(data.data.length);
    drawHeatmap(extractLocations(data.data));
}

function extractLocations(rows) {
  var locations = [];
  console.log(rows[0].LAT);
  for (var i = 0; i < rows.length; ++i) {
    var row = rows[i];
    if (row.LAT) {
      var lat = row.LAT;
      var lng = row.LON;
      if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
        var latLng = new google.maps.LatLng(lat, lng);
        var weight = Number(row.AVERAGE_SQM*10000);
        locations.push({ location: latLng, weight: parseFloat(weight) });
      }
    }
  }
  return locations;
}

function drawHeatmap(locations) {
  heatmap = new google.maps.visualization.HeatmapLayer({
     dissipating: true,
     gradient: [
       'rgba(102,255,0,0)',
       'rgba(147,255,0,1)',
       'rgba(193,255,0,1)',
       'rgba(238,255,0,1)',
       'rgba(244,227,0,1)',
       'rgba(244,227,0,1)',
       'rgba(249,198,0,1)',
       'rgba(255,170,0,1)',
       'rgba(255,113,0,1)',
       'rgba(255,57,0,1)',
       'rgba(255,0,0,1)'
     ],
     opacity: 0.57,
     radius: 3,
     data: locations
  });
  var zoom = map.getZoom();
  if (zoom > 15){
    heatmap.setMap(null);
  }else{
    heatmap.setMap(map);
  }

}

function showMarkers() {
var zoom = map.getZoom();
//heatmap.setMap(null);
var bounds = map.getBounds();
// Call you server with ajax passing it the bounds
// In the ajax callback delete the current markers and add new markers
var southWest = bounds.getSouthWest();
var northEast = bounds.getNorthEast();
var fromlat= Number(southWest.lat());
var tolat= Number(northEast.lat());
var fromlng= Number(southWest.lng());
var tolng= Number(northEast.lng());
var mkno=markers.length;
console.log('Removing Phase:'+markers.length);
var remCo=0
for (var i = 0; i < mkno; i++) {
    var mlat=Number(markers[0].position.lat());
    var mlon=Number(markers[0].position.lng());
    //console.log(mlat.toFixed(9)+' '+mlon.toFixed(7));
    if(!((mlat.toFixed(9)>fromlat)&(mlat.toFixed(9)<tolat)&(mlon.toFixed(7)>fromlng)&(mlon.toFixed(7)<tolng))){
        console.log('Removing!!!'+mlat.toFixed(9)+':'+mlon.toFixed(7));
        markers[0].setMap(null);
        markers.splice(0, 1);
        remCo++;
    }
}
console.log('Removed markers:'+remCo);

if(zoom>15){
    var queryUrlHead = '../apis/getViewPort';
    var fromlat= '&fromlat='+southWest.lat();
    var tolat= '&tolat='+northEast.lat();
    var fromlng= '&fromlng='+southWest.lng();
    var tolng= '&tolng='+northEast.lng();
    //var conditions='';
    var para = '?conditions='+conditions+fromlat+tolat+fromlng+tolng;
    var queryurl = encodeURI(queryUrlHead + para);
    console.log(queryurl);
    if(markers.length==0){
      $('#mapLoader').show();
    }
    var getCount = $.get(queryurl,
      function(data){
        try{
          console.log('number of retrived markers: '+data.length);
          $.each(data, function (i, item) {
            checkMarker(item);
          });
          console.log('number of markers: '+markers.length);
        }
        catch(err){
          console.log(err);
        }
        $('#mapLoader').hide();
      });
  }
}

function checkMarker(item){
  var toAdd=true;
  var itemLat=Number(item.LAT);
  var itemLon=Number(item.LON);
    for (var i = 0; i < markers.length; i++) {
      //console.log(markers[i].position.lat());
        var mlat=markers[i].position.lat();
        var mlon=markers[i].position.lng();
        if (((itemLat.toFixed(9)==mlat.toFixed(9))&(itemLon.toFixed(7)==mlon.toFixed(7)))){
          toAdd=false;
          break;
        }
    }
    if(toAdd){
      console.log('Adding!!!'+itemLat.toFixed(9)+':'+itemLon.toFixed(7));
      createMarker(item);
    }
}

function createMarker(item) {
  var avgPrice=Number(item.AVERAGE);
  var avgPriceSqm=Number(item.AVERAGE_SQM);
  var contentString ="Average Price: "+avgPrice.formatMoney(2, '.', ',')
  +"<br/>Average Price Per Sqm: "+avgPriceSqm.formatMoney(2, '.', ',')
  +"<br/>Number of resale units: "+item.COUNTS;
  var infowindow = new google.maps.InfoWindow({
    content: contentString
  });
  var itemLat=Number(item.LAT);
  var itemLon=Number(item.LON);
  var iconColor='#009900';
  if(avgPriceSqm>=percent75){
    iconColor='#950000';
  }else if (avgPriceSqm<=percent25){
    iconColor='#000095';
  }

    var marker = new Marker({
        position: new google.maps.LatLng(itemLat.toFixed(9), itemLon.toFixed(7)),
        map: map,
        icon: {
		        path: MAP_PIN,
            scale: 0.5,
		        fillColor: iconColor,
		        fillOpacity: 1,
		        strokeColor: '',
		        strokeWeight: 0
	      },
	      map_icon_label: '<span class="map-icon">'+item.COUNTS+'</span>',
        draggable: false
    });
    marker.addListener('click', function() {
     infowindow.open(map, marker);
    });
    markers.push(marker);
    marker.setMap(map);
}

function createSchMarker() {
  var infowindow = new google.maps.InfoWindow();
  $('#mapLoader').show();
  $.get('../apis/getSch',
    function(data){
      //console.log(data);
      //var data=JSON.parse(rdata);
      for (var i = 0; i < data.length; i++) {
        var schContentString="School Name: "+data[i].school_name+"<br/>Address: "+data[i].address;
          var schMarker = new Marker({
              position: new google.maps.LatLng(data[i].lat, data[i].lon),
              map: map,
              icon: {
                  path:  SQUARE_PIN,
                  scale: 0.5,
                  fillColor: '#000000',
                  fillOpacity: 1,
                  strokeColor: '',
                  strokeWeight: 0
              },
              map_icon_label: '<span class="map-icon map-icon-school"></span>',
              draggable: false
          });

          google.maps.event.addListener(schMarker, 'click', (function(schMarker, schContentString) {
          return function() {
              infowindow.setContent(schContentString);
              infowindow.open(map, schMarker);
          }
        })(schMarker, schContentString));

        var circle = new google.maps.Circle({
          center: schMarker.getPosition(),
          radius: 1000,
          map: map,
          fillOpacity: 0.1,
          strokeOpacity: 0.5,
          strokeWeight: 1
        });
          circles.push(circle);
          schMarkers.push(schMarker);
          //schMarker.setMap(map);
      }
      $('#mapLoader').hide();
    });
}

function createMrtMarker() {
  $('#mapLoader').show();
  var infowindow = new google.maps.InfoWindow();
  $.get('../apis/getMrt',
    function(data){
      //console.log(data);
      //var data=JSON.parse(rdata);
      for (var i = 0; i < data.length; i++) {
        var contentString ="Station Code: "+data[i].st_code
        +"<br/>Station Name: "+data[i].st_name
        +"<br/>Opened(ing) Date: "+data[i].opening;
        var mrtInfowindow = new google.maps.InfoWindow({
          content: contentString
        });
          var marker = new Marker({
              position: new google.maps.LatLng(data[i].lat, data[i].lon),
              map: map,
              icon: {
      		        path:  SQUARE_PIN,
                  scale: 0.5,
      		        fillColor: '#00CCBB',
      		        fillOpacity: 1,
      		        strokeColor: '',
      		        strokeWeight: 0
      	      },
      	      map_icon_label: '<span class="map-icon map-icon-train-station"></span>',
              draggable: false
          });
          google.maps.event.addListener(marker, 'click', (function(marker, contentString) {
          return function() {
              infowindow.setContent(contentString);
              infowindow.open(map, marker);
          }
        })(marker, contentString));
          mrtMarkers.push(marker);
          //marker.setMap(map);
      }
      $('#mapLoader').hide();
    });
}



google.maps.event.addDomListener(window, 'load', loadApi);


function countMakers (){
  //var queryUrlHead = 'https://www.googleapis.com/fusiontables/v2/query?sql=';
  //var queryUrlTail = '&key='+apiKey;
  //var query = "SELECT COUNT() FROM " + tableId + " WHERE "+ searchString;
  //var queryurl = encodeURI(queryUrlHead + query + queryUrlTail);
  var queryUrlHead = '../apis/countRecords';
  var para = '?conditions='+ conditions;
  var queryurl = encodeURI(queryUrlHead + para);
  console.log(queryurl);
  var getCount = $.get(queryurl,
    function(data){
      try{
        //console.log(data[0][1]);
        $('#count_1').html(data[0][1]);
        $('#count_2').html(data[0][1]);

      }
      catch(err){
        console.log(err);
        $('#count_1').html('0');
        $('#count_2').html('0');
      }
    });
}

Number.prototype.formatMoney = function(c, d, t){
var n = this,
    c = isNaN(c = Math.abs(c)) ? 2 : c,
    d = d == undefined ? "." : d,
    t = t == undefined ? "," : t,
    s = n < 0 ? "-" : "",
    i = parseInt(n = Math.abs(+n || 0).toFixed(c)) + "",
    j = (j = i.length) > 3 ? j % 3 : 0;
   return s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
 };
