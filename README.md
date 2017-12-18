kitten-as-a-service
===================

> Web service written in NodeJS that displays a kitten image randomly picked from Bing Images.

[![Build Status](https://img.shields.io/travis/amercier/kitten-as-a-service/master.svg)](https://travis-ci.org/amercier/kitten-as-a-service)
[![Dependency Status](http://img.shields.io/gemnasium/amercier/kitten-as-a-service.svg)](https://gemnasium.com/amercier/kitten-as-a-service)
[![Test Coverage](https://img.shields.io/codecov/c/github/amercier/kitten-as-a-service/master.svg)](https://codecov.io/github/amercier/kitten-as-a-service?branch=master)
[![Code Climate](https://img.shields.io/codeclimate/maintainability/amercier/kitten-as-a-service.svg)](https://codeclimate.com/github/amercier/kitten-as-a-service)
[![Greenkeeper](https://badges.greenkeeper.io/amercier/kitten-as-a-service.svg)](https://github.com/amercier/kitten-as-a-service/issues?q=label%3Agreenkeeper)

<sup><sub>_Created with [npm-p&#97;ckage-skeleton](https://github.com/&#97;mercier/npm-p&#97;ckage-skeleton)._</sup></sub>

The web service exposes mainly two URLs:
- `/`: a web page, written in HTML/CSS/JS
- `/kitten-{size}.jpg`: the endpoint for the random image, which can be used programatically, where `{size}` is one of the following:
    - `small`: 480p or more, 30kB to 100kB
    - `medium`: 720p or more, 50kB to 300kB
    - `large`: 1080p or more, 100kb to 500kB
    - `huge`: 2160p or more, 500kB to 5MB

Demo
----

- Web: visit http://kitten.amercier.com/
- Download a random kitten image programatically:
```bash
curl --progress-bar -L http://kitten.amercier.com/kitten-huge.jpg -o kitten-huge.jpg
```

Requirements
------------

- You need an **API key for** the [Bing Images Search API](https://azure.microsoft.com/en-us/services/cognitive-services/bing-image-search-api/).
- The following software:
  - [NodeJS](https://nodejs.org/en/) >= 8.9 ([NVM](https://github.com/creationix/nvm) recommended)
  - [Yarn](https://yarnpkg.com/en/)

MacOS install instructions using Homebrew:
```bash
brew install nvm
nvm install node
npm install -g yarn
```


Local setup
-----------

1. Clone this repository
```bash
git clone https://github.com/amercier/kitten-as-a-service.git
cd kitten-as-a-service
```
2. Install dependencies
```bash
yarn install
```
3. Start server
```bash
export MICROSOFT_AZURE_API_KEY=********* yarn start
```
4. Visit http://localhost:3000/


Deployment
----------

Deploy on a NodeJS server (ex: Heroku), with the following environment variables:
- `NODE_ENV` set to `production`
- `MICROSOFT_AZURE_API_KEY` set to your [Bing Images Search API](https://azure.microsoft.com/en-us/services/cognitive-services/bing-image-search-api/) key

Also, you can set `DEBUG` to `true` to display more verbose logging.


License
-------

This project is released under [ISC License](LICENSE.md).
All Microsoft, Bing, Azure brands are property of their respective owners.
All pictures are property of their respective owners.
