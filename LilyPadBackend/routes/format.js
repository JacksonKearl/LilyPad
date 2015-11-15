var format = require('pg-format');

format.numberify = function(num) {
  return +(num) || -1;
};

module.exports = format;
