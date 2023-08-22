/**
 * @fileoverview
 *   Pixiv users artwork downloader
 *
 * @author https://github.com/etlu03-portfolio
 * @release 2023
 */

const puppeteer = require('puppeteer');

const process = require('process');
const fs = require('fs');
const path = require('path');

/**
 * Gathers all the hyperlinks with the word 'artworks' in it
 * @param {Object} page Puppeteer page instance
 * @return {Array}
 */
async function collectArtworks(page) {
  const tags = await page.$x('//a');
  const hrefs = await Promise.all(
    tags.map(async (item) => await (await item.getProperty('href')).jsonValue())
  );

  // filter hyperlinks
  const artworks = hrefs.filter((src) => src.includes('artworks'));

  return artworks;
}

/**
 * Collects all the hyperlinks to artworks found in the 'Illustrations' tab
 * @param {Object} page Puppeteer page instance
 * @param {string} url Web address
 * @return {Set}
 */
async function retrieveHyperlinks(page, url) {
  const artworks = new Set();

  const links = await collectArtworks(page);
  links.forEach((item) => artworks.add(item));

  // check if there are more than one page of artworks
  const [works] = await page.$x('//h2[text()="Works"]/../div/div/span');
  const numberOfWorks = await page.evaluate((text) => text.innerText, works);

  // navigate to the other pages
  const pageLimit = Math.ceil(numberOfWorks / 48);
  for (let p = 2; p <= pageLimit; p++) {
    await page.goto(url + `?p=${p}`, {
      waitUntil: 'networkidle2',
    });
    await page.bringToFront();

    const links = await collectArtworks(page);
    links.forEach((item) => artworks.add(item));
  }

  return artworks;
}

/**
 * Downloads the master image from each hyperlink
 * @param {Object} page Puppeteer page instance
 * @param {Set} artworks Collection of hyperlinks
 */
async function download(page, artworks) {
  // intercept any potential images
  page.on('response', async (response) => {
    if (response.request().resourceType() === 'image') {
      const url = response.url();
      if (url.includes('https://i.pximg.net/img-master') === true) {
        response.buffer().then((file) => {
          try {
            const id = /([^\/.]+)\.jpg/.exec(url)[0];
            console.log(`pixiv-save: downloading image: ${id}...`);

            const filePath = path.join('files', id);

            const writeStream = fs.createWriteStream(filePath);
            writeStream.write(file);
            console.log(`pixiv-save: download completed`)
          } catch {
            console.log(`pixiv-save: failed to downlod`);
          }
        });
      }
    }
  });

  // navigate to each hyperlink
  const links = Array.from(artworks);
  for (let i = 0; i < 1; i++) {
    try {
      await page.goto(links[i], {
        waitUntil: 'networkidle2',
      });
      await page.bringToFront();
    } catch {
      continue;
    }
  }
}

/**
 * Main point of entry for 'save.js'
 */
(async () => {
  const argc = process.argv.length;
  try {
    if (argc !== 3) {
      throw new TypeError(
        `Incorrect number of arguments. Expected at least 3, recieved ${argc}`
      );
    }

    const url = process.argv[2];
    if (/(^https:\/\/www\.pixiv.+)users\/(.*)\/illustrations/.exec(url) === null) {
      throw new TypeError(
        'Incorrect URL format. See the "Illustration" tab on Pixiv for a valid URL'
      );
    }

    const browser = await puppeteer.launch({
      devtools: false,
      defaultViewport: {
        width: 1366,
        height: 768,
      },
      headless: true,
    });
    const page = await browser.newPage();

    await page.goto(url, {
      waitUntil: 'networkidle2',
    });
    await page.bringToFront();

    const artworks = await retrieveHyperlinks(page, url);
    await download(page, artworks);

    await browser.close();
  } catch (err) {
    console.error(err);
  }
})();
