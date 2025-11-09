const config = require('../config');
function set(key, value) {
  const num = !isNaN(value) ? Number(value) : value;
  config.set(key, num);
  console.log(` Config "${key}" set to`, num);
}
module.exports = { set };
