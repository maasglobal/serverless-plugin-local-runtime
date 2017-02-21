'use strict';

module.exports = (err, result) => {

  // Show error
  if (err) {
    return;
  }

  // Show success response
  console.log('Success! - This Response Was Returned:');
  console.log(JSON.stringify(result, null, 2));
  return;
};
