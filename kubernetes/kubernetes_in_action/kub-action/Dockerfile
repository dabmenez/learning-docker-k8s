# ───────────────────────────────────────────────────────────────
# DOCKERFILE: Image for Node.js App
# ───────────────────────────────────────────────────────────────

# Base image: Node.js 14 on Alpine Linux (lightweight and fast)
FROM node:14-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy only package.json first (cache optimization)
# If package.json hasn't changed, no need to reinstall dependencies
COPY package.json .

# Install dependencies (express, body-parser)
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the port the application will use
EXPOSE 8080

# Command executed when the container starts
# IMPORTANT: This command keeps the container running
# If the application crashes, the container stops and Kubernetes restarts it
CMD [ "node", "app.js" ]