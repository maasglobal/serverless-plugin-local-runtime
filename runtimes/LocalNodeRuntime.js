'use strict';

const Promise = require('bluebird');
const _ = require('lodash');
const chalk = require('chalk');
const spawnSync = require('child_process').spawnSync;
const path = require('path');

module.exports = function (S) {

  const SCli = require(S.getServerlessPath('utils/cli'));

  class LocalNodeRuntime extends S.classes.RuntimeNode43 {

    static getName() {
      return 'local-node';
    }

    run(func, stage, region, event) {

      const project = S.getProject();
      let runtimeFlags = [];
      if (Array.isArray(project.custom.runtime[LocalNodeRuntime.getName()].flags)) {
        runtimeFlags = project.custom.runtime[LocalNodeRuntime.getName()].flags;
      }

      return this.getEnvVars(func, stage, region)
          // Add ENV vars (from no stage/region) to environment
          .then(env => {
            const handlerArr  = func.handler.split('/').pop().split('.');
            const functionFile = func.getRootPath(handlerArr[0] + (func.handlerExt || '.js'));
            const functionHandler = handlerArr[1];
            const functionRelativePath = path.relative(process.cwd(), functionFile);

            // callback file must be required by evaluation, therefore pass only require string to evalQuery
            // const callback = 'require("serverless-plugin-local-runtime/runtimes/callback")';

            const evaluateQuery = `
              var callback=require("serverless-plugin-local-runtime/runtimes/callback");
              var context = new Function('return {done: callback}');
              require("./${functionRelativePath}")
                .${functionHandler}
                  (
                    ${JSON.stringify(event)},
                    context,
                    callback
                  );
            `;

            // Start measuring run duration
            const startTime = process.hrtime();

            return new Promise(resolve => {
              const childArgs = [
                '-e', // evaluate js code
                evaluateQuery,
              ];

              // Use project defined flags as args
              runtimeFlags.forEach(flag => (childArgs.push(flag)));

              // Eval
              const child = spawnSync('node', childArgs, { env: _.merge(env, process.env) });

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

  return LocalNodeRuntime;
};
