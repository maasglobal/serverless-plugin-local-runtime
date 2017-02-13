'use strict';

const Promise = require('bluebird');
const _ = require('lodash');
const chalk = require('chalk');
const spawnSync = require('child_process').spawnSync;
const path = require('path');

// node-stringify always wrap output inside parenthesis, we do not want that.
const stringify = input => {
  return require('node-stringify')(input).slice(1).slice(0, -1);
};

module.exports = function (S) {

  const SCli = require(S.getServerlessPath('utils/cli'));

  class RunTimeNode7Harmony extends S.classes.RuntimeNode {

    static getName() {
      return 'node7harmony';
    }

    run(func, stage, region, event) {

      return this.getEnvVars(func, stage, region)
          // Add ENV vars (from no stage/region) to environment
          .then(env => {
            const handlerArr  = func.handler.split('/').pop().split('.');
            const functionFile = func.getRootPath(handlerArr[0] + (func.handlerExt || '.js'));
            const functionHandler = handlerArr[1];
            const functionRelativePath = path.relative(process.cwd(), functionFile);
            const callback = (err, result) => {

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
            };

            const _context = {
              done: callback,
            };

            const evaluateQuery = 'require("./' + functionRelativePath + '").' + functionHandler + '(' + JSON.stringify(event) + ',' + stringify(_context) + ',' + stringify(callback) + ')';

            // Start measuring run duration
            const startTime = process.hrtime();

            return new Promise(resolve => {
              const childArgs = [
                '-e', // evaluate js code
                evaluateQuery,
                '--harmony',
                '--harmony-async-await',
              ];
              const child = spawnSync('node', childArgs, { env: _.merge(env, process.env) });
              // Call Function
              SCli.log('-----------------');
              child.output.forEach(item => { if (item) { console.log(new Buffer(item).toString()); } });
              resolve();
            })
            .tap(() => {
              const endTime = process.hrtime(startTime);
              // Convert from seconds and nanoseconds to milliseconds
              const duration = endTime[0] * 1000 + endTime[1] / 1000000;
              SCli.log('Duration: ' + duration.toFixed(2) + ' ms');
            });
          })
          .catch(err => {
            SCli.log('-----------------');

            SCli.log(chalk.bold('Failed - This Error Was Thrown:'));
            SCli.log(err.stack || err);

            return {
              status: 'error',
              response: err.message,
              error: err,
            };
          });
    }

  }

  return RunTimeNode7Harmony;
};
