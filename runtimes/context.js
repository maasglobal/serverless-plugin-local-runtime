'use strict';

module.exports = {
  done: (err, result) => {

    // Show error
    if (err) {
      console.log('Failed - This Error Was Returned:');
      console.log(err.message);
      console.log(err.stack);

      console.log(JSON.stringify({
        status: 'error',
        response: err.message,
        error: err,
      }, null, 2));
    }

    // Show success response
    console.log('Success! - This Response Was Returned:');
    console.log(JSON.stringify({
      status: 'success',
      response: result,
    }, null, 2));
  },
};
