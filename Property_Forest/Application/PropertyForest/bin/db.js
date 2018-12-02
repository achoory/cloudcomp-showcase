var newDb = function() {
    var ibmdb = require('ibm_db');
    var env = require('./vcapServices');
    var db2;
      db2 = env['dashDB'][0].credentials;
    var connString = "DRIVER={DB2};DATABASE=" + db2.db + ";UID="
      + db2.username + ";PWD=" + db2.password + ";HOSTNAME=" + db2.hostname + ";port=" + db2.port;
    return {
        ibmdb: ibmdb,
        connString: connString
    };
};

module.exports = newDb();
