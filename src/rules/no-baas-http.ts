import { type TSESTree } from '@typescript-eslint/utils';
import { createRule } from '../utils/createRule';
import { DEFAULT_BAAS_HTTP_HOSTS } from '../utils/blocklist';

export interface Options {
  /** Extra hostnames to treat as BaaS/database HTTP APIs. */
  additionalHosts?: string[];
  /** Hostnames to allow even if they match the built-in list. */
  allowHosts?: string[];
}

type RuleOptions = [Options];
type MessageIds = 'blockedHost';

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function findBlockedHost(
  value: string,
  hosts: readonly string[],
): string | null {
  const lower = value.toLowerCase();
  for (const host of hosts) {
    const needle = host.toLowerCase();
    const pattern = new RegExp(
      `(?:^|[/.])${escapeRegExp(needle)}(?=[/?:#]|$)`,
      'i',
    );
    if (pattern.test(lower)) return host;
  }
  return null;
}

function templateLiteralValue(node: TSESTree.TemplateLiteral): string {
  return node.quasis
    .map((quasi) => quasi.value.cooked ?? quasi.value.raw)
    .join('');
}

export const noBaasHttp = createRule<RuleOptions, MessageIds>({
  name: 'no-baas-http',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow fetch/HTTP URLs that talk to a BaaS or database HTTP API (Supabase REST, Neon, Upstash, …) instead of the project API.',
    },
    messages: {
      blockedHost:
        "This URL talks to '{{host}}', a database/BaaS HTTP API. Call the project's existing HTTP APIs instead of going around them.",
    },
    schema: [
      {
        type: 'object',
        properties: {
          additionalHosts: {
            type: 'array',
            items: { type: 'string' },
            uniqueItems: true,
          },
          allowHosts: {
            type: 'array',
            items: { type: 'string' },
            uniqueItems: true,
          },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{}],
  create(context, [options]) {
    const allow = new Set(
      (options.allowHosts ?? []).map((host) => host.toLowerCase()),
    );
    const hosts = DEFAULT_BAAS_HTTP_HOSTS.concat(
      options.additionalHosts ?? [],
    ).filter((host) => !allow.has(host.toLowerCase()));

    function check(node: TSESTree.Node, value: string): void {
      const host = findBlockedHost(value, hosts);
      if (host)
        context.report({ node, messageId: 'blockedHost', data: { host } });
    }

    return {
      Literal(node) {
        if (typeof node.value === 'string') check(node, node.value);
      },
      TemplateLiteral(node) {
        check(node, templateLiteralValue(node));
      },
    };
  },
});
