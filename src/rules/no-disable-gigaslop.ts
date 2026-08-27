import { createRule } from '../utils/createRule';

export interface Options {
  /**
   * Also flag `eslint-disable` / `eslint-disable-next-line` / `eslint-disable-line`
   * with no rule list (those turn off every rule, including this plugin).
   * Default false — too noisy for generated files.
   */
  banUnqualifiedDisable?: boolean;
}

type RuleOptions = [Options];
type MessageIds = 'disabledPlugin' | 'unqualifiedDisable';

const DISABLE_COMMENT =
  /^\s*eslint-(disable(?:-next-line|-line)?)(?:\s+(.+))?$/u;

function ruleList(rest: string | undefined): string[] {
  if (!rest) return [];
  const withoutReason = rest.split(/\s--\s/, 1)[0] ?? rest;
  return withoutReason
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

function mentionsGigaslop(rules: string[]): boolean {
  return rules.some(
    (rule) => rule === 'gigaslop' || rule.startsWith('gigaslop/'),
  );
}

export const noDisableGigaslop = createRule<RuleOptions, MessageIds>({
  name: 'no-disable-gigaslop',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow eslint-disable comments that turn off gigaslop rules — agents must not disable this plugin to add a database or second backend.',
    },
    messages: {
      disabledPlugin:
        'Do not disable gigaslop rules ({{preview}}). If this app is allowed to own a database or HTTP server, change the plugin config instead of silencing the rule.',
      unqualifiedDisable:
        "An unqualified '{{kind}}' turns off gigaslop along with every other rule. Name the specific non-gigaslop rules you need to disable.",
    },
    schema: [
      {
        type: 'object',
        properties: {
          banUnqualifiedDisable: { type: 'boolean' },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{}],
  create(context, [options]) {
    const banUnqualifiedDisable = options.banUnqualifiedDisable === true;

    return {
      Program() {
        const sourceCode = context.sourceCode ?? context.getSourceCode();
        for (const comment of sourceCode.getAllComments()) {
          const text = comment.value;
          const match = DISABLE_COMMENT.exec(text);
          if (!match) continue;

          const kind = match[1] ?? 'disable';
          const rules = ruleList(match[2]);

          if (rules.length === 0) {
            if (banUnqualifiedDisable && comment.loc) {
              context.report({
                loc: comment.loc,
                messageId: 'unqualifiedDisable',
                data: { kind },
              });
            }
            continue;
          }

          if (mentionsGigaslop(rules) && comment.loc) {
            context.report({
              loc: comment.loc,
              messageId: 'disabledPlugin',
              data: {
                preview: rules
                  .filter((rule) => rule.startsWith('gigaslop'))
                  .join(', '),
              },
            });
          }
        }
      },
    };
  },
});
