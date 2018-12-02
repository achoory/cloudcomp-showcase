
var env;
// if running in Bluemix, use the environment variables
if (process.env.VCAP_SERVICES) {
  env = JSON.parse(process.env.VCAP_SERVICES);
// otherwise use our JSON file
} else {
  try {
    env = require('../VCAP_SERVICES.json');
  } catch (e) {
    console.error(e);
  }
}
module.exports = env;
