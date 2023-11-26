FROM node:latest
WORKDIR /app
COPY . .
RUN npm install
RUN npx prisma migrate deploy
EXPOSE 3000
CMD npm run production