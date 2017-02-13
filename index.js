'use strict';

module.exports = function (S) {
  S.classes.LocalNodeRuntime = require('./runtimes/LocalNodeRuntime')(S);
};
