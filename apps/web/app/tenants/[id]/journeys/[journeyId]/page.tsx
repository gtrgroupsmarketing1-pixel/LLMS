'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  MiniMap,
  type Connection,
  type Edge,
  type Node,
  type NodeChange,
  type EdgeChange,
  applyNodeChanges,
  applyEdgeChanges,
} from 'reactflow';
import 'reactflow/dist/style.css';
import {
  Badge,
  Button,
  Card,
  CardBody,
  Input,
  Label,
  Select,
  Skeleton,
} from '@lmms/ui';
import { authedFetch } from '../../../../../lib/session';
import { NODE_META, TRIGGER_TYPES, WAIT_UNITS } from '../../../../../lib/journey/nodes';

interface JourneyResponse {
  id: string;
  name: string;
  nameAr: string | null;
  status: string;
  priority: number;
  frequencyCapHours: number;
  definition: {
    nodes: Array<{
      id: string;
      type: string;
      label?: string;
      x: number;
      y: number;
      trigger?: { type: string; value?: number; mode?: string };
      wait?: { amount: number; unit: string };
      condition?: { logic: string; rules: unknown[] };
      send?: { templateGroupId: string; channel: string };
      split?: { aWeight: number; bWeight: number };
    }>;
    edges: Array<{ id: string; from: string; to: string; branch?: string }>;
    exitRules?: Array<{ type: string }>;
  };
  killed: boolean;
}

type SelectedNode = JourneyResponse['definition']['nodes'][number] | null;

export default function JourneyEditorPage() {
  const params = useParams<{ id: string; journeyId: string }>();
  const [journey, setJourney] = useState<JourneyResponse | null>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selected, setSelected] = useState<SelectedNode>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [validation, setValidation] = useState<{ valid: boolean; errors: string[] } | null>(null);
  const [simulateResult, setSimulateResult] = useState<string | null>(null);

  useEffect(() => {
    authedFetch(`/api/journeys/tenants/${params.id}/journeys/${params.journeyId}`)
      .then(async (r) => {
        if (!r.ok) {
          setError(`Failed: ${r.status}`);
          return;
        }
        const j = (await r.json()) as JourneyResponse;
        setJourney(j);
        setNodes(
          j.definition.nodes.map((n) => ({
            id: n.id,
            type: 'default',
            position: { x: n.x, y: n.y },
            data: { label: renderLabel(n), raw: n },
            style: nodeStyle(n.type),
          })),
        );
        setEdges(
          j.definition.edges.map((e) => ({
            id: e.id,
            source: e.from,
            target: e.to,
            label: e.branch,
          })),
        );
      })
      .catch(() => setError('Network error'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id, params.journeyId]);

  function renderLabel(n: JourneyResponse['definition']['nodes'][number]): string {
    const meta = NODE_META[n.type];
    if (n.type === 'TRIGGER' && n.trigger) return `${meta.label}: ${n.trigger.type}`;
    if (n.type === 'WAIT' && n.wait) return `${meta.label}: ${n.wait.amount} ${n.wait.unit}`;
    if (n.type === 'CONDITION') return `${meta.label}: ${n.condition?.logic ?? 'AND'}`;
    if (n.type === 'SEND') return `${meta.label}: ${n.send?.channel ?? 'WHATSAPP'}`;
    if (n.type === 'SPLIT' && n.split) return `${meta.label}: ${n.split.aWeight}/${n.split.bWeight}`;
    return meta.label;
  }

  function nodeStyle(type: string) {
    const meta = NODE_META[type];
    return {
      background: meta?.bg,
      border: `1px solid ${meta?.border}`,
      color: meta?.color,
      borderRadius: 8,
      padding: 8,
      fontSize: 12,
      width: 180,
      fontWeight: 600,
    } as React.CSSProperties;
  }

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [],
  );
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [],
  );
  const onConnect = useCallback(
    (connection: Connection) =>
      setEdges((eds) =>
        addEdge({ ...connection, id: `e-${Date.now()}` }, eds),
      ),
    [],
  );

  const definition = useMemo(() => {
    if (!journey) return null;
    return {
      nodes: nodes.map((n) => {
        const raw = (n.data.raw ?? {}) as SelectedNode;
        return {
          id: n.id,
          type: raw?.type ?? 'END',
          label: raw?.label,
          x: Math.round(n.position.x),
          y: Math.round(n.position.y),
          trigger: raw?.trigger,
          wait: raw?.wait,
          condition: raw?.condition,
          send: raw?.send,
          split: raw?.split,
        };
      }),
      edges: edges.map((e) => ({
        id: e.id,
        from: e.source,
        to: e.target,
        branch: typeof e.label === 'string' ? e.label : undefined,
      })),
      exitRules: journey.definition.exitRules ?? [],
    };
  }, [journey, nodes, edges]);

  function addNode(type: keyof typeof NODE_META) {
    const id = `${type.toLowerCase()}-${Date.now()}`;
    const raw: SelectedNode = {
      id,
      type,
      x: 200,
      y: 200,
      ...(type === 'TRIGGER'
        ? { trigger: { type: 'NEW_CUSTOMER', mode: 'EVENT' } }
        : {}),
      ...(type === 'WAIT' ? { wait: { amount: 1, unit: 'DAYS' } } : {}),
      ...(type === 'CONDITION' ? { condition: { logic: 'AND', rules: [] } } : {}),
      ...(type === 'SEND'
        ? { send: { templateGroupId: '', channel: 'WHATSAPP' } }
        : {}),
      ...(type === 'SPLIT' ? { split: { aWeight: 50, bWeight: 50 } } : {}),
    };
    setNodes((nds) => [
      ...nds,
      {
        id,
        type: 'default',
        position: { x: raw!.x, y: raw!.y },
        data: { label: renderLabel(raw!), raw },
        style: nodeStyle(type),
      },
    ]);
  }

  async function validate() {
    if (!definition) return;
    const r = await authedFetch(
      `/api/journeys/tenants/${params.id}/journeys/validate`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ definition }),
      },
    );
    const data = (await r.json()) as { valid: boolean; errors: string[] };
    setValidation(data);
  }

  async function save() {
    if (!definition) return;
    setBusy(true);
    setMsg(null);
    try {
      const r = await authedFetch(
        `/api/journeys/tenants/${params.id}/journeys/${params.journeyId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ definition }),
        },
      );
      if (!r.ok) {
        setMsg(`Save failed: ${r.status}`);
        return;
      }
      setMsg('Saved');
    } finally {
      setBusy(false);
    }
  }

  async function publish() {
    setBusy(true);
    setMsg(null);
    try {
      await save();
      const r = await authedFetch(
        `/api/journeys/tenants/${params.id}/journeys/${params.journeyId}/publish`,
        { method: 'POST' },
      );
      if (r.ok) setMsg('Published');
      else setMsg(`Publish failed: ${r.status}`);
    } finally {
      setBusy(false);
    }
  }

  async function kill() {
    await authedFetch(
      `/api/journeys/tenants/${params.id}/journeys/${params.journeyId}/kill`,
      { method: 'POST' },
    );
    setMsg('Killed');
  }

  async function revive() {
    await authedFetch(
      `/api/journeys/tenants/${params.id}/journeys/${params.journeyId}/revive`,
      { method: 'POST' },
    );
    setMsg('Revived');
  }

  async function simulate() {
    if (!definition) return;
    const r = await authedFetch(
      `/api/journeys/tenants/${params.id}/journeys/simulate`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ definition }),
      },
    );
    if (!r.ok) {
      setSimulateResult(`Failed: ${r.status}`);
      return;
    }
    const data = (await r.json()) as { wouldEnter: number; wouldSendTo: number };
    setSimulateResult(
      `Would enter: ${data.wouldEnter} · Would send: ${data.wouldSendTo}`,
    );
  }

  function updateSelected(patch: Partial<NonNullable<SelectedNode>>) {
    if (!selected) return;
    const updated = { ...selected, ...patch } as SelectedNode;
    setSelected(updated);
    setNodes((nds) =>
      nds.map((n) =>
        n.id === selected.id
          ? {
              ...n,
              data: { ...n.data, raw: updated, label: renderLabel(updated!) },
            }
          : n,
      ),
    );
  }

  if (error) {
    return (
      <main className="p-8 max-w-6xl mx-auto">
        <p className="text-red-600">{error}</p>
      </main>
    );
  }

  if (!journey) {
    return (
      <main className="p-8 max-w-6xl mx-auto space-y-3">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </main>
    );
  }

  return (
    <main className="p-4 max-w-full space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <Link
            href={`/tenants/${params.id}/journeys`}
            className="text-sm text-slate-500 hover:text-slate-900"
          >
            ← Journeys
          </Link>
          <h1 className="text-2xl font-bold mt-1">{journey.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge
              variant={
                journey.status === 'ACTIVE'
                  ? 'success'
                  : journey.status === 'PAUSED'
                    ? 'warning'
                    : 'default'
              }
            >
              {journey.status}
            </Badge>
            {journey.killed && <Badge variant="danger">Killed</Badge>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={validate}>
            Validate
          </Button>
          <Button variant="outline" size="sm" onClick={simulate}>
            Simulate
          </Button>
          <Button variant="outline" size="sm" onClick={save} disabled={busy}>
            Save draft
          </Button>
          <Button size="sm" onClick={publish} disabled={busy}>
            Publish
          </Button>
          {journey.killed ? (
            <Button variant="secondary" size="sm" onClick={revive}>
              Revive
            </Button>
          ) : (
            <Button variant="danger" size="sm" onClick={kill}>
              Kill switch
            </Button>
          )}
        </div>
      </header>

      {msg && <p className="text-sm text-slate-700">{msg}</p>}
      {simulateResult && (
        <p className="text-sm text-blue-700">{simulateResult}</p>
      )}
      {validation && (
        <Card className={validation.valid ? 'bg-emerald-50' : 'bg-red-50'}>
          <CardBody className="text-sm">
            {validation.valid ? (
              <p className="text-emerald-800">✓ Graph is valid</p>
            ) : (
              <ul className="list-disc list-inside text-red-800">
                {validation.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      )}

      <div className="grid grid-cols-12 gap-4">
        <Card className="col-span-2">
          <CardBody className="space-y-2">
            <p className="text-sm font-semibold">Add node</p>
            {Object.entries(NODE_META).map(([key, meta]) => (
              <button
                key={key}
                onClick={() => addNode(key)}
                className="w-full rounded border border-slate-200 px-2 py-1 text-left text-xs hover:bg-slate-50"
                style={{ borderColor: meta.border }}
              >
                <span style={{ color: meta.color }}>●</span> {meta.label}
              </button>
            ))}
          </CardBody>
        </Card>

        <Card className="col-span-7 overflow-hidden" style={{ height: 600 }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={(_e, node) => {
              const raw = (node.data.raw ?? null) as SelectedNode;
              setSelected(raw);
            }}
            fitView
          >
            <Background />
            <Controls />
            <MiniMap />
          </ReactFlow>
        </Card>

        <Card className="col-span-3">
          <CardBody className="space-y-3">
            <p className="text-sm font-semibold">Inspector</p>
            {!selected && (
              <p className="text-xs text-slate-500">
                Click a node to inspect and edit its config.
              </p>
            )}
            {selected && (
              <>
                <div className="space-y-1">
                  <Label>Node type</Label>
                  <p className="text-xs">{selected.type}</p>
                </div>

                {selected.type === 'TRIGGER' && selected.trigger && (
                  <>
                    <div className="space-y-1">
                      <Label>Trigger type</Label>
                      <Select
                        value={selected.trigger.type}
                        onChange={(e) =>
                          updateSelected({
                            trigger: {
                              ...selected.trigger!,
                              type: e.target.value,
                            },
                          })
                        }
                      >
                        {TRIGGER_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </Select>
                    </div>
                    {['DAYS_SINCE_LAST_ORDER', 'DAYS_SINCE_LAST_ENGAGEMENT'].includes(
                      selected.trigger.type,
                    ) && (
                      <div className="space-y-1">
                        <Label>Days</Label>
                        <Input
                          type="number"
                          value={selected.trigger.value ?? 60}
                          onChange={(e) =>
                            updateSelected({
                              trigger: {
                                ...selected.trigger!,
                                value: Number(e.target.value),
                              },
                            })
                          }
                        />
                      </div>
                    )}
                  </>
                )}

                {selected.type === 'WAIT' && selected.wait && (
                  <>
                    <div className="space-y-1">
                      <Label>Amount</Label>
                      <Input
                        type="number"
                        value={selected.wait.amount}
                        onChange={(e) =>
                          updateSelected({
                            wait: {
                              ...selected.wait!,
                              amount: Number(e.target.value),
                            },
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Unit</Label>
                      <Select
                        value={selected.wait.unit}
                        onChange={(e) =>
                          updateSelected({
                            wait: { ...selected.wait!, unit: e.target.value },
                          })
                        }
                      >
                        {WAIT_UNITS.map((u) => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                      </Select>
                    </div>
                  </>
                )}

                {selected.type === 'CONDITION' && selected.condition && (
                  <div className="space-y-1">
                    <Label>Logic</Label>
                    <Select
                      value={selected.condition.logic}
                      onChange={(e) =>
                        updateSelected({
                          condition: {
                            ...selected.condition!,
                            logic: e.target.value,
                          },
                        })
                      }
                    >
                      <option value="AND">AND</option>
                      <option value="OR">OR</option>
                    </Select>
                  </div>
                )}

                {selected.type === 'SEND' && selected.send && (
                  <>
                    <div className="space-y-1">
                      <Label>Template group ID</Label>
                      <Input
                        value={selected.send.templateGroupId}
                        onChange={(e) =>
                          updateSelected({
                            send: {
                              ...selected.send!,
                              templateGroupId: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Channel</Label>
                      <Select
                        value={selected.send.channel}
                        onChange={(e) =>
                          updateSelected({
                            send: { ...selected.send!, channel: e.target.value },
                          })
                        }
                      >
                        <option value="WHATSAPP">WHATSAPP</option>
                        <option value="SMS">SMS</option>
                        <option value="EMAIL">EMAIL</option>
                      </Select>
                    </div>
                  </>
                )}

                {selected.type === 'SPLIT' && selected.split && (
                  <>
                    <div className="space-y-1">
                      <Label>A weight (0-100)</Label>
                      <Input
                        type="number"
                        value={selected.split.aWeight}
                        onChange={(e) =>
                          updateSelected({
                            split: {
                              aWeight: Number(e.target.value),
                              bWeight: 100 - Number(e.target.value),
                            },
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>B weight (auto)</Label>
                      <p className="text-xs">{100 - selected.split.aWeight}</p>
                    </div>
                  </>
                )}
              </>
            )}
          </CardBody>
        </Card>
      </div>
    </main>
  );
}
