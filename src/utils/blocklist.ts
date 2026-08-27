export interface PackageCategoryDefinition {
  id: 'drivers' | 'orms' | 'serverless' | 'baas';
  label: string;
  packages: readonly string[];
}

export const PACKAGE_CATEGORIES: readonly PackageCategoryDefinition[] = [
  {
    id: 'drivers',
    label: 'database driver',
    packages: [
      'pg',
      'postgres',
      'pg-promise',
      'slonik',
      'mysql',
      'mysql2',
      'mariadb',
      'mongodb',
      'mongoose',
      'better-sqlite3',
      'sqlite3',
      'sqlite',
      'sql.js',
      'mssql',
      'tedious',
      'oracledb',
      'redis',
      'ioredis',
      'cassandra-driver',
      'neo4j-driver',
      '@clickhouse/client',
      'edgedb',
      'gel',
    ],
  },
  {
    id: 'orms',
    label: 'ORM / query builder',
    packages: [
      'prisma',
      '@prisma/client',
      '@prisma/adapter-*',
      'drizzle-orm',
      'drizzle-kit',
      'kysely',
      'typeorm',
      'sequelize',
      'knex',
      'mikro-orm',
      '@mikro-orm/*',
      'objection',
      'sequelize-typescript',
    ],
  },
  {
    id: 'serverless',
    label: 'serverless/edge database client',
    packages: [
      '@neondatabase/serverless',
      '@vercel/postgres',
      '@vercel/kv',
      '@planetscale/database',
      '@libsql/client',
      '@upstash/redis',
      '@upstash/vector',
      '@tidbcloud/serverless',
      '@xata.io/client',
      '@electric-sql/pglite',
    ],
  },
  {
    id: 'baas',
    label: 'BaaS SDK (direct database access, not the project API)',
    packages: [
      '@supabase/supabase-js',
      '@supabase/ssr',
      'firebase/firestore',
      'firebase/database',
      'firebase/compat/firestore',
      'firebase/compat/database',
      '@firebase/firestore',
      '@firebase/database',
      'firebase-admin/firestore',
      'firebase-admin/database',
      'pocketbase',
      '@google-cloud/firestore',
      '@google-cloud/bigquery',
      '@google-cloud/bigtable',
      '@google-cloud/spanner',
      '@google-cloud/sql',
      'convex',
      '@aws-sdk/client-dynamodb',
      '@aws-sdk/lib-dynamodb',
      '@aws-sdk/client-rds-data',
    ],
  },
];

export const ALL_CATEGORY_IDS: readonly PackageCategoryDefinition['id'][] =
  PACKAGE_CATEGORIES.map((category) => category.id);

/** Exact env var names called out by the spec. */
export const DEFAULT_BLOCKED_ENV_VARS: readonly string[] = [
  'DATABASE_URL',
  'POSTGRES_URL',
  'MONGODB_URI',
  'REDIS_URL',
  'PGHOST',
  'PGHOSTADDR',
  'PGPORT',
  'PGDATABASE',
  'PGUSER',
  'PGPASSWORD',
  'PGURI',
  'PGURL',
];

/**
 * Fallback pattern catching common variants agents reach for that aren't
 * literally one of the exact names above (e.g. Vercel's POSTGRES_PRISMA_URL,
 * POSTGRES_URL_NON_POOLING, MYSQL_URL, MONGO_URL, ...).
 */
export const DEFAULT_ENV_VAR_PATTERN =
  '^(DATABASE|POSTGRES?|MYSQL|MARIADB|MONGO(DB)?|REDIS|MSSQL|SQLITE|ORACLE|CASSANDRA)(_[A-Z0-9]+)*_(URL|URI|CONN(ECTION)?(_STRING)?)$';

/** Connection-string URI schemes worth flagging even as bare string literals. */
export const DEFAULT_CONNECTION_STRING_PATTERN =
  '^(postgres(ql)?|mysql|mariadb|mongodb(\\+srv)?|redis|rediss|mssql|oracle):\\/\\/';

export const DEFAULT_CONFIG_FILE_PATTERNS: readonly string[] = [
  '(^|/)prisma/schema\\.prisma$',
  '\\.prisma$',
  '(^|/)prisma/migrations(/|$)',
  '(^|/)drizzle\\.config\\.[cm]?[jt]s$',
  '\\.sqlite3?$',
  '(^|/)docker-compose(\\.[\\w.-]+)?\\.ya?ml$',
  '(^|/)compose\\.ya?ml$',
];

/** Hostnames of BaaS/database HTTP APIs — fetch() here bypasses the SDK blocklist. */
export const DEFAULT_BAAS_HTTP_HOSTS: readonly string[] = [
  'supabase.co',
  'supabase.in',
  'neon.tech',
  'psdb.cloud',
  'planetscale.com',
  'upstash.io',
  'firebaseio.com',
  'firestore.googleapis.com',
  'convex.cloud',
  'turso.io',
  'tursodatabase.com',
  'xata.sh',
  'xata.io',
  'tidbcloud.com',
  'mongodb.net',
  'rds.amazonaws.com',
];

export interface ServerCategoryDefinition {
  id: 'http' | 'graphql';
  label: string;
  packages: readonly string[];
}

export const SERVER_CATEGORIES: readonly ServerCategoryDefinition[] = [
  {
    id: 'http',
    label: 'HTTP server framework',
    packages: [
      'express',
      'fastify',
      'hono',
      'koa',
      '@nestjs/core',
      '@nestjs/platform-express',
      '@nestjs/platform-fastify',
      'elysia',
      'restify',
      'polka',
      'micro',
      '@hapi/hapi',
      'connect',
    ],
  },
  {
    id: 'graphql',
    label: 'GraphQL server',
    packages: [
      '@apollo/server',
      'apollo-server',
      'apollo-server-express',
      'apollo-server-fastify',
      'graphql-yoga',
      '@graphql-yoga/node',
      'mercurius',
      'nexus',
      'type-graphql',
    ],
  },
];

export const ALL_SERVER_CATEGORY_IDS: readonly ServerCategoryDefinition['id'][] =
  SERVER_CATEGORIES.map((category) => category.id);

/**
 * Conservative SQL shape: SELECT … FROM, INSERT INTO, UPDATE … SET, etc.
 * Avoids flagging English "select a winner" / "update the UI", and Tailwind
 * `truncate …` class lists (TRUNCATE requires the TABLE keyword).
 */
export const DEFAULT_SQL_PATTERN =
  '^\\s*(?:WITH\\s+[\\s\\S]+?\\s+)?(?:SELECT\\s+[\\s\\S]+?\\s+FROM|INSERT\\s+INTO|UPDATE\\s+\\S+\\s+SET|DELETE\\s+FROM|CREATE\\s+(?:TABLE|INDEX|DATABASE|SCHEMA)|ALTER\\s+TABLE|DROP\\s+(?:TABLE|INDEX|DATABASE)|TRUNCATE\\s+TABLE(?![\\w-])|EXPLAIN\\s+SELECT)';

/**
 * Embedded / file-backed stores agents reach for when pg/prisma are blocked.
 * SQLite drivers stay on `no-database-packages`; this list is JSON/Level/NeDB/etc.
 */
export const FS_DATASTORE_PACKAGES: readonly string[] = [
  'lowdb',
  'steno',
  'level',
  'leveldown',
  'levelup',
  'classic-level',
  'abstract-level',
  'encoding-down',
  'memdown',
  'memory-level',
  'browser-level',
  'rocksdb',
  'rocks-level',
  'nedb',
  '@seald-io/nedb',
  'lokijs',
  'json-server',
  'node-json-db',
  'simple-json-db',
  'flat-file-db',
  'node-persist',
  '@keyv/file',
  'pouchdb',
  'pouchdb-node',
  'pouchdb-adapter-leveldb',
];

/**
 * Filenames that *are* a file-backed store. SQLite (`*.sqlite`) stays on
 * `no-database-config-files` so recommended does not double-report.
 */
export const DEFAULT_FS_DATASTORE_FILE_PATTERNS: readonly string[] = [
  '\\.db$',
  '\\.ldb$',
  '\\.leveldb$',
  '(^|/)(data|db|database|store|datastore)/.+\\.(json|db)$',
  '(^|/)(db|database|datastore|store)\\.json$',
];

/** Extra write-path shapes (sqlite files are already a sidecar for the config-file rule). */
export const DEFAULT_FS_DATASTORE_WRITE_EXTRA_PATTERNS: readonly string[] = [
  '\\.sqlite3?$',
];
