# Use the official Node.js image as the base image
FROM node

# Set the working directory inside the container
WORKDIR /app

# Copy the package.json file to the container's working directory
COPY package.json .

# Install all dependencies defined in package.json
RUN npm install

# Copy all project files from the host to the container
COPY . .

# Expose port 3000 to allow external access to the application
EXPOSE 3000

# Define the command to run the application when the container starts
CMD ["node", "app.js"]
