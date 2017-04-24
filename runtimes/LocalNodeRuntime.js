'use strict';

const Promise = require('bluebird');
const _ = require('lodash');
const chalk = require('chalk');
const child_process = require('child_process');
// const spawnSync = child_process.spawnSync;
const spawn = child_process.spawn;
const path = require('path');

module.exports = function (S) {

  const SCli = require(S.getServerlessPath('utils/cli'));

  class LocalNodeRuntime extends S.classes.RuntimeNode43 {

    constructor() {
      super();
      const project = S.getProject();
      const config = project.custom.runtime[LocalNodeRuntime.getName()] || {};

      // Add the defaults
      this.flags = config.flags || [];
      this.babelify = typeof config.babelify === 'boolean' ? config.babelify : false;
      this.name = config.name || 'nodejs6.10';
    }

    static getName() {
      return 'local-node';
    }

    getName() {
      return this.name;
    }

    run(func, stage, region, event) {
      const project = S.getProject();
      const flags = this.flags;
      const babelify = this.babelify;

      return this.getEnvVars(func, stage, region)
          // Add ENV vars (from no stage/region) to environment
          .then(env => {
            const handlerArr = func.handler.split('/').pop().split('.');
            const functionFile = func.getRootPath(handlerArr[0] + (func.handlerExt || '.js'));
            const functionHandler = handlerArr[1];
            const functionRelativePath = path.relative(process.cwd(), functionFile);

            // callback file must be required by evaluation, therefore pass only require string to evalQuery
            // const callback = 'require("serverless-plugin-local-runtime/runtimes/callback")';
            const babelOrNot = babelify ? 'require(\'babel-register\');' : '';
            const evaluateQuery = `
              ${babelOrNot}
              require("./${functionRelativePath}")
                .${functionHandler}
                  (
                    ${JSON.stringify(event)},
                    require("serverless-plugin-local-runtime/runtimes/context"),
                    require("serverless-plugin-local-runtime/runtimes/callback")
                  );
            `;

            // Start measuring run duration
            const startTime = process.hrtime();

            return new Promise(resolve => {
              const childArgs = [
                '-e', // evaluate js code
                evaluateQuery,
              ];

              // Child process to eval the code
              const child = spawn('node', childArgs.concat(flags), { env: _.merge(env, process.env) });
              let responseReceived = false;
              child.stdout.on('data', data => {
                if (data.includes('Success! - This Response Was Returned:')) { responseReceived = true; }
                if (responseReceived) {
                  SCli.log(chalk.green.bold(`${data}`));
                } else {
                  console.log((`${data}`));
                }
              });
              child.stderr.on('data', data => { SCli.log(chalk.red.bold(`${data}`)); });
              child.on('close', () => {
                const endTime = process.hrtime(startTime);
                // Convert from seconds and nanoseconds to milliseconds
                const duration = endTime[0] * 1000 + endTime[1] / 1000000;
                SCli.log('Duration: ' + duration.toFixed(2) + ' ms');

                // Return from execution
                resolve();
              });
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

  return LocalNodeRuntime;
};
