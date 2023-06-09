# Specifies the image of your engine
FROM node:latest

# The working directory inside your container
WORKDIR /app

# Get the package.json first to install dependencies
COPY package.json /app

# This will install those dependencies
RUN npm install

# Install nodemon dependencies
RUN npm install nodemon --save-dev

# Copy the rest of the app to the working directory
COPY . /app

# Run the container
CMD ["npm", "run", "start-app"]
