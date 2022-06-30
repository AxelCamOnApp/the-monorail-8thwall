FROM node:12-alpine

WORKDIR /app
COPY . . 
RUN npm install -D http-server -g
WORKDIR /app/src

CMD ["http-server", ".",  "-C" ,"cert.pem", "-S" ,"--cors"]