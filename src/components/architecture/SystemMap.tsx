"use client";

import { useEffect, useId, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon, PauseIcon, PlayIcon, RotateCcwIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

import {
  MAP_EDGES,
  MAP_NODES,
  SCENARIOS,
  type EdgeId,
  type MapEdge,
  type MapNode,
  type NodeId,
  type Scenario,
} from "./content";

const OVERVIEW = "pecas";
/** Tempo de cada passo no modo automático (igual à animação `animate-step`). */
const STEP_MS = 5000;

const NODE_BY_ID = new Map(MAP_NODES.map((node) => [node.id, node]));
const EDGE_BY_ID = new Map(MAP_EDGES.map((edge) => [edge.id, edge]));
/** Peças de fora do sistema: borda tracejada. */
const EXTERNAL: ReadonlySet<NodeId> = new Set(["you", "ea"]);

type Box = { x: number; y: number; w: number; h: number };
type EdgeGeometry = { d: string; label?: { x: number; y: number; anchor?: "start" | "end" } };

interface Layout {
  width: number;
  height: number;
  nodes: Record<NodeId, Box>;
  edges: Record<EdgeId, EdgeGeometry>;
  /** Onde o X do bloqueio fica, e em que fração da linha. */
  block: { x: number; y: number; at: number };
}

/** Computador: dados novos entram pela esquerda, vocês ficam na direita. */
const WIDE: Layout = {
  width: 1000,
  height: 440,
  nodes: {
    ea: { x: 20, y: 174, w: 200, h: 92 },
    actions: { x: 390, y: 24, w: 240, h: 92 },
    supabase: { x: 390, y: 324, w: 240, h: 92 },
    vercel: { x: 680, y: 174, w: 180, h: 92 },
    you: { x: 906, y: 184, w: 84, h: 72 },
  },
  edges: {
    "you-vercel": { d: "M906,206 L866,206" },
    "vercel-you": { d: "M862,234 L902,234" },
    "vercel-supabase": { d: "M716,266 L638,326", label: { x: 690, y: 318 } },
    "vercel-ea": { d: "M680,248 L226,248", label: { x: 236, y: 284 } },
    "vercel-actions": { d: "M736,174 L638,106", label: { x: 700, y: 112 } },
    "actions-ea": { d: "M390,88 L226,184", label: { x: 30, y: 128 } },
    "actions-supabase": { d: "M530,116 L530,318", label: { x: 542, y: 196 } },
    "supabase-actions": { d: "M490,324 L490,122", label: { x: 478, y: 196, anchor: "end" } },
  },
  block: { x: 300, y: 248, at: 0.84 },
};

/** Celular e tablet: de cima para baixo, sem rótulos nas linhas (o painel explica). */
const TALL: Layout = {
  width: 400,
  height: 632,
  nodes: {
    you: { x: 140, y: 10, w: 120, h: 72 },
    vercel: { x: 110, y: 130, w: 180, h: 92 },
    actions: { x: 110, y: 312, w: 180, h: 92 },
    ea: { x: 10, y: 528, w: 175, h: 92 },
    supabase: { x: 215, y: 528, w: 175, h: 92 },
  },
  edges: {
    "you-vercel": { d: "M188,82 L188,124" },
    "vercel-you": { d: "M212,128 L212,88" },
    "vercel-actions": { d: "M200,222 L200,306" },
    "vercel-ea": { d: "M110,200 C24,250 18,450 76,522" },
    "vercel-supabase": { d: "M290,200 C376,250 382,450 324,522" },
    "actions-ea": { d: "M150,404 L112,522" },
    "actions-supabase": { d: "M244,404 L282,522" },
    "supabase-actions": { d: "M306,524 L268,408" },
  },
  block: { x: 39, y: 353, at: 0.5 },
};

type EdgeState = "idle" | "active" | "done" | "focus" | "muted";
type NodeState = "idle" | "active" | "muted";

interface MapState {
  edges: Record<EdgeId, EdgeState>;
  nodes: Record<NodeId, NodeState>;
}

function touches(edge: MapEdge, node: NodeId) {
  return edge.from === node || edge.to === node;
}

function overviewState(selected: NodeId | null): MapState {
  const edges = {} as Record<EdgeId, EdgeState>;
  const nodes = {} as Record<NodeId, NodeState>;
  for (const edge of MAP_EDGES) {
    edges[edge.id] = !selected ? "idle" : touches(edge, selected) ? "focus" : "muted";
  }
  for (const node of MAP_NODES) {
    const linked = selected && MAP_EDGES.some((edge) => touches(edge, selected) && touches(edge, node.id));
    nodes[node.id] = !selected ? "idle" : node.id === selected ? "active" : linked ? "idle" : "muted";
  }
  return { edges, nodes };
}

function scenarioState(scenario: Scenario, stepIndex: number): MapState {
  const step = scenario.steps[stepIndex];
  const used = new Set<EdgeId>();
  const done = new Set<EdgeId>();
  const involved = new Set<NodeId>();
  scenario.steps.forEach((item, index) => {
    involved.add(item.node);
    const edge = item.edge && EDGE_BY_ID.get(item.edge);
    if (!edge) return;
    used.add(edge.id);
    if (index < stepIndex) done.add(edge.id);
    involved.add(edge.from).add(edge.to);
  });

  const edges = {} as Record<EdgeId, EdgeState>;
  const nodes = {} as Record<NodeId, NodeState>;
  for (const edge of MAP_EDGES) {
    edges[edge.id] =
      edge.id === step.edge ? "active" : done.has(edge.id) ? "done" : used.has(edge.id) ? "idle" : "muted";
  }
  for (const node of MAP_NODES) {
    nodes[node.id] = node.id === step.node ? "active" : involved.has(node.id) ? "idle" : "muted";
  }
  return { edges, nodes };
}

/** O mapa do sistema com as peças, as linhas e os fluxos tocados passo a passo. */
export function SystemMap() {
  const [mode, setMode] = useState(OVERVIEW);
  const [stepIndex, setStepIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [selected, setSelected] = useState<NodeId | null>(null);

  const scenario = SCENARIOS.find((item) => item.id === mode) ?? null;
  const state = scenario ? scenarioState(scenario, stepIndex) : overviewState(selected);
  const step = scenario?.steps[stepIndex];

  useEffect(() => {
    if (!playing || !scenario) return;
    const last = scenario.steps.length - 1;
    const timer = window.setTimeout(() => {
      if (stepIndex >= last) setPlaying(false);
      else setStepIndex(stepIndex + 1);
    }, STEP_MS);
    return () => window.clearTimeout(timer);
  }, [playing, scenario, stepIndex]);

  function changeMode(value: string) {
    setMode(value);
    setStepIndex(0);
    setPlaying(value !== OVERVIEW);
  }

  function selectNode(id: NodeId) {
    setMode(OVERVIEW);
    setPlaying(false);
    setSelected((current) => (current === id && mode === OVERVIEW ? null : id));
  }

  function goTo(index: number) {
    setPlaying(false);
    setStepIndex(index);
  }

  const label = step
    ? `Fluxo "${scenario?.label}", passo ${stepIndex + 1} de ${scenario?.steps.length}: ${step.title}.`
    : "Mapa: o GitHub Actions busca na EA e grava no Supabase; a Vercel lê do Supabase e pede sincronizações ao GitHub, porque a EA a bloqueia.";
  const drawing = { state, stepKey: `${mode}-${stepIndex}`, label, onSelectNode: selectNode };

  return (
    <Tabs value={mode} onValueChange={(value) => changeMode(String(value))} className="gap-4">
      <div className="no-scrollbar -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <TabsList variant="line" className="min-w-max gap-0 border-b group-data-horizontal/tabs:h-11">
          {[{ id: OVERVIEW, label: "Peças" }, ...SCENARIOS].map((item) => (
            <TabsTrigger
              key={item.id}
              value={item.id}
              className="px-3.5 font-display text-base font-bold tracking-[0.08em] uppercase after:bg-primary sm:px-4"
            >
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      <div className="grid gap-4 md:max-lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)] md:max-lg:items-start">
        <MapDrawing layout={WIDE} className="max-lg:hidden" {...drawing} />
        <MapDrawing layout={TALL} className="mx-auto w-full max-w-[400px] lg:hidden" {...drawing} />

        <TabsContent value={OVERVIEW}>
          <OverviewPanel selected={selected} onSelect={(id) => setSelected(id === selected ? null : id)} />
        </TabsContent>
        {SCENARIOS.map((item) => (
          <TabsContent key={item.id} value={item.id}>
            {item === scenario && (
              <ScenarioPanel
                scenario={item}
                stepIndex={stepIndex}
                playing={playing}
                onGoTo={goTo}
                onTogglePlay={() => {
                  if (playing) return setPlaying(false);
                  if (stepIndex === item.steps.length - 1) setStepIndex(0);
                  setPlaying(true);
                }}
              />
            )}
          </TabsContent>
        ))}
      </div>
    </Tabs>
  );
}

interface MapDrawingProps {
  layout: Layout;
  state: MapState;
  stepKey: string;
  label: string;
  onSelectNode: (id: NodeId) => void;
  className?: string;
}

function MapDrawing({ layout, state, stepKey, label, onSelectNode, className }: MapDrawingProps) {
  const prefix = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const markers = { primary: `${prefix}-primary`, idle: `${prefix}-idle`, loss: `${prefix}-loss` };

  return (
    <figure className={cn("rounded-sm border bg-card/50 p-2 sm:p-3", className)}>
      <svg
        viewBox={`0 0 ${layout.width} ${layout.height}`}
        role="img"
        aria-label={label}
        className="block h-auto w-full select-none"
      >
        <defs>
          <ArrowMarker id={markers.primary} className="fill-primary" />
          <ArrowMarker id={markers.idle} className="fill-muted-foreground/50" />
          <ArrowMarker id={markers.loss} className="fill-loss" />
        </defs>

        {MAP_EDGES.map((edge) => (
          <MapEdgeView
            key={edge.id}
            edge={edge}
            geometry={layout.edges[edge.id]}
            block={layout.block}
            state={state.edges[edge.id]}
            stepKey={stepKey}
            markers={markers}
          />
        ))}

        {MAP_NODES.map((node) => (
          <MapNodeView
            key={node.id}
            node={node}
            box={layout.nodes[node.id]}
            state={state.nodes[node.id]}
            onSelect={() => onSelectNode(node.id)}
          />
        ))}
      </svg>
    </figure>
  );
}

function ArrowMarker({ id, className }: { id: string; className: string }) {
  return (
    <marker id={id} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" className={className} />
    </marker>
  );
}

interface MapEdgeViewProps {
  edge: MapEdge;
  geometry: EdgeGeometry;
  block: Layout["block"];
  state: EdgeState;
  stepKey: string;
  markers: Record<"primary" | "idle" | "loss", string>;
}

function MapEdgeView({ edge, geometry, block, state, stepKey, markers }: MapEdgeViewProps) {
  const active = state === "active";
  const tone = edge.blocked ? "loss" : state === "idle" ? "idle" : "primary";
  const stroke = { primary: "stroke-primary", idle: "stroke-muted-foreground/50", loss: "stroke-loss" }[tone];
  const label = geometry.label;

  return (
    <g
      className={cn(
        "transition-opacity duration-300",
        state === "muted" && "opacity-15",
        state === "done" && "opacity-45",
        edge.blocked && state === "idle" && "opacity-70",
      )}
    >
      <path
        d={geometry.d}
        fill="none"
        className={cn(stroke, "transition-[stroke,stroke-width] duration-300", active && "motion-safe:animate-flow")}
        strokeWidth={active ? 2.5 : state === "focus" ? 2 : 1.5}
        strokeDasharray={active ? "8 6" : edge.blocked ? "6 5" : undefined}
        markerEnd={`url(#${markers[tone]})`}
      />

      {active && (
        // Recriado a cada passo para a bolinha sair do começo da linha.
        <circle key={stepKey} r={5} className={cn(edge.blocked ? "fill-loss" : "fill-primary", "motion-reduce:hidden")}>
          <animateMotion
            dur="1.6s"
            repeatCount="indefinite"
            path={geometry.d}
            {...(edge.blocked ? { keyPoints: `0;${block.at}`, keyTimes: "0;1", calcMode: "linear" } : {})}
          />
        </circle>
      )}

      {edge.blocked && (
        <g className="stroke-loss" strokeWidth={active ? 3 : 2.5} strokeLinecap="round">
          <line x1={block.x - 9} y1={block.y - 9} x2={block.x + 9} y2={block.y + 9} />
          <line x1={block.x + 9} y1={block.y - 9} x2={block.x - 9} y2={block.y + 9} />
        </g>
      )}

      {label && (
        <text
          x={label.x}
          y={label.y}
          textAnchor={label.anchor ?? "start"}
          className={cn(
            "text-[13px] font-semibold transition-colors",
            edge.blocked ? "fill-loss" : active || state === "focus" ? "fill-foreground" : "fill-muted-foreground",
          )}
        >
          {edge.label}
          {edge.detail && (
            <tspan x={label.x} dy={17} className="font-normal">
              {edge.detail}
            </tspan>
          )}
        </text>
      )}
    </g>
  );
}

interface MapNodeViewProps {
  node: MapNode;
  box: Box;
  state: NodeState;
  onSelect: () => void;
}

function MapNodeView({ node, box, state, onSelect }: MapNodeViewProps) {
  const active = state === "active";
  return (
    <g
      onClick={onSelect}
      className={cn("cursor-pointer transition-opacity duration-300", state === "muted" && "opacity-30")}
    >
      <title>{`${node.name}: toque para ver o que faz`}</title>
      <rect
        x={box.x}
        y={box.y}
        width={box.w}
        height={box.h}
        rx={4}
        className={cn(
          "fill-card transition-[stroke] duration-300",
          active ? "stroke-primary [filter:drop-shadow(0_0_10px_rgb(34_197_94/0.35))]" : "stroke-input hover:stroke-muted-foreground",
        )}
        strokeWidth={active ? 2 : 1.5}
        strokeDasharray={EXTERNAL.has(node.id) && !active ? "5 4" : undefined}
      />
      <text
        x={box.x + 16}
        y={box.y + 30}
        className={cn("font-display text-[16px] font-bold tracking-[0.06em]", active ? "fill-primary" : "fill-foreground")}
      >
        {node.title}
      </text>
      {node.lines.map((line, index) => (
        <text key={line} x={box.x + 16} y={box.y + 52 + index * 20} className="fill-muted-foreground text-[12.5px]">
          {line}
        </text>
      ))}
    </g>
  );
}

function OverviewPanel({ selected, onSelect }: { selected: NodeId | null; onSelect: (id: NodeId) => void }) {
  const node = selected ? NODE_BY_ID.get(selected) : undefined;
  return (
    <div className="space-y-4 border bg-card p-4 sm:p-5">
      <div className="space-y-2.5">
        <p className="kicker text-muted-foreground">As peças</p>
        <div className="flex flex-wrap gap-2">
          {MAP_NODES.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={item.id === selected}
              onClick={() => onSelect(item.id)}
              className={cn(
                "min-h-9 rounded-full border px-3.5 text-sm font-semibold transition-colors",
                item.id === selected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-input hover:border-primary",
              )}
            >
              {item.name}
            </button>
          ))}
        </div>
      </div>

      {node ? (
        <NodeDetails node={node} />
      ) : (
        <p className="text-sm text-muted-foreground">
          Toque numa peça para ver o que ela faz e com quem conversa, ou escolha um fluxo nas abas para ver os
          dados andando passo a passo.
        </p>
      )}
    </div>
  );
}

function NodeDetails({ node }: { node: MapNode }) {
  const links = MAP_EDGES.filter((edge) => touches(edge, node.id));
  return (
    <div className="space-y-3 border-t pt-4">
      <div className="space-y-1">
        <p className="kicker text-primary">{node.where}</p>
        <h3 className="font-display text-2xl font-bold uppercase">{node.name}</h3>
      </div>
      <p className="text-muted-foreground">{node.role}</p>
      <ul className="space-y-1.5 text-sm">
        {links.map((edge) => {
          const outgoing = edge.from === node.id;
          const other = NODE_BY_ID.get(outgoing ? edge.to : edge.from)?.name;
          return (
            <li key={edge.id} className="flex gap-2">
              <span aria-hidden className={cn("font-bold", edge.blocked ? "text-loss" : "text-primary")}>
                {outgoing ? "→" : "←"}
              </span>
              <span>
                <span className="font-semibold">{other}</span>
                <span className="text-muted-foreground">
                  {" · "}
                  {outgoing ? "" : "recebe: "}
                  {edge.label}
                  {edge.detail && ` (${edge.detail})`}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
      {node.code.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {node.code.map((path) => (
            <code key={path} className="rounded-sm bg-surface px-1.5 py-0.5 font-mono text-xs">
              {path}
            </code>
          ))}
        </div>
      )}
    </div>
  );
}

interface ScenarioPanelProps {
  scenario: Scenario;
  stepIndex: number;
  playing: boolean;
  onGoTo: (index: number) => void;
  onTogglePlay: () => void;
}

function ScenarioPanel({ scenario, stepIndex, playing, onGoTo, onTogglePlay }: ScenarioPanelProps) {
  const step = scenario.steps[stepIndex];
  const last = scenario.steps.length - 1;
  const PlayStateIcon = playing ? PauseIcon : stepIndex === last ? RotateCcwIcon : PlayIcon;

  return (
    <div className="border bg-card">
      <div className="h-1 overflow-hidden bg-surface" aria-hidden>
        {playing && (
          <div
            key={`${scenario.id}-${stepIndex}`}
            className="h-full origin-left bg-primary motion-safe:animate-step motion-reduce:hidden"
          />
        )}
      </div>

      <div className="space-y-3 p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="kicker text-primary tabular">
            Passo {stepIndex + 1} de {scenario.steps.length}
          </p>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="icon"
              aria-label="Passo anterior"
              disabled={stepIndex === 0}
              onClick={() => onGoTo(stepIndex - 1)}
            >
              <ChevronLeftIcon />
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label={playing ? "Pausar" : stepIndex === last ? "Ver de novo" : "Tocar"}
              onClick={onTogglePlay}
            >
              <PlayStateIcon />
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label="Próximo passo"
              disabled={stepIndex === last}
              onClick={() => onGoTo(stepIndex + 1)}
            >
              <ChevronRightIcon />
            </Button>
          </div>
        </div>

        <div aria-live="polite" className="space-y-1.5">
          <h3 className="font-display text-2xl font-bold uppercase">{step.title}</h3>
          <p className="text-muted-foreground">{step.text}</p>
        </div>

        <ol className="flex flex-wrap gap-1.5 pt-1">
          {scenario.steps.map((item, index) => (
            <li key={item.title}>
              <button
                type="button"
                onClick={() => onGoTo(index)}
                aria-current={index === stepIndex ? "step" : undefined}
                className={cn(
                  "flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition-colors",
                  index === stepIndex
                    ? "border-primary bg-primary text-primary-foreground"
                    : index < stepIndex
                      ? "border-primary/50 text-foreground"
                      : "border-input text-muted-foreground hover:text-foreground",
                )}
              >
                <span className="font-display font-bold tabular">{index + 1}</span>
                <span className="max-sm:sr-only">{item.title}</span>
              </button>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
