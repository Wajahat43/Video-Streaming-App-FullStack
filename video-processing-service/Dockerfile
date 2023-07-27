#Building Stage
from node:18 as builder

#Set working directory inside the container's file system
workdir /app

#copying package.json and package-lock.json to the working directory
COPY package*.json ./

#installing dependencies
RUN npm install

#copying all the files from the current directory to the working directory
COPY . .

#building the app
RUN npm run build

#Production Stage
#Use node 18 as base image (parent image)
FROM node:18

#Set working directory inside the container's file system
workdir /app

#copying package.json and package-lock.json to the working directory
COPY package*.json ./

#installing dependencies
RUN npm install --only=production
#installing ffmpeg
RUN apt-get update && apt-get install -y ffmpeg

Copy --from=builder /app/dist ./dist


#exposing port 3000 (to make it accessible from outside the container)
EXPOSE 3000

#running the app (CMD is used only once when the container is created)
CMD ["npm", "run","serve"]



