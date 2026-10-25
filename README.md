# Goodison Park

## ARCHIVED BUILD AVAILABLE HERE:
https://goodisonpark.pages.dev/

Please note! Streaming and download bandwidth, video playback performance, range of resolutions has been heavily reduced from live version to minimise hosting expense. It uses URLs that do not support such features as gzip.


## How to install
1.  Copy the repo
2. Run `npm install`
3. Run `npm run download:assets` to sync the public folder from Cloudflare R2 (this folder is huge, containing all videos and formats, therefore not realistic to keep in repo)

## Updating videos
1.  Run `npm run build:videos`
2. This will download the video for any entry in the Google Sheet that does not have a `filename` value
3. This will update the sheet with the filename once downloaded

## Deploying
1. Pushes to git main are automatically picked up by Cloudflare
2. `npm run deploy:assets` deploys static assets to Cloudflare
3. Assets are served from R2 assets.goodison.memorial domain