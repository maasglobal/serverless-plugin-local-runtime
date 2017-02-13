
# Serverless local runtime plugin

**Require Serverless^0.5**

Add supports for local Node runtime with Serverless 0.5

## Supports:
  - Run local lambda on a child_process when call `sls function run`. In the child process, function are evaluated with flags given to `s-project.json`

## Usage:
  - Turn runtime setting in `s-function.json` to `local-node`
  - In `s-project.json`, add to custom field as following
    ```javascript
      "custom": {
        "local-node": { // Name of
          "flags": [
            --harmony
            --harmony-async-await
            // Your flags here
          ]
        }
      }
    ```
