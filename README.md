# Goodison Park

## How to install
1.  Copy the repo
2. Run `npm install`
3. Run `npm run download:assets` to sync the public folder from Cloudflare R2 (this folder is huge, containing all videos and formats, therefore not realistic to keep in repo)

## Updating videos
1.  Run `npm run build:videos`
2. This will download the video for any entry in the Google Sheet that does not have a `filename` value
3. This will update the sheet with the filename once downloaded