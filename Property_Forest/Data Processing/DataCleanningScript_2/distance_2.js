//var moment = require('moment');
//console.log("Data Cleaning Starts!");
var mysql      = require('mysql');
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'testUsr',
  password : 'password'
});

connection.query('SELECT * FROM resale_prices.resale_hdb where nearest_mrt is NULL order by id desc LIMIT 1;', function(hdb_err, hdb_rows, hdb_fields) {
  if (hdb_err) throw hdb_err;
  var hdbCord=function() {this.lat=0; this.lon=0;};
  var hdbId=hdb_rows[0].id;
  var resaleDate=hdb_rows[0].yr_mth;
  console.log(hdb_rows[0].block_n+' '+hdb_rows[0].street_name);
  //var resaleDateAdd5Yr = (resaleDate.getFullYear() + 5)+'-12-31';
  //connection.query('SELECT * FROM resale_prices.mrt_lrt where lat !="NR" and opening<="'+resaleDateAdd5Yr+'"', function(mrt_err, mrt_rows, mrt_fields) {
  connection.query('SELECT * FROM resale_prices.mrt_lrt where lat !="NR"', function(mrt_err, mrt_rows, mrt_fields) {
    if (mrt_err) throw mrt_err;
    //Find Nearest Mrt
    var distanceToMrt=100000;
    var nearestMrt='';
    hdbCord.lat=Number(hdb_rows[0].lat);
    hdbCord.lon=Number(hdb_rows[0].lon);
    //console.log(hdbId);
    var mrtCord=function() {this.lat=0; this.lon=0;};
    for (i = 0; i < mrt_rows.length; i++){
      mrtCord.lat=Number(mrt_rows[i].lat);
      mrtCord.lon=Number(mrt_rows[i].lon);
      var newDistance=getDistance(hdbCord,mrtCord);
      if (newDistance<distanceToMrt){
        distanceToMrt=newDistance;
        nearestMrt=mrt_rows[i].st_name;
      }
    }
    //console.log(hdb_rows[0].block_n+' '+hdb_rows[0].street_name+' '+resaleDate.getFullYear());
    console.log(nearestMrt+' =>'+Math.round(distanceToMrt)+' meters away.');
    //save
    var mrtqry='UPDATE resale_prices.resale_hdb set nearest_mrt_dist='+Math.round(distanceToMrt)+', nearest_mrt="'+nearestMrt
    +'" Where id='+hdbId+';'
    connection.query(mrtqry, function(err, rows, fields) {
      if (err) throw err;
      console.log('Record id:'+hdbId+' Nearby MRT/LRT Updated!');
      //process.exit();
    });
  });

  connection.query('SELECT * FROM resale_prices.schools where top_pri=1 and level_of_education="Primary Schools (Excluding Mixed Level Schools)"', function(sch_err, sch_rows, sch_fields) {
    if (sch_err) throw sch_err;
      //Find within 1km to a top Pri
      hdbCord.lat=Number(hdb_rows[0].lat);
      hdbCord.lon=Number(hdb_rows[0].lon);
      //console.log(hdbId);
      var noOfsch=0;
      var schs='';
      //console.log(hdb_rows[0]);
      //console.log(hdbCord);
      var schCord=function() {this.lat=0; this.lon=0;};
      for (s = 0; s < sch_rows.length; s++){
        schCord.lat=Number(sch_rows[s].lat);
        schCord.lon=Number(sch_rows[s].lon);
        var schDistance=getDistance(hdbCord,schCord);
        if (Math.round(schDistance)<=1000){
            noOfsch++;
            if (schs==''){schs=schs+sch_rows[s].school_name;}
            else {schs=schs+';'+sch_rows[s].school_name;}
            console.log(sch_rows[s].school_name+' =>'+sch_rows[s].address+' =>'+Math.round(schDistance)+' meters away.');
        }
      }
    //save
      console.log('Number of nearby top pri sch: '+noOfsch+' =>'+schs);
      var schqry='UPDATE resale_prices.resale_hdb set sch_in_radius='+noOfsch+', nearby_sch="'+schs
        +'" Where id='+hdbId+';'
        //console.log(schqry);
        connection.query(schqry, function(err, rows, fields) {
          if (err) throw err;
          console.log('Record id:'+hdbId+' Nearby School Updated!');
          console.log('');
          process.exit();
        });
  });
});

var rad = function(x) {
  return x * Math.PI / 180;
};

var getDistance = function(p1, p2) {
  var R = 6378137; // Earth’s mean radius in meter
  var dLat = rad(p2.lat - p1.lat);
  var dLong = rad(p2.lon - p1.lon);
  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(rad(p1.lat)) * Math.cos(rad(p2.lat))*
    Math.sin(dLong / 2) * Math.sin(dLong / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c;
  return d; // returns the distance in meter
};
