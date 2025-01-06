FROM node:16-alpine

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all source files
COPY . .

# Install http-server
RUN npm install -g http-server

EXPOSE 3000

# Serve the current directory and listen on all interfaces
CMD ["http-server", "--cors", "-p", "3000", "--host", "0.0.0.0", "."]
