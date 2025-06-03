FROM node:18

#Set working dir
WORKDIR /app

#Install
COPY package*.json ./
RUN npm install
COPY . .

# Expose port
EXPOSE 3000

#Start the service
CMD ["npm", "start"]
