# API Clean Earth

API Clean Earth adalah sebuah proyek untuk mengelola data terkait lingkungan dan keberlanjutan. Proyek ini menyediakan RESTful API untuk akses dan manipulasi data terkait kebersihan lingkungan.

## Persyaratan

Sebelum Anda dapat menggunakan API Clean Earth, pastikan bahwa Anda telah memenuhi persyaratan berikut:

- [Docker](https://www.docker.com/get-started)
- [Docker Compose](https://docs.docker.com/compose/)
- [Node Js](https://nodejs.org/en)

## Cara Menjalankan Project Saat Development

1. Clone repositori ini ke dalam sistem Anda:

   ```
   git clone https://github.com/haikalrfadhilahh/api-clean-earth.git
   cd api-clean-earth
   ```

2. Edit Data Pada .env lalu jalankan beberapa perintah tersebut :

   ```
   npm install
   npx prisma migrate deploy
   ```

3. Cara menjalankan project ini:

   ```
   npm install
   ```

## Cara Menjalankan Project Saat Production

1. Clone repositori ini ke dalam sistem Anda:

   ```
   git clone https://github.com/haikalrfadhilahh/api-clean-earth.git
   cd api-clean-earth
   ```

2. Lengkapi .env sebelum build docker images :

   ```
   DATABASE_URL="mysql://username:password@hostname:3306/databasename"
   PORT=
   SALT=
   JWT_SECRET=
   JWT_ACCESS_TOKEN_EXPIRED=
   ```

3. Build project menjadi docker images :

   ```
   docker build -t apicleanearth:latest .
   ```

4. Jalankan docker images menggunakan docker container:

   ```
   docker run --name apicleanearth -p 127.0.0.1:6000:3000 --restart on-failure apicleanearth
   ```

5. Reverse proxy docker container dengan web server (Nginx / Apache)

## Kontribusi

Jika Anda ingin berkontribusi pada proyek ini, silakan buat _fork_ dari repositori ini dan kirim _pull request_.

## Lisensi

Proyek ini dilisensikan di bawah lisensi MIT - lihat file [LICENSE](LICENSE) untuk detail lebih lanjut.
