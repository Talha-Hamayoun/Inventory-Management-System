import 'dotenv/config'
import { defineConfig, env, PrismaConfig } from 'prisma/config';

type DatabaseKey = 'main';

const databaseConfigurations: { [key in DatabaseKey]: PrismaConfig } = {
    main: {
        schema: './prisma/main-db/schema.prisma',
        migrations: {
            path: './prisma/main-db/migrations',
        },
        datasource: {
            url: env('MAIN_DATABASE_URL'),
        }
    }
} as const

const currentDb = databaseConfigurations['main'];

export default defineConfig({
    schema: './prisma/main-db/schema.prisma',
    migrations: {
        path: './prisma/main-db/migrations',
    },
    datasource: {
        url: env('MAIN_DATABASE_URL'),
    }
});