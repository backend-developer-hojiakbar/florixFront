import path from 'path';
import HtmlWebpackPlugin from 'html-webpack-plugin';

export default {
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  target: 'web',
  entry: './src/index.tsx',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[contenthash].js',
    clean: true,
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/, // Match TypeScript files
        exclude: /node_modules/, // Exclude node_modules directory
        use: {
          loader: 'ts-loader', // Use ts-loader for TypeScript files
          options: {
            transpileOnly: true, // Only transpile TypeScript to JavaScript
          },
        },
      },
      {
        test: /\.(css|scss)$/, // Match CSS and SCSS files
        use: ['style-loader', 'css-loader'], // Use style-loader and css-loader
      },
      {
        test: /\.(png|jpe?g|gif|svg)$/i, // Match image files
        type: 'asset/resource', // Use asset/resource type
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html', // Use index.html as template
    }),
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist'),
    },
    compress: true,
    port: 3000,
  },
};
