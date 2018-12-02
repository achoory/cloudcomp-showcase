
var express = require('express');
var router = express.Router();
var db = require('../bin/db');
//GET home page.
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Property Forest', page:'index' });
});

router.get('/price', function(req, res, next) {
  res.render('price', { title: 'Property Forest', page:'price' });
});

router.get('/expressTest', function(req, res, next) {
  res.render('test', { title: 'Express Test Page' });
});


router.get('/dbTest', function(req, res, next) {
  db.ibmdb.open(db.connString, function(err, conn) {
  console.log("Connection Opened");
  if (err ) {
   res.send("error occurred " + err.message);
  }
  else {
    conn.query("SELECT FIRST_NAME, LAST_NAME, EMAIL, WORK_PHONE from GOSALESHR.employee FETCH FIRST 20 ROWS ONLY", function(err, tables, moreResultSets) {
    if ( !err ) {
      //console.log(tables);
      res.send(tables);
    } else {
       res.send("error occurred " + err.message);
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
  } );
});

module.exports = router;
