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

export const ALL_CATEGORY_IDS: readonly PackageCategoryDefinition['id'][] = PACKAGE_CATEGORIES.map(
  (category) => category.id,
);

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
  '(^|/)drizzle\\.config\\.[cm]?[jt]s$',
];
