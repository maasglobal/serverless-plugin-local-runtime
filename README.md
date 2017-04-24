
# Serverless local runtime plugin

Adds the local Node.js version as the execution environment, with extra flags specified.

**Requires Serverless^0.5**

## Supports:
  - Run local lambda on a child_process when called `sls function run`. In the child process, the functions are evaluated with flags given to `s-project.json`.

## Usage:
  - Turn the `runtime` setting in `s-function.json` to `local-node`
  - In `s-project.json`, add the following to the `custom` field (without the comments):
    ```javascript
      "custom": {
        "local-node": { // Name of the runtime
          "babelify": true, // Babelify input (default: false)
          "name": "nodejs", // The name/runtime AWS will use (default: nodejs6.10)
          "flags": [
            "--harmony"
            "--harmony-async-await"
            // Your flags here
          ]
        }
      }
    ```
