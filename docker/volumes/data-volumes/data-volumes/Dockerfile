# Use the official Node.js version 14 as the base image
FROM node:14

# Set the working directory inside the container
WORKDIR /app

# Copy the package.json file to the working directory
COPY package.json .

# Install the project's dependencies based on package.json
RUN npm install

# Copy all files from the current host directory to the container
COPY . .

# Define an optional environment variable for the application's port
ARG DEFAULT_PORT=80

# Set the PORT environment variable inside the container
ENV PORT $DEFAULT_PORT

# Expose the specified port to allow external connections
EXPOSE $PORT

# Commented out: Creates a volume for `/app/node_modules` 
# (Prevents this folder from being overwritten by a bind mount)
# VOLUME [ "/app/node_modules" ]

# Default command that runs when the container starts
CMD [ "npm", "start" ]