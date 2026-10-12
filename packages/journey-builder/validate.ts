import { JourneyDefinitionSchema, type JourneyDefinition } from './schema';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateGraph(def: unknown): ValidationResult {
  const errors: string[] = [];

  const parsed = JourneyDefinitionSchema.safeParse(def);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      errors.push(`${issue.path.join('.')}: ${issue.message}`);
    }
    return { valid: false, errors };
  }
  const graph = parsed.data;

  const triggers = graph.nodes.filter((n) => n.type === 'TRIGGER');
  if (triggers.length !== 1) {
    errors.push(`Expected exactly 1 TRIGGER node, found ${triggers.length}`);
  }

  const ends = graph.nodes.filter((n) => n.type === 'END');
  if (ends.length === 0) {
    errors.push('At least one END node required');
  }

  const nodeIds = new Set(graph.nodes.map((n) => n.id));
  for (const edge of graph.edges) {
    if (!nodeIds.has(edge.from)) errors.push(`Edge ${edge.id} from unknown node ${edge.from}`);
    if (!nodeIds.has(edge.to)) errors.push(`Edge ${edge.id} to unknown node ${edge.to}`);
  }

  for (const node of graph.nodes) {
    const outgoing = graph.edges.filter((e) => e.from === node.id);
    if (node.type === 'END') {
      if (outgoing.length > 0) errors.push(`END node ${node.id} must have no outgoing edges`);
      continue;
    }
    if (outgoing.length === 0) {
      errors.push(`Node ${node.id} (${node.type}) has no outgoing edges`);
    }
    if (node.type === 'SPLIT' && outgoing.length < 2) {
      errors.push(`SPLIT node ${node.id} must have exactly 2 outgoing edges`);
    }
  }

  const reached = new Set<string>();
  if (triggers.length === 1) {
    const stack = [triggers[0].id];
    while (stack.length) {
      const cur = stack.pop()!;
      if (reached.has(cur)) continue;
      reached.add(cur);
      for (const e of graph.edges.filter((e) => e.from === cur)) {
        stack.push(e.to);
      }
    }
  }

  for (const node of graph.nodes) {
    if (!reached.has(node.id)) {
      errors.push(`Node ${node.id} is not reachable from the trigger`);
    }
  }

  return { valid: errors.length === 0, errors };
}

export function assertGraphValid(def: unknown): JourneyDefinition {
  const r = validateGraph(def);
  if (!r.valid) {
    throw new Error(`invalid_journey_graph:\n${r.errors.join('\n')}`);
  }
  return JourneyDefinitionSchema.parse(def);
}
