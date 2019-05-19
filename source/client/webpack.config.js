/**
 * 3D Foundation Project
 * Copyright 2019 Smithsonian Institution
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

"use strict";

const webpack = require("webpack");
const fs = require("fs-extra");
const path = require("path");

const TerserPlugin = require("terser-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin");
const HTMLWebpackPlugin = require("html-webpack-plugin");

////////////////////////////////////////////////////////////////////////////////

const project = path.resolve(__dirname, "../..");

const dirs = {
    project,
    source: path.resolve(project, "source"),
    assets: path.resolve(project, "assets"),
    output: path.resolve(project, "dist"),
    modules: path.resolve(project, "node_modules"),
    libs: path.resolve(project, "libs"),
};

const apps = {
    "explorer": {
        name: "voyager-explorer",
        entryPoint: "client/ui/explorer/MainView.ts",
        title: "Voyager Explorer",
        template: "viewer.hbs",
    },
    "mini": {
        name: "voyager-mini",
        entryPoint: "client/ui/mini/MainView.ts",
        title: "Voyager Mini",
        template: "viewer.hbs",
    },
    "story": {
        name: "voyager-story",
        entryPoint: "client/ui/story/MainView.ts",
        title: "Voyager Story",
        template: "story.hbs",
    },
    "demo": {
        name: "voyager-demo",
        entryPoint: "client/demo.js",
        title: "Voyager Tools",
        template: "demo.hbs",
    },
};

////////////////////////////////////////////////////////////////////////////////

module.exports = function(env, argv) {

    const isDevMode = argv.mode !== "production";
    const isLocal = !!argv.local;
    const appKey = argv.app || "explorer";
    const version = argv.vers || "x.x.x";

    // copy static assets and license files
    fs.copy(dirs.assets, dirs.output, { overwrite: true });
    fs.copy(path.resolve(dirs.project, "LICENSE.md"), path.resolve(dirs.output, "LICENSE.md"), { overwrite: true });
    fs.copy(path.resolve(dirs.project, "3RD_PARTY_LICENSES.txt"), path.resolve(dirs.output, "3RD_PARTY_LICENSES.txt"), { overwrite: true });

    if (appKey === "all") {
        return [
            createAppConfig(apps.explorer, version, dirs, isDevMode, isLocal),
            createAppConfig(apps.mini, version, dirs, isDevMode, isLocal),
            createAppConfig(apps.story, version, dirs, isDevMode, isLocal),
            createAppConfig(apps.demo, version, dirs, isDevMode, isLocal),
        ];
    }
    else {
        return createAppConfig(apps[appKey], version, dirs, isDevMode, isLocal);
    }
};

function createAppConfig(app, version, dirs, isDevMode, isLocal)
{
    const devMode = isDevMode ? "development" : "production";
    const localTag = isLocal ? "-local" : "";
    const appName = app.name;
    const appTitle = `${app.title} ${version} ${isDevMode ? " DEV" : " PROD"}`;

    console.log("VOYAGER - WEBPACK BUILD SCRIPT");
    console.log("application = %s", appName);
    console.log("mode = %s", devMode);
    console.log("local = %s", isLocal);
    console.log("version = %s", version);
    console.log("source directory = %s", dirs.source);
    console.log("output directory = %s", dirs.output);

    const config = {
        mode: devMode,

        entry: { [appName]: path.resolve(dirs.source, app.entryPoint) },

        output: {
            path: dirs.output,
            filename: isDevMode ? "js/[name].dev.js" : "js/[name].min.js"
        },

        resolve: {
            modules: [
                dirs.modules
            ],
            // Aliases for FF Foundation Library components
            alias: {
                "client": path.resolve(dirs.source, "client"),
                "@ff/core": path.resolve(dirs.libs, "ff-core/source"),
                "@ff/graph": path.resolve(dirs.libs, "ff-graph/source"),
                "@ff/ui": path.resolve(dirs.libs, "ff-ui/source"),
                "@ff/react": path.resolve(dirs.libs, "ff-react/source"),
                "@ff/browser": path.resolve(dirs.libs, "ff-browser/source"),
                "@ff/three": path.resolve(dirs.libs, "ff-three/source"),
                "@ff/scene": path.resolve(dirs.libs, "ff-scene/source")
            },
            // Resolvable extensions
            extensions: [".ts", ".tsx", ".js", ".json"]
        },

        optimization: {
            minimize: !isDevMode,

            minimizer: [
                new TerserPlugin({ parallel: true }),
                new OptimizeCSSAssetsPlugin({}),
            ]
        },

        plugins: [
            new webpack.DefinePlugin({
                ENV_PRODUCTION: JSON.stringify(!isDevMode),
                ENV_DEVELOPMENT: JSON.stringify(isDevMode),
                ENV_LOCAL: JSON.stringify(isLocal),
                ENV_VERSION: JSON.stringify(appTitle),
            }),
            new MiniCssExtractPlugin({
                filename: isDevMode ? "css/[name].dev.css" : "css/[name].min.css",
                allChunks: true
            }),
            new HTMLWebpackPlugin({
                filename: isDevMode ? `${appName}-dev${localTag}.html` : `${appName}${localTag}.html`,
                template: app.template,
                title: appTitle,
                version: version,
                isDevelopment: isDevMode,
                isLocal: isLocal,
                analyticsId: process.env.ANALYTICS_ID || "",
                element: `<${appName}></${appName}>`,
                chunks: [ appName ],
            })
        ],

        // loaders execute transforms on a per-file basis
        module: {
            rules: [
                {
                    // Raw text and shader files
                    test: /\.(txt|glsl|hlsl|frag|vert|fs|vs)$/,
                    loader: "raw-loader"
                },
                {
                    // Typescript/JSX files
                    test: /\.tsx?$/,
                    loader: "awesome-typescript-loader"
                },
                {
                    // Enforce source maps for all javascript files
                    enforce: "pre",
                    test: /\.js$/,
                    loader: "source-map-loader"
                },
                {
                    // Transpile SCSS to CSS and concatenate
                    test: /\.scss$/,
                    use: [
                        MiniCssExtractPlugin.loader,
                        { loader: "css-loader", options: { minimize: !isDevMode } },
                        "sass-loader"
                    ]
                },
                {
                    // Concatenate CSS
                    test: /\.css$/,
                    use: [
                        MiniCssExtractPlugin.loader,
                        'style-loader',
                        { loader: "css-loader", options: { minimize: !isDevMode } },
                    ]
                },
                {
                    test: /\.hbs$/,
                    loader: "handlebars-loader"
                },
            ]
        },

        // When importing a module whose path matches one of the following, just
        // assume a corresponding global variable exists and use that instead.
        externals: {
            "three": "THREE",
            "quill": "Quill",
        }
    };

    if (isDevMode) {
        config.devtool = "source-map";
    }

    return config;
}
