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
            "before:remove:remove": this.applyConditions.bind(this),
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
                let keyPaths = Object.keys(item.ExcludeIf);

                // Sort keyPaths to remove array items at correct indices
                keyPaths = this.sortKeyPathsDesc(keyPaths);

                keyPaths.forEach((excludeKey) => {
                    try {
                        if (eval(item.ExcludeIf[excludeKey])) {
                            this.conditionMatchLog(item.ExcludeIf[excludeKey], true);
                            this.changeKey(excludeKey);
                        }
                    }
                    catch (e) {
                        this.evaluateErrorLog(item.ExcludeIf[excludeKey], e);
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
     * @param {string} str
     */
    isDigitsOnly(str) {
        return /^\d+$/.test(str);
    }

    /**
     * Sorts key paths in descending order in such way that indices in the path
     * are correctly treated as numbers. The original array is not touched.
     * @param {string[]} keyPaths
     */
    sortKeyPathsDesc(keyPaths) {
        const keyPathsParsed = keyPaths.map(keyPath => keyPath.split("."));

        keyPathsParsed.sort((pathA, pathB) => {
            for (let i = 0; i < Math.min(pathA.length, pathB.length); i++) {
                if (this.isDigitsOnly(pathA[i]) && this.isDigitsOnly(pathB[i])) {
                    const numA = parseInt(pathA[i]);
                    const numB = parseInt(pathB[i]);
                    if (numA < numB) {
                        return 1;
                    } else if (numA > numB) {
                        return -1;
                    }
                } else {
                    // Use the default comparator
                    if (pathA[i] < pathB[i]) {
                        return 1;
                    } else if (pathA[i] > pathB[i]) {
                        return -1;
                    }
                }
            }

            if (pathA.length < pathB.length) {
                return 1;
            } else if (pathA.length > pathB.length) {
                return -1;
            }

            return 0;
        });

        return keyPathsParsed.map(path => path.join("."));
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
            // Sort keyPaths to remove array items at correct indices
            item = this.sortKeyPathsDesc(item);

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
                if (Array.isArray(item)) {
                    item.splice(path[i], 1);
                } else {
                    delete item[path[i]];
                }
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
