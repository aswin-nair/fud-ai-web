/**
 * Hand-written because drizzle-kit emits migrations.js without types. Kept in
 * step with the generated file's shape, which is stable across versions.
 */
declare const migrations: {
  journal: {
    entries: { idx: number; when: number; tag: string; breakpoints: boolean }[];
  };
  migrations: Record<string, string>;
};

export default migrations;
