var express = require('express');
var router = express.Router();
var db = require('../bin/db');
var stats = require("stats-lite");
var Client = require('node-rest-client').Client;
var client = new Client();
var token = '+lvQ6V20hGiGPMBfSCs36FXvRVQ8zkdgl0g4F4qzs9i7K7WF0/gAxbMXuE8QZxme5NTpIDKmwJO4DXksRa+wtBmiy+JMDYUF';
var mrtList = require('../bin/mrt.json');
var schoolList = require('../bin/schools.json');
var curl = require('curlrequest');

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.get('/countRecords', function(req, res, next) {
  var conditions = req.query.conditions;
  if (conditions){
    conditions='WHERE '+conditions;
  }else{
    conditions='';
  }
  db.ibmdb.open(db.connString, function(err, conn) {
  console.log("Connection Opened");
  if (err ) {
   res.send("500");
   console.log(err.message);
   //res.send("error occurred " + err.message);
  }
  else {
    console.log(conditions);
    conn.query("SELECT COUNT(*) from DASH6938.resale_flats_location "+conditions, function(err, tables, moreResultSets) {
    if ( !err ) {
      //console.log(tables);
      res.send(tables);
    } else {
      res.send("500");
       console.log(err.message);
      //res.send("error occurred " + err.message);
    }
    /*
      Close the connection to the database
      param 1: The callback function to execute on completion of close function.
    */
    conn.close(function(){
      console.log("Connection Closed");
      });
    });
  }
  });
});

router.get('/getCordinates', function(req, res, next) {
  var conditions = req.query.conditions;
  //console.log(conditions);
  if (conditions){
    conditions='WHERE '+conditions;
  }else{
    conditions=' ';
  }
  db.ibmdb.open(db.connString, function(err, conn) {
  console.log("Connection Opened");
  if (err ) {
   res.send("500");
    console.log(err.message);
   //res.send("error occurred " + err.message);
  }
  else {
    conn.query('Select lat,lon,count(id) as counts, avg(resale_price) as average, avg(resale_price/floor_area_sqm) as average_sqm from DASH6938.resale_flats_location '+conditions+'group by lat,lon', function(err, tables, moreResultSets) {
    if ( !err ) {
      //console.log(tables);
      var avgsqm=[];
      for(var i = 0; i < tables.length; ++i){
        avgsqm[i]=Number(tables[i].AVERAGE_SQM);
      }

      var ret=JSON.stringify({
        percent75:stats.percentile(avgsqm, 0.75),
        percent25:stats.percentile(avgsqm, 0.25),
        max: Math.max.apply(Math, avgsqm),
        data:tables
      });
      res.send(ret);
    } else {
      res.send("500");
       console.log(err.message);
      //res.send("error occurred " + err.message);
    }
    /*
      Close the connection to the database
      param 1: The callback function to execute on completion of close function.
    */
    conn.close(function(){
      console.log("Connection Closed");
      });
    });
  }
  });
});

router.get('/getViewPort', function(req, res, next) {
var fromlat=req.query.fromlat;
var tolat=req.query.tolat;
var fromlng=req.query.fromlng;
var tolng=req.query.tolng;
var conditions = req.query.conditions;

var viewRange='lat>='+fromlat+' and lat<='+tolat+' and lon>='+fromlng+' and lon<='+tolng;
console.log(viewRange);
if (conditions){
  conditions='WHERE '+conditions+' and '+viewRange;
}else{
  conditions='WHERE '+viewRange;
}

db.ibmdb.open(db.connString, function(err, conn) {
console.log("Connection Opened");
if (err ) {
 res.send("500");
  console.log(err.message);
 //res.send("error occurred " + err.message);
}
else {
  conn.query('Select lat,lon, count(id) as counts, avg(resale_price) as average, avg(resale_price/DECIMAL(floor_area_sqm,5,2)) as average_sqm from DASH6938.resale_flats_location '+conditions+' group by lat,lon', function(err, tables, moreResultSets) {
  if ( !err ) {
    //console.log(tables);
    res.send(tables);
  } else {
    res.send("500");
     console.log(err.message);
    //res.send("error occurred " + err.message);
  }
  /*
    Close the connection to the database
    param 1: The callback function to execute on completion of close function.
  */
  conn.close(function(){
    console.log("Connection Closed");
    });
  });
}
});
});

router.get('/getFlatInfo', function(req, res, next) {
  var postal=req.query.postal;
  //var flattype=req.query.falttype;
  //var town=req.query.town;
  //var size=req.query.size;
  var reqStr='http://www.onemap.sg/API/services.svc/basicSearch?'
  +'token='+token
  +'&searchVal='+postal
  +'&otptFlds=SEARCHVAL,CATEGORY&returnGeom=1&rset=1&&getAddrDetl=Y ';
  //console.log(reqStr);
  client.get(reqStr, function (data, response) {
    try{
    var rObj=JSON.parse(data.toString('utf8'));
    var cv = new SVY21();
    var hdbCord = cv.computeLatLon(rObj.SearchResults[1].Y,rObj.SearchResults[1].X);
    var distanceToMrt=100000;
    var nearestMrt='';
    var nearestMrtCode='';
    //console.log(hdbId);
    var mrtCord=function() {this.lat=0; this.lon=0;};
//console.log(mrtList[0]);
    for (i = 0; i < mrtList.length; i++){
      mrtCord.lat=Number(mrtList[i].lat);
      mrtCord.lon=Number(mrtList[i].lon);
      var newDistance=getDistance(hdbCord,mrtCord);
      if (newDistance<distanceToMrt){
        distanceToMrt=newDistance;
        nearestMrt=mrtList[i].st_name;
        nearestMrtCode=mrtList[i].st_code;
        openingDate=mrtList[i].opening;
      }
    }
    var nearbySchools=[];
    var schCord=function() {this.lat=0; this.lon=0;};
    for (s = 0; s < schoolList.length; s++){
      schCord.lat=Number(schoolList[s].lat);
      schCord.lon=Number(schoolList[s].lon);
      var schDistance=getDistance(hdbCord,schCord);
      var schoolObj={school_name:"label", dis:0, top_pri:0};
      if (Math.round(schDistance)<=1000){
          schoolObj.school_name=schoolList[s].school_name;
          schoolObj.dis=Math.round(schDistance);
          schoolObj.top_pri=schoolList[s].top_pri;
          nearbySchools.push(schoolObj);
      }
    }
    //console.log(nearbySchools);
    var ret=JSON.stringify({
      address:rObj.SearchResults[1].HBRN,
      coordinates:hdbCord,
      nearestMrt:nearestMrt,
      nearestMrtCode:nearestMrtCode,
      distanceToMrt:distanceToMrt,
      openingDate:openingDate,
      nearbySchools:nearbySchools
    });
    res.send(ret);
    }
    catch(err){
      res.send("500");
    }
  }).on('error', function (err) {
    res.send("500");
    console.log('something went wrong on the request', err.request.options);
  });
});


router.get('/getPrice', function(req, res, next) {
  var flattype=req.query.falttype;
  var town=req.query.town;
  var size=req.query.size;
  var distMrt=req.query.distToMrt;
  var timeStamp=new Date().getTime()+'_01';

  var price = 0;
  var sqmPrice =0;


  var arg=[town,flattype,size,distMrt,timeStamp];
  console.log(arg);
  var rBody=JSON.stringify({
    arguments:arg
  });
  var url="https://dash6938:SADlAOKXkq59@dashdb-entry-yp-dal09-07.services.dal.bluemix.net:8443/dashdb-api/rscript/Prediction_Code_Deploy_Harish.R"
  var options = {
    url: url,
    method: 'POST',
    headers:{ "Content-Type":'application/json'},
    data: rBody
  };
  curl.request(options, function (rErr, rDate) {
    if(rErr) {
        console.log(rErr);
        res.send("500");
    }
    var resultStr=JSON.parse(rDate);
    var rOutput=resultStr.result.rScriptOutput;
    console.log(resultStr);
    var rOutputString=rOutput.split('@');

    price=rOutputString[1].trim();
    sqmPrice=rOutputString[3].trim();
    //console.log(rOutputString[1]);
    //console.log(rOutputString[3]);

    var chartUrl="https://dash6938:SADlAOKXkq59@dashdb-entry-yp-dal09-07.services.dal.bluemix.net:8443/dashdb-api/home/results/"+timeStamp+".png"
    var chartOptions = {
      url: chartUrl,
      encoding : null,
      method: 'GET'
    };
    curl.request(chartOptions, function (err, data) {
      if(err) {
          console.log(err);
          res.send("500");
      }
      require("fs").writeFile("public/results/"+timeStamp+".png", data, "binary", function(ferr) {
      if(ferr) {
          console.log(ferr);
          res.send("500");
      } else {
          var url = req.protocol + '://' + req.get('host');
          console.log(url+"/results/"+timeStamp+".png was saved!");

          var ret=JSON.stringify({
            price:price,
            price_sqm:sqmPrice,
            chart_path:url+"/results/"+timeStamp+".png"
          });
          res.send(ret);
      }
      });
    });
  });
});

router.get('/getMrt', function(req, res, next) {

  res.send(mrtList);
});

router.get('/getSch', function(req, res, next) {
  var topSch=[];
  for (var i=0; i<schoolList.length;i++){
    if (schoolList[i].top_pri==1){
      topSch.push(schoolList[i]);
    }
  }
  res.send(topSch);
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


var SVY21 = (function(){
    // Ref: http://www.linz.govt.nz/geodetic/conversion-coordinates/projection-conversions/transverse-mercator-preliminary-computations/index.aspx

    // WGS84 Datum
    this.a = 6378137;
    this.f = 1 / 298.257223563;

    // SVY21 Projection
    // Fundamental point: Base 7 at Pierce Resevoir.
    // Latitude: 1 22 02.9154 N, longitude: 103 49 31.9752 E (of Greenwich).

    // Known Issue: Setting (oLat, oLon) to the exact coordinates specified above
		// results in computation being slightly off. The values below give the most
    // accurate represenation of test data.
    this.oLat = 1.366666;     // origin's lat in degrees
    this.oLon = 103.833333;   // origin's lon in degrees
    this.oN = 38744.572;      // false Northing
		this.oE = 28001.642;      // false Easting
    this.k = 1;               // scale factor

    this.init = function(){

        this.b = this.a * (1 - this.f);
        this.e2 = (2 * this.f) - (this.f * this.f);
        this.e4 = this.e2 * this.e2;
        this.e6 = this.e4 * this.e2;
        this.A0 = 1 - (this.e2 / 4) - (3 * this.e4 / 64) - (5 * this.e6 / 256);
        this.A2 = (3. / 8.) * (this.e2 + (this.e4 / 4) + (15 * this.e6 / 128));
        this.A4 = (15. / 256.) * (this.e4 + (3 * this.e6 / 4));
        this.A6 = 35 * this.e6 / 3072;
		};
		this.init();

    this.computeSVY21 = function(lat, lon){
        //Returns a pair (N, E) representing Northings and Eastings in SVY21.

        var latR = lat * Math.PI / 180;
        var sinLat = Math.sin(latR);
        var sin2Lat = sinLat * sinLat;
        var cosLat = Math.cos(latR);
        var cos2Lat = cosLat * cosLat;
        var cos3Lat = cos2Lat * cosLat;
        var cos4Lat = cos3Lat * cosLat;
        var cos5Lat = cos4Lat * cosLat;
        var cos6Lat = cos5Lat * cosLat;
        var cos7Lat = cos6Lat * cosLat;

        var rho = this.calcRho(sin2Lat);
        var v = this.calcV(sin2Lat);
        var psi = v / rho;
        var t = Math.tan(latR);
        var w = (lon - this.oLon) * Math.PI / 180;

        var M = this.calcM(lat);
        var Mo = this.calcM(this.oLat);

        var w2 = w * w;
        var w4 = w2 * w2;
        var w6 = w4 * w2;
        var w8 = w6 * w2;

        var psi2 = psi * psi;
        var psi3 = psi2 * psi;
        var psi4 = psi3 * psi;

        var t2 = t * t;
        var t4 = t2 * t2;
        var t6 = t4 * t2;

        //	Compute Northing
        var nTerm1 = w2 / 2 * v * sinLat * cosLat;
        var nTerm2 = w4 / 24 * v * sinLat * cos3Lat * (4 * psi2 + psi - t2);
        var nTerm3 = w6 / 720 * v * sinLat * cos5Lat * ((8 * psi4) * (11 - 24 * t2) - (28 * psi3) * (1 - 6 * t2) + psi2 * (1 - 32 * t2) - psi * 2 * t2 + t4);
        var nTerm4 = w8 / 40320 * v * sinLat * cos7Lat * (1385 - 3111 * t2 + 543 * t4 - t6);
        var N = this.oN + this.k * (M - Mo + nTerm1 + nTerm2 + nTerm3 + nTerm4);

        //	Compute Easting
        var eTerm1 = w2 / 6 * cos2Lat * (psi - t2);
        var eTerm2 = w4 / 120 * cos4Lat * ((4 * psi3) * (1 - 6 * t2) + psi2 * (1 + 8 * t2) - psi * 2 * t2 + t4);
        var eTerm3 = w6 / 5040 * cos6Lat * (61 - 479 * t2 + 179 * t4 - t6);
        var E = this.oE + this.k * v * w * cosLat * (1 + eTerm1 + eTerm2 + eTerm3);

        return {N:N, E:E};
		};



		this.calcM = function(lat, lon){
        var latR = lat * Math.PI / 180;
        return this.a * ((this.A0 * latR) - (this.A2 * Math.sin(2 * latR)) + (this.A4 * Math.sin(4 * latR)) - (this.A6 * Math.sin(6 * latR)));
		};

    this.calcRho = function(sin2Lat){
        var num = this.a * (1 - this.e2);
        var denom = Math.pow(1 - this.e2 * sin2Lat, 3. / 2.);
        return num / denom;
		};

    this.calcV = function(sin2Lat){
        var poly = 1 - this.e2 * sin2Lat;
        return this.a / Math.sqrt(poly);
		};



    this.computeLatLon = function(N, E){
        //	Returns a pair (lat, lon) representing Latitude and Longitude.


        var Nprime = N - this.oN;
        var Mo = this.calcM(this.oLat);
        var Mprime = Mo + (Nprime / this.k);
        var n = (this.a - this.b) / (this.a + this.b);
        var n2 = n * n;
        var n3 = n2 * n;
        var n4 = n2 * n2;
        var G = this.a * (1 - n) * (1 - n2) * (1 + (9 * n2 / 4) + (225 * n4 / 64)) * (Math.PI / 180);
        var sigma = (Mprime * Math.PI) / (180. * G);

        var latPrimeT1 = ((3 * n / 2) - (27 * n3 / 32)) * Math.sin(2 * sigma);
        var latPrimeT2 = ((21 * n2 / 16) - (55 * n4 / 32)) * Math.sin(4 * sigma);
        var latPrimeT3 = (151 * n3 / 96) * Math.sin(6 * sigma);
        var latPrimeT4 = (1097 * n4 / 512) * Math.sin(8 * sigma);
        var latPrime = sigma + latPrimeT1 + latPrimeT2 + latPrimeT3 + latPrimeT4;

        var sinLatPrime = Math.sin(latPrime);
        var sin2LatPrime = sinLatPrime * sinLatPrime;

        var rhoPrime = this.calcRho(sin2LatPrime);
        var vPrime = this.calcV(sin2LatPrime);
        var psiPrime = vPrime / rhoPrime;
        var psiPrime2 = psiPrime * psiPrime;
        var psiPrime3 = psiPrime2 * psiPrime;
        var psiPrime4 = psiPrime3 * psiPrime;
        var tPrime = Math.tan(latPrime);
        var tPrime2 = tPrime * tPrime;
        var tPrime4 = tPrime2 * tPrime2;
        var tPrime6 = tPrime4 * tPrime2;
        var Eprime = E - this.oE;
        var x = Eprime / (this.k * vPrime);
        var x2 = x * x;
        var x3 = x2 * x;
        var x5 = x3 * x2;
        var x7 = x5 * x2;

        // Compute Latitude
        var latFactor = tPrime / (this.k * rhoPrime);
        var latTerm1 = latFactor * ((Eprime * x) / 2);
        var latTerm2 = latFactor * ((Eprime * x3) / 24) * ((-4 * psiPrime2) + (9 * psiPrime) * (1 - tPrime2) + (12 * tPrime2));
        var latTerm3 = latFactor * ((Eprime * x5) / 720) * ((8 * psiPrime4) * (11 - 24 * tPrime2) - (12 * psiPrime3) * (21 - 71 * tPrime2) + (15 * psiPrime2) * (15 - 98 * tPrime2 + 15 * tPrime4) + (180 * psiPrime) * (5 * tPrime2 - 3 * tPrime4) + 360 * tPrime4);
        var latTerm4 = latFactor * ((Eprime * x7) / 40320) * (1385 - 3633 * tPrime2 + 4095 * tPrime4 + 1575 * tPrime6);
        var lat = latPrime - latTerm1 + latTerm2 - latTerm3 + latTerm4;

        // Compute Longitude
        var secLatPrime = 1. / Math.cos(lat);
        var lonTerm1 = x * secLatPrime;
        var lonTerm2 = ((x3 * secLatPrime) / 6) * (psiPrime + 2 * tPrime2);
        var lonTerm3 = ((x5 * secLatPrime) / 120) * ((-4 * psiPrime3) * (1 - 6 * tPrime2) + psiPrime2 * (9 - 68 * tPrime2) + 72 * psiPrime * tPrime2 + 24 * tPrime4);
        var lonTerm4 = ((x7 * secLatPrime) / 5040) * (61 + 662 * tPrime2 + 1320 * tPrime4 + 720 * tPrime6);
        var lon = (this.oLon * Math.PI / 180) + lonTerm1 - lonTerm2 + lonTerm3 - lonTerm4;

        return {lat: lat / (Math.PI / 180), lon: lon / (Math.PI / 180)};
		};

});


module.exports = router;
