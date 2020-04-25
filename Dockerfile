FROM node:11-stretch

RUN apt-get update -y && apt-get install -y cmake libstdc++

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY src ./src

COPY tsconfig.json .
RUN [ "npm", "run", "compile"]

COPY entrypoint.sh .
ENTRYPOINT [ "/app/entrypoint.sh" ]
