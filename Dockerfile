# Import Image For Building
FROM node:latest

# Set Work Directory Project
WORKDIR /app

# Copy Source Code 
COPY . .

# Installing Dependencies
RUN npm install

# Setting Environtment
ENV DB_HOST=
ENV DB_NAME=
ENV DB_USERNAME=
ENV DB_PASSWORD=
ENV PORT=3000
ENV SALT=10
ENV JWT_SECRET=cleanearth
ENV JWT_ACCESS_TOKEN_EXPIRED=1h

# Running Project
CMD npm run production