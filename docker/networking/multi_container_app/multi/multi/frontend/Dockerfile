# Use the official Node.js image as the base image
FROM node

# Set the working directory inside the container to /app
# All subsequent commands will be run from this directory
WORKDIR /app

# Copy only the package.json file to the container
# This helps optimize the build process by caching dependencies
COPY package.json .

# Install project dependencies
RUN npm install

# Copy the remaining application files into the container
COPY . .

# Expose port 3000 to allow access to the React development server
EXPOSE 3000

# Start the application using the npm start script
CMD ["npm", "start"]
