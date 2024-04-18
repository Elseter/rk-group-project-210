# Use the official Node.js image as a base
FROM node:latest

# Set the working directory in the container
WORKDIR /app

# Copy the entire project directory into the container
COPY . .

# Install dependencies
RUN npm install

# Expose port 3000 to the outside world
EXPOSE 3000

# Start the Next.js development server when the container starts
CMD ["npm", "run", "dev"]