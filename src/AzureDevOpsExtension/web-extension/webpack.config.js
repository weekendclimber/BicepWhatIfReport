const path = require('path');

module.exports = {
  entry: './src/BicepReportMain.tsx',
  output: {
    filename: 'bicep-report-extension.js',
    path: path.resolve(__dirname, 'contents'),
    clean: false, // Don't clean the contents directory to preserve other files
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.scss$/i,
        use: ['style-loader', 'css-loader', 'sass-loader'],
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'scripts/[hash][ext]',
        },
      },
    ],
  },
  target: 'web',
  devtool: process.env.NODE_ENV === 'development' ? 'source-map' : false,
};