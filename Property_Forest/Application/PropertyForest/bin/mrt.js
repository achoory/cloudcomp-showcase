var neartestMRT = function(connection) {
  connection.query('SELECT * FROM mrt_lrt where lat !="NR"', function(mrt_err, mrt_rows, mrt_fields) {
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




    return {
        stationName: ibmdb,
        stationCode: connString,
        distance: dist
    };
};

module.exports = neartestMRT();
