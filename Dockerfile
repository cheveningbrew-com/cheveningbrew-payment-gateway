# Use the official Node.js image
FROM node:16

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to the container
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all the files into the container
COPY . .

# Expose the port that the app will run on
EXPOSE 4001

# Start the application
CMD ["npm", "start"]
