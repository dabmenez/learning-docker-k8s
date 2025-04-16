# Use the official Node.js base image from Docker Hub
FROM node

# Set the working directory inside the container to /app
WORKDIR /app

# Copy the package.json file to the container
# This helps install only the declared dependencies first
COPY package.json .

# Install all dependencies defined in package.json
RUN npm install

# Copy all other source code files into the container
COPY . .

# Expose port 80 on the container (used by the Node app to listen for requests)
EXPOSE 80

# Set environment variables for the MongoDB username and password
# These will be used inside the application code to connect to the database
ENV MONGODB_USERNAME=root
ENV MONGODB_PASSWORD=secret

# Define the default command to run when the container starts
CMD ["npm", "start"]