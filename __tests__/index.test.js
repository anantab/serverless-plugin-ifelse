const serverlessPluginIfElse = require("../index");
let serverless = {};

describe("Test Serverless IfElse Plugin With Condition Set 1", () => {
    beforeAll(() => {
        const condition = getConditions("condition1");
        serverless = getServerless();
        serverless.service.custom.serverlessIfElse = condition;
        const serverlessIfElse = new serverlessPluginIfElse(serverless);
        serverlessIfElse.applyConditions();
    });

    it("It Should Remove Serverless Properties in Exlude when If condition Matches", () => {
        expect(serverless.service.functions.func1).toBeUndefined();
        expect(serverless.service.functions.role).toBeUndefined();
    });

    it("It Should Set Serverless Properties in Set When If condition Matches", () => {
        expect(serverless.service.provider.profile).toBe("dev");
    });

    it("It Should Not Remove Serverless Properties in ElseExclude condition when If condition Matches", () => {
        expect(serverless.service.functions.func2).toBeDefined();
        expect(serverless.service.functions.func2.name).toBe("Function 2");
        expect(serverless.service.provider.iamRoleStatements).toBeDefined();
    });

    it("It Should Not Set Serverless Properties in ElseSet when If condition Matches", () => {
        expect(serverless.service.provider.timeout).toBe(300);
    });

    it("It Should Not Remove Serverless Properties in ExcludeIf when condition Does not Match", () => {
        expect(serverless.service.functions.func3).toBeDefined();
        expect(serverless.service.functions.func3.name).toBe("Function 3");
    });

    it("It Should create property if not defined", () => {
        expect(serverless.service.provider.region).toBe("ap-southeast-2");
    });
});


describe("Test Serverless IfElse Plugin With Condition Set 2", () => {
    beforeAll(() => {
        const condition = getConditions("condition2");
        serverless = getServerless();
        serverless.service.custom.serverlessIfElse = condition;
        const serverlessIfElse = new serverlessPluginIfElse(serverless);
        serverlessIfElse.applyConditions();
    });

    it("It Should Not Remove Serverless Properties in Exlude when If condition Does Not Match", () => {
        expect(serverless.service.functions.func1).toBeDefined();
        expect(serverless.service.functions.func1.name).toBe("Function 1");
    });

    it("It Should Not Set Serverless Properties in Set When If condition Does Not Match", () => {
        expect(serverless.service.provider.profile).toBe("default");
    });

    it("It Should Remove Serverless Properties in ElseExclude when If condition Does Not Match", () => {
        expect(serverless.service.functions.func2).toBeUndefined();
        expect(serverless.service.provider.iamRoleStatements).toBeUndefined();
    });

    it("It Should Set Serverless Properties in ElseSet when If condition Does Not Match", () => {
        expect(serverless.service.provider.timeout).toBe(90);
    });

    it("It Should Remove Serverless Properties in ExcludeIf when condition Matches", () => {
        expect(serverless.service.functions.func3).toBeUndefined();
    });
});

describe("Test Serverless IfElse Plugin With Condition Set 3", () => {
    beforeAll(() => {
        const condition = getConditions("condition3");
        serverless = getServerless();
        serverless.service.custom.serverlessIfElse = condition;
        const serverlessIfElse = new serverlessPluginIfElse(serverless);
        serverlessIfElse.applyConditions();
    });

    it("It Should Set Serverless Properties in Set when If condition Matches and the serverless property is falsy boolean value ", () => {
        expect(serverless.service.custom.customCertificate.enabled).toBeTruthy();
    });
});

const getServerless = function () {
    return {
        service: {
            service: "Serverless Condition",
            custom: {
                serverlessExclude: [],
                customCertificate: {
                    enabled: false
                }
            },
            provider: {
                name: "aws",
                runtime: "nodejs6.10",
                timeout: 300,
                stage: "dev",
                profile: "default",
                role: "arn:aws:iam::xxxxxxxxxxxx:role/Test",
                iamRoleStatements: [{
                    Effect: "Allow",
                    Action: ["s3:*"],
                    Resource: "*"
                }]
            },
            functions: {
                func1:
                {
                    name: "Function 1",
                    handler: "func1.handler",
                    events: [{
                        http: {
                            path: "path1",
                            method: "post",
                            private: true,
                            cors: true
                        }
                    }
                    ],
                },
                func2:
                {
                    name: "Function 2",
                    handler: "func2.handler",
                    events: [{
                        http: {
                            path: "path2",
                            method: "post",
                            private: true,
                            cors: true
                        }
                    }
                    ],
                },
                func3:
                {
                    name: "Function 3",
                    handler: "func3.handler",
                    events: [{
                        http: {
                            path: "path3",
                            method: "post",
                            private: true,
                            cors: true
                        }
                    }
                    ],
                }
            }
        },
        cli: {
            log: jest.fn()
        }
    };
};

const getConditions = function (condition) {
    const conditions = {
        condition1: [
            {
                If: '"true"=="true"',
                Exclude: [
                    "functions.func1",
                    "provider.role"
                ],
                Set: {
                    "provider.profile": "dev",
                    "provider.region": "ap-southeast-2"
                },
                ElseExclude: [
                    "functions.func2",
                    "provider.iamRoleStatements"
                ],
                ElseSet: {
                    "provider.stage": "production",
                    "provider.timeout": 90
                }
            },
            {
                ExcludeIf:
                {
                    "functions.func3": '"true" == "false"',
                }
            }
        ],
        condition2: [
            {
                If: '"true"=="false"',
                Exclude: [
                    "functions.func1",
                ],
                Set: {
                    "provider.profile": "production",
                    "provider.timeout": 60
                },
                ElseExclude: [
                    "functions.func2",
                    "provider.iamRoleStatements"
                ],
                ElseSet: {
                    "provider.timeout": 90
                }
            },
            {
                ExcludeIf:
                {
                    "functions.func3": '"true" == "true"',
                }
            }
        ],
        condition3: [
            {
                If: '"true"=="true"',
                Set: {
                    "custom.customCertificate.enabled": "true",
                },
            }
        ]
    };
    return conditions[condition];
};