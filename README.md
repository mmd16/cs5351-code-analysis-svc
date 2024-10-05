## Project setup

```bash
$ npm install
```

Create `.env` and copy following to root

```ini
# Oauth2
GITHUB_CLIENT_ID=xxxxx
GITHUB_CLIENT_SECRET=xxxxx
GOOGLE_CLIENT_ID=xxxxx
GOOGLE_CLIENT_SECRET=xxxxx

# JWT
JWT_SECRET=xxxxx
JWT_ACCESS_EXPIRATION=1h
JWT_REFRESH_EXPIRATION=7d

# For TypeORM
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=admin
DB_DATABASE=code-analysis

# For primas
DATABASE_URL=postgresql://postgres:admin@localhost:5432/code-analysis?schema=public

# TypeORM
TYPEORM_SYNCHRONIZE=true
TYPEORM_LOGGING=true
TYPEORM_MIGRATIONS=dist/migrations/*.js
TYPEORM_MIGRATIONS_DIR=src/migrations
```

## Primas command

```bash
npx prisma migrate dev --name init
```

```bash
npx prisma db push
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Format and lint

```bash
npm run format
```

```bash
npm run lint
```
