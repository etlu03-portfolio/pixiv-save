#!/bin/sh
echo "Installing core dependencies...";
npm install puppeteer@19.7.5;

echo "Installing development dependencies...";
npm install --save-dev eslint@latest;
npm install --save-dev eslint-plugin-prettier@latest;
npm install --save-dev prettier@latest;
npm install --save-dev eslint-config-prettier;
