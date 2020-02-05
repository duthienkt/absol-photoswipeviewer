const path = require('path');

var processFolder = process.cwd().replace(/\\/, '/');
var relative = path.relative(processFolder, __dirname);


function resolveEntry(entryInProject){
    var entryInProcess = path.join(relative, entryInProject);
    if (!entryInProcess.startsWith('./')) entryInProcess = './' + entryInProcess;
    return entryInProcess;

}

var packages = {
    default: {
        entry: ["./dev.js"],
        filename: "./dist/photoswipeviewer.js"
    }
}

const PACKAGE = 'default';


module.exports = {
    mode: process.env.MODE || "development",
    // mode: 'production',
    entry: packages[PACKAGE].entry.map(resolveEntry),
    output: {
        path: path.join(__dirname, "."),
        filename: packages[PACKAGE].filename
    },
    resolve: {
        modules: [
            path.join(__dirname, './node_modules')
        ]
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                loader: 'babel-loader',
                options: { presets: [['@babel/preset-env', { modules: false }]] }
            },
            {
                test: /\.(tpl|txt|xml|rels)$/i,
                use: 'raw-loader'
            },
            {
                test: /\.css$/i,
                use: ['style-loader', 'css-loader']
            }
        ]
    },
    devServer: {
        compress: true,
        host: '0.0.0.0',
        disableHostCheck: true
    },
    performance: {
        hints: false
    }
};