const path = require("path");

const webpackConfig = {
    entry: "./memoml.ts",
    module: {
        rules: [
            {
                use: "ts-loader",
                test: function (modulePath) {
                    return modulePath.endsWith(".ts") && !modulePath.endsWith(".test.ts");
                },
                exclude: [
                    /node_modules/,
                    /.*\.test\.ts$/
                ],
            },
        ],
    },
    resolve: {
        extensions: [".ts"],
    },
    output: {
        filename: "memoml.js",
        path: path.resolve(__dirname, "."),
        globalObject: "this",
        library: {
            name: "MemoML",
            type: "umd",
        },
    },
};

const NodeEnv = {
    DEVELOPMENT: "development",
    PRODUCTION: "production"
};

const nodeEnv = process.env.NODE_ENV || NodeEnv.PRODUCTION;
if (nodeEnv === NodeEnv.DEVELOPMENT) {
    webpackConfig.mode = NodeEnv.DEVELOPMENT;
    webpackConfig.devtool = "inline-source-map";
} else if (nodeEnv === NodeEnv.PRODUCTION) {
    webpackConfig.mode = NodeEnv.PRODUCTION;
    webpackConfig.devtool = "source-map";
} else {
    throw new Error(`Unsupported NODE_ENV value: "${nodeEnv}".`);
}

module.exports = webpackConfig;
