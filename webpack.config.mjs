import * as path from 'node:path';
import * as url from 'node:url';
import HtmlWebpackPlugin from 'html-webpack-plugin';
// import MiniCssExtractPlugin from 'mini-css-extract-plugin';

const config = {
    mode: 'development',
    target: 'web',
    entry: [
        './src/app/main.ts',
        // './src/styles/style.scss',
    ],
    devServer: {
        static: false,
        watchFiles: ['src/**/*'],
        liveReload: true,
        port: 8080,
    },
    module: {
        rules: [
            {
                test: /.ts$/u,
                use: 'ts-loader',
                exclude: /node_modules/u,
            },
            {
                test: /\.txt/,
                type: 'asset/source'
            },
            // {
            //     test: /.scss$/ui,
            //     use: [MiniCssExtractPlugin.loader, 'css-loader', 'sass-loader'],
            // },
        ],
    },
    resolve: {
        extensions: ['.ts', '.js'],
    },
    output: {
        clean: true,
        hashDigest: 'hex',
        filename: 'bundle.[contenthash].js',
        path: path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), 'dist'),
    },
    plugins: [
        // new MiniCssExtractPlugin({
        //     filename: 'bundle.[contenthash].css',
        // }),
        new HtmlWebpackPlugin({
            template: 'src/index.html',
        }),
    ]
};

export default config;
