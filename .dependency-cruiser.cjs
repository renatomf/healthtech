/**
 * Fronteiras da arquitetura (docs/ARQUITETURA.md, ADR-001).
 * Rodado por `pnpm depcruise` (parte de `pnpm verify` e do CI).
 */
/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
    {
      name: 'domain-sem-frameworks',
      comment: 'domain/ é regra pura: não importa fastify, drizzle nem driver do Postgres.',
      severity: 'error',
      from: { path: '^apps/api/src/modules/[^/]+/domain/' },
      to: { path: 'node_modules/(fastify|@fastify|drizzle-orm|pg|postgres)/' },
    },
    {
      name: 'domain-sem-camadas-externas',
      comment: 'domain/ não importa application/, infra/ nem http/.',
      severity: 'error',
      from: { path: '^apps/api/src/modules/[^/]+/domain/' },
      to: { path: '^apps/api/src/(modules/[^/]+/(application|infra|http)|db)/' },
    },
    {
      name: 'application-sem-http',
      comment: 'application/ não conhece a camada HTTP.',
      severity: 'error',
      from: { path: '^apps/api/src/modules/[^/]+/application/' },
      to: { path: '^apps/api/src/modules/[^/]+/http/' },
    },
    {
      name: 'sem-infra-de-outro-modulo',
      comment: 'Um módulo não importa o infra/ de outro módulo.',
      severity: 'error',
      from: { path: '^apps/api/src/modules/([^/]+)/' },
      to: {
        path: '^apps/api/src/modules/[^/]+/infra/',
        pathNot: '^apps/api/src/modules/$1/',
      },
    },
    {
      name: 'shared-independente',
      comment: 'packages/shared é usado por api e web, nunca o contrário.',
      severity: 'error',
      from: { path: '^packages/shared/' },
      to: { path: '^apps/' },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    exclude: { path: '(node_modules|dist|coverage)/' },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.base.json' },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default', 'types'],
    },
  },
};
