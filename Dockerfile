# Use official Node.js runtime as base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Create storage directory for AI models
RUN mkdir -p storage/models

# Expose port
EXPOSE 4000

# Start the application
CMD ["npm", "run", "dev"]
