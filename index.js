class serverlessPluginIfElse {
    /**
     * 
     * @param {*} serverless 
     * @param {*} options 
     */
    constructor(serverless, options = {}) {
        this.serverless = serverless;
        this.options = options;
        this.hooks = {
            "before:package:initialize": this.applyConditions.bind(this),
            "before:offline:start:init": this.applyConditions.bind(this),
            "before:offline:start": this.applyConditions.bind(this),
        };
        this.pluginName = "serverless-plugin-ifelse";
    }
    /**
     * 
     */
    applyConditions() {
        let params = this.serverless.service.custom.serverlessIfElse;
        if (!this.isvalidObject(params)) {
            return;
        }
        params.forEach((item) => {
            if (item.If) {
                try {
                    if (eval(item.If)) {
                        this.conditionMatchLog(item.If, true);
                        this.setItemValues(item.Set);
                        this.removeItems(item.Exclude);
                    } else {
                        this.conditionMatchLog(item.If, false);
                        this.setItemValues(item.ElseSet);
                        this.removeItems(item.ElseExclude);
                    }
                } catch (e) {
                    this.evaluateErrorLog(item.If, e);
                }
            }

            if (this.isvalidObject(item.ExcludeIf)) {
                Object.keys(item.ExcludeIf).forEach((exludeKey) => {
                    try {
                        if (eval(item.ExcludeIf[exludeKey])) {
                            this.conditionMatchLog(item.ExcludeIf[exludeKey], true);
                            this.changeKey(exludeKey);
                        }
                    }
                    catch (e) {
                        this.evaluateErrorLog(item.ExcludeIf[exludeKey], e);
                    }
                });
            }
        });
    }

    /**
     * 
     * @param {*} item 
     */
    isvalidObject(item) {
        return item && typeof item == "object";
    }

    /**
     * 
     * @param {*} items 
     */
    setItemValues(items) {
        if (!this.isvalidObject(items)) {
            return;
        }
        Object.keys(items).forEach((key) => {
            this.changeKey(key, "set", items[key]);
        });
    }
    /**
     * 
     * @param {*} item 
     */
    removeItems(item) {
        if (!item) {
            return;
        }
        if (typeof item == "object") {
            item.forEach((key) => {
                this.changeKey(key);
            });
        } else {
            this.changeKey(item);
        }
    }

    /**
     * 
     * @param {*} keyPath 
     */
    changeKey(keyPath, type = "remove", newValue = null) {
        let path = keyPath.split(".");
        if (path.length <= 1) {
            return;
        }
        let item = this.serverless.service;
        let i = 0;
        for (i; i < path.length - 1; i++) {
            item = item[path[i]];
            if (!item) {
                return;
            }
        }
        if (path[i] in item) {
            if (type == "remove") {
                this.serverless.cli.log(this.pluginName + " - Excluding: " + keyPath);
                delete item[path[i]];
            } else if (type == "set") {
                item[path[i]] = newValue;
                if (typeof newValue == "object") {
                    newValue = JSON.stringify(newValue);
                }
                this.serverless.cli.log(this.pluginName + " - Value Changed for : " + keyPath + " to: " + newValue);
            }
        // If item not exists => add it to path    
        } else {
            if (type == "set") {
                item[path[i]] = newValue;
                if (typeof newValue == "object") {
                    newValue = JSON.stringify(newValue);
                }
                this.serverless.cli.log(this.pluginName + " - Value Changed for : " + keyPath + " to: " + newValue);
            }
        }


    }

    /**
     * 
     * @param {*} condition 
     * @param {*} matched 
     */
    conditionMatchLog(condition, matched = true) {
        if (this.options.v || this.options.verbose) {
            this.serverless.cli.log(this.pluginName + " - (" + condition + ") Condition" +
                ((!matched) ? " not" : "") + " true.");
        }
    }

    /**
     * 
     * @param {*} condition 
     * @param {*} e 
     */
    evaluateErrorLog(condition, e) {
        this.serverless.cli.log(this.pluginName + " - cannot evaluate condition " +
            condition + " : " + e);
    }
}

module.exports = serverlessPluginIfElse;
