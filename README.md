[![NPM](https://nodei.co/npm/serverless-plugin-ifelse.png)](https://nodei.co/npm/serverless-plugin-ifelse/)

[![Build Status](https://api.travis-ci.org/anantab/serverless-plugin-ifelse.png)](https://travis-ci.org/anantab/serverless-plugin-ifelse)
[![devDependencies Status](https://david-dm.org/anantab/serverless-plugin-ifelse/dev-status.svg)](https://david-dm.org/anantab/serverless-plugin-ifelse?type=dev)

# Serverless Plugin IfElse
While you can use serverless variables to define different values for your atrributes based on either stage or other properties, it sometimes is not as straightforward.

For example, If you have a serverless project with 3 functions and you want to deploy all 3 functions in one region but only 2 of them in other region, then there is no easier way to exlude the third function based on region you are deploying.

Another use case that inspired me to write this plugin was, I wanted to use ```iamRoleStatements``` for all my Lambda functions in staging but use a pre-define ```role``` in production. You cannot have both attributes in serverless.yml file as serverless ignores ```iamRoleStatements``` if there is ```role``` attribute.

This plugin allows you to write if else conditions in ```serverless.yml``` file to add, remove or change the values of attributes in the yml file. It works with both ```package``` and ```deploy``` commands. It also works with ```serverless-offline``` plugin.


# Installation
```npm i serverless-plugin-ifelse --save-dev```

## Example
serverless.yml
```
service: serverlessIfElseExample
custom:
  currentStage: ${opt:stage, self:provider.stage}
  serverlessIfElse:
      - If: '"${self:custom.currentStage}" == "dev"'
        Exclude:
          - provider.role
          - provider.environment.ENV1
          - functions.func3
          - functions.func1.events.0.http.authorizer
        Set:
          provider.timeout: 90
          provider.profile: dev
        ElseExclude:
          - provider.environment.ENV2
        ElseSet:
           provider.timeout: 120

      - ExcludeIf:
           functions.func1: '"${self:provider.region}" == "ap-southeast-2"'
           functions.func2: '"${opt:region}" == "us-east-1"'

      - If: '"${self:provider.region}" == "us-east-1"'
        Exclude:
          - functions.func1
        Set:
          provider.timeout: 300


plugins:
  - serverless-plugin-ifelse

provider:
  name: aws
  runtime: nodejs8.10
  stage: dev
  region : ap-southeast-2
  timeout: 60
  environment:
    ENV1: env-val-1
    ENV2: env-val-2
  profile: default
  iamRoleStatements:
    - Effect: Allow
      Action:
      - s3:*
      Resource: "*"
  role: arn:aws:iam::xxxxxxxxxxxx:role/testRole

functions:
  func1:
    name: Function 1
    handler: lambda.func1
    events:
      - http:
          path: "path1"
          method: "post"
          authorizer:
            arn: arn:aws:cognito-idp:us-east-1:123456789012:userpool/us-east-1_0acCDefgh

  func2:
    name: Function 2
    handler: lambda.func2
    events:
      - http:
           path: "path2"
           method: "post"

  func3:
    name: Function 3
    handler: lambda.func2
    events:
      - http:
           path: "path3"
           method: "post"
```

Put your conditions in custom variable ```serverlessIfElse```.

## - If
 Write your if condition inside single quote ```''```. Inside your condition, all your variables that resolve in string or the string themselves should be inside double quote. The plugin will otherwise encounter undefined variable error and the condition will not work. The condition can be anything, like == , !=, <, > or even javascript regular expressions.

```- If: '"${self:provider.stage}" == "dev"'```

### Exclude
If condition in If is true, all attibutes in Exclude will be ignored before serverless package or deploy your stack and hence serverless will not see those attributes.

### Set
If condition in If is true, the value of the attribute will be updated with new value.

### ElseExclude
If condition in If is false,the attibutes will be ignored.

### ElseSet
If condition in If is false, the value of the attribute will be updated with new value.

## - ExcludeIf
Use ExcludeIf, if you want to write conditions per attribute. If condition is true, only that attribute will be ignored.


```You can write as many conditions as you like and exclude or set attributes any level deep in the yml file.```

## Note
This plugin will ignore or update value of attributes based on your conditions and does not evaluate if it causes any side effect. You are responsbile to make sure ignoring or setting new values will work as you expected and will not cause serverless to throw error.

The plugin will not remove or update any first level attributes in serverless.yml file  like ```service``` or ```provider``` or ```functions```.
