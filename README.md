# ezcomfypick

A mobile-first webui for easily sorting ComfyUI generated content (imgs/gifs + vids) with a Tinder-style swipe interface.

![preview1](./output1.gif)
![preview2](./output2.gif)

## Overview

`ezcomfypick` is webui intended to be ran next to ComfyUI on your homelab.

Spin up docker having it point to your ComfyUI folder and it will look at your output folder (subfolder accounted for too) and will make in ComfyUI folder `good-output` and `trash-out`.

Instead of manually browsing folders, simply swipe right to keep images in a collection or left to move them to trash.

I made this so i can easily filter out the trash generations from the comfort of phone so i dont have sit at my PC, opening image, move to different folder or delete.

The app at its core is moving or deleting files with `pathlib`

## Install/setup

i have my ComfyUI in `/home/myhomelab/ComfyUI` so should be output folder there `/home/myhomelab/ComfyUI/output` as `ezcomfypick` will find folder called `output`.
also have docker installed

```bash
docker run -d -p 1234:8000 -v /home/myhomelab/ComfyUI:/images willmarl/ezcomfypick:latest
```

Open a browser on another device and go to http://<your-pc-ip>:1234/ (replace <your-pc-ip> with your computer's local IP address, e.g., 192.168.1.100)

## How it works

- **Swipe right** → image moves to `good-output/` (or a subcollection folder)
- **Swipe left** → image moves to `trash-output/`
- **Undo** → reverts only your last swipe (moves file back to original location)
- **Collections** → created automatically as folders in `good-output/`, each with their own emoji label

## Features

- collections are detected by folders in `good-output` folder. Not coupled to database.
  - though ezcomfypick does generates a `.metadata.json` in `good-output` folder just to keep track of emoji used to label folder
- tags (this is coupled to database)
- gallery view able to filter by collection and/or tags
- undo button for only last swipe you've done
- clear trash (since trashed swipes just move to trash output. ⚠️ will permanently delete all files in `trash-output`)

## Tech stack

- (Backend) Fastapi
  - sqllite DB
- (Frontend) Vite + react
