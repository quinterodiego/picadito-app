'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';
import {
  Users, Shuffle, Save,
  Bone, Shield, ShieldAlert, CheckCircle2, ClipboardList, ArrowLeftRight, ArrowUpDown,
  UserPlus, X, Telescope,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import CanchaVista, { type CanchaState } from '@/components/CanchaVista';
import type { Jugador, NivelJugador, EquipoSugerido, ResultadoPartido } from '@/lib/types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const NIVEL_CONFIG: Record<NivelJugador, { label: string; color: string }> = {
  'bajo':       { label: 'B',  color: 'bg-blue-100 text-blue-700' },
  'semi-medio': { label: 'SM', color: 'bg-cyan-100 text-cyan-700' },
  'medio':      { label: 'M',  color: 'bg-yellow-100 text-yellow-700' },
  'semi-alto':  { label: 'SA', color: 'bg-orange-100 text-orange-700' },
  'alto':       { label: 'A',  color: 'bg-red-100 text-red-700' },
};
const NIVEL_PESO: Record<NivelJugador, number> = {
  'bajo': 1, 'semi-medio': 2, 'medio': 3, 'semi-alto': 4, 'alto': 5,
};

function NivelBadge({ nivel }: { nivel: NivelJugador }) {
  const { label, color } = NIVEL_CONFIG[nivel];
  return <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${color}`}>{label}</span>;
}

function nivelEquipo(jugadores: Jugador[]) {
  return jugadores.reduce((s, j) => s + NIVEL_PESO[j.nivel], 0);
}


// ─── Columna editable de un equipo ────────────────────────────────────────────
function ColumnaEquipo({
  titulo, jugadores, seleccionado, puedeRecibir, haySelEnMiEquipo, onTap, ganador, gkId,
}: {
  titulo: string;
  jugadores: Jugador[];
  seleccionado: string | null;
  puedeRecibir: boolean;
  haySelEnMiEquipo: boolean;
  onTap: (j: Jugador) => void;
  ganador?: boolean;
  gkId: string | null;
}) {
  const nivel = nivelEquipo(jugadores);
  const borderColor =
    ganador === true  ? 'border-brand/40 bg-brand-light' :
    ganador === false ? 'border-red-200 bg-red-50' :
    puedeRecibir      ? 'border-blue-300 bg-blue-50/40' :
    haySelEnMiEquipo  ? 'border-violet-300 bg-violet-50/40' :
                        'border-slate-200 bg-white';

  return (
    <div className={`rounded-xl border p-3 transition-colors ${borderColor}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-sm">{titulo}</span>
        <span className="text-xs text-slate-500">Niv {nivel}</span>
      </div>
      <div className="flex flex-col gap-1.5">
        {jugadores.map(j => {
          const estaSeleccionado = seleccionado === j.id;
          const esGK = j.id === gkId;
          // target de intercambio entre equipos
          const esTargetCross = puedeRecibir && !estaSeleccionado;
          // target de reordenamiento dentro del equipo (para cambiar posición/arco)
          const esTargetIntra = haySelEnMiEquipo && !estaSeleccionado;
          return (
            <button
              key={j.id}
              onClick={() => onTap(j)}
              className={`cursor-pointer flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm text-left w-full transition-all
                ${estaSeleccionado
                  ? 'bg-brand text-white ring-2 ring-brand ring-offset-1 scale-[1.02]'
                  : esTargetCross
                    ? 'bg-blue-50 border border-blue-300 text-blue-800 hover:bg-blue-100'
                  : esTargetIntra
                    ? 'bg-violet-50 border border-violet-200 text-violet-900 hover:bg-violet-100'
                  : esGK
                    ? 'bg-amber-50 border border-amber-200 text-amber-900 hover:bg-amber-100'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
            >
              {esTargetCross  && <ArrowLeftRight size={11} className="text-blue-400 shrink-0" />}
              {esTargetIntra  && <ArrowUpDown    size={11} className="text-violet-400 shrink-0" />}
              <span className="flex-1 font-medium">{j.apodo || j.nombre}</span>
              {esGK && !estaSeleccionado && (
                <span className="text-xs font-bold px-1 py-0.5 rounded bg-amber-200 text-amber-800 leading-none shrink-0">GK</span>
              )}
              {!esGK && j.esArquero && (
                <Shield size={11} className={estaSeleccionado ? 'text-violet-200' : 'text-violet-500'} />
              )}
              {!esGK && j.puedeAtajarProximo && !j.esArquero && (
                <ShieldAlert size={11} className={estaSeleccionado ? 'text-blue-200' : 'text-blue-400'} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Editor de equipos ────────────────────────────────────────────────────────
function EditorEquipos({
  equipo1, equipo2, onChange, goles1, goles2,
}: {
  equipo1: Jugador[];
  equipo2: Jugador[];
  onChange: (e1: Jugador[], e2: Jugador[]) => void;
  goles1: string;
  goles2: string;
}) {
  const [sel, setSel] = useState<{ id: string; equipo: 1 | 2 } | null>(null);

  function swapInTeam(team: Jugador[], idA: string, jugadorB: Jugador): Jugador[] {
    return team.map(j => j.id === idA ? jugadorB : j.id === jugadorB.id ? team.find(x => x.id === idA)! : j);
  }

  function handleTap(jugador: Jugador, equipo: 1 | 2) {
    if (sel?.id === jugador.id) { setSel(null); return; }

    if (sel && sel.equipo !== equipo) {
      // Swap entre equipos
      const selJ = sel.equipo === 1 ? equipo1.find(j => j.id === sel.id)! : equipo2.find(j => j.id === sel.id)!;
      onChange(
        equipo1.map(j => j.id === selJ.id ? jugador : j.id === jugador.id ? selJ : j),
        equipo2.map(j => j.id === selJ.id ? jugador : j.id === jugador.id ? selJ : j),
      );
      setSel(null);
      return;
    }

    if (sel && sel.equipo === equipo) {
      // Swap dentro del mismo equipo (para cambiar quién va al arco, etc.)
      const newE1 = equipo === 1 ? swapInTeam(equipo1, sel.id, jugador) : equipo1;
      const newE2 = equipo === 2 ? swapInTeam(equipo2, sel.id, jugador) : equipo2;
      onChange(newE1, newE2);
      setSel(null);
      return;
    }

    setSel({ id: jugador.id, equipo });
  }

  const haySelEnE1 = sel?.equipo === 1;
  const haySelEnE2 = sel?.equipo === 2;
  const g1 = goles1 !== '' ? parseInt(goles1) : null;
  const g2 = goles2 !== '' ? parseInt(goles2) : null;
  const ganador1 = g1 !== null && g2 !== null ? (g1 > g2 ? true : g1 < g2 ? false : undefined) : undefined;
  const ganador2 = g1 !== null && g2 !== null ? (g2 > g1 ? true : g2 < g1 ? false : undefined) : undefined;

  // GK = primer jugador del array (posición editable via intra-swap)
  const gkId1 = equipo1[0]?.id ?? null;
  const gkId2 = equipo2[0]?.id ?? null;

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <ColumnaEquipo titulo="Equipo A" jugadores={equipo1}
          seleccionado={haySelEnE1 ? sel!.id : null}
          puedeRecibir={!!haySelEnE2} haySelEnMiEquipo={haySelEnE1}
          onTap={j => handleTap(j, 1)} ganador={ganador1} gkId={gkId1} />
        <ColumnaEquipo titulo="Equipo B" jugadores={equipo2}
          seleccionado={haySelEnE2 ? sel!.id : null}
          puedeRecibir={!!haySelEnE1} haySelEnMiEquipo={haySelEnE2}
          onTap={j => handleTap(j, 2)} ganador={ganador2} gkId={gkId2} />
      </div>
      {sel ? (
        <p className="text-xs text-center font-medium text-slate-500">
          {sel.equipo === 1 || sel.equipo === 2
            ? 'Tocá otro del mismo equipo para cambiar posición, o uno del otro equipo para intercambiar'
            : ''}
        </p>
      ) : (
        <p className="text-xs text-center text-slate-400">
          Tocá un jugador para seleccionarlo — el primero de cada equipo es el arquero
        </p>
      )}
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function PartidoPage() {
  const [asistentes, setAsistentes] = useState<string[]>([]);
  const [invitados, setInvitados] = useState<string[]>([]);
  const [inputInvitado, setInputInvitado] = useState('');
  const [equipoEditado, setEquipoEditado] = useState<{ equipo1: Jugador[]; equipo2: Jugador[] } | null>(null);
  const [mostrarCancha, setMostrarCancha] = useState(false);
  const [mostrarResultado, setMostrarResultado] = useState(false);
  const [fecha, setFecha] = useState(() => new Date().toISOString().split('T')[0]);
  const [resultado, setResultado] = useState<ResultadoPartido | ''>('');
  const [destacado, setDestacado] = useState('');
  const [rustico, setRustico] = useState('');
  const [notas, setNotas] = useState('');
  const [partidoGuardadoId, setPartidoGuardadoId] = useState<string | null>(null);
  const canchaStateRef = useRef<CanchaState | null>(null);

  const qc = useQueryClient();

  const { data: jugadores = [], isLoading } = useQuery<Jugador[]>({
    queryKey: ['jugadores'],
    queryFn: () => axios.get('/api/jugadores').then(r => r.data),
  });

  const jugadoresActivos = jugadores.filter(j => j.activo && !j.lesionado);
  const jugadoresLesionados = jugadores.filter(j => j.activo && j.lesionado);
  const totalJugadores = asistentes.length + invitados.length;

  function agregarInvitado() {
    const nombre = inputInvitado.trim();
    if (!nombre || invitados.includes(nombre)) return;
    setInvitados(prev => [...prev, nombre]);
    setInputInvitado('');
    setEquipoEditado(null);
    setPartidoGuardadoId(null);
  }

  function quitarInvitado(nombre: string) {
    setInvitados(prev => prev.filter(n => n !== nombre));
    setEquipoEditado(null);
    setPartidoGuardadoId(null);
  }

  // Pone el arquero (por flag) primero en el array — así gkId = equipo[0].id
  function gkPrimero(equipo: Jugador[]): Jugador[] {
    const gk = equipo.find(j => j.esArquero) ?? equipo.find(j => j.puedeAtajarProximo);
    if (!gk) return equipo;
    return [gk, ...equipo.filter(j => j.id !== gk.id)];
  }

  const generarMutation = useMutation({
    mutationFn: () =>
      axios.post<EquipoSugerido[]>('/api/equipos', { asistentes, invitados }).then(r => r.data),
    onSuccess: data => {
      const mejor = data[0];
      setEquipoEditado({ equipo1: gkPrimero([...mejor.equipo1]), equipo2: gkPrimero([...mejor.equipo2]) });
      setPartidoGuardadoId(null);
      setMostrarResultado(false);
    },
    onError: () => toast.error('Error al generar equipos'),
  });

  function invitadosPayload() {
    return invitados.map((nombre, i) => ({ id: `invitado_${i}`, nombre }));
  }

  const guardarFormacionMutation = useMutation({
    mutationFn: () => {
      if (!equipoEditado) throw new Error();
      const cs = canchaStateRef.current;
      return axios.post<{ id: string }>('/api/partidos', {
        fecha,
        equipo1: equipoEditado.equipo1.map(j => j.id),
        equipo2: equipoEditado.equipo2.map(j => j.id),
        invitados: invitadosPayload(),
        notas,
        formacion1: cs?.formacion1,
        formacion2: cs?.formacion2,
        posiciones1: cs?.pos1,
        posiciones2: cs?.pos2,
      }).then(r => r.data);
    },
    onSuccess: data => {
      toast.success('Formación guardada');
      setPartidoGuardadoId(data.id);
      setMostrarCancha(true);
      qc.invalidateQueries({ queryKey: ['partidos'] });
    },
    onError: () => toast.error('Error al guardar formación'),
  });

  const guardarResultadoMutation = useMutation({
    mutationFn: () => {
      if (!partidoGuardadoId || !equipoEditado) throw new Error();
      const cs = canchaStateRef.current;
      return axios.put(`/api/partidos/${partidoGuardadoId}`, {
        fecha,
        equipo1: equipoEditado.equipo1.map(j => j.id),
        equipo2: equipoEditado.equipo2.map(j => j.id),
        resultado: resultado || undefined,
        notas,
        destacado,
        rustico,
        formacion1: cs?.formacion1,
        formacion2: cs?.formacion2,
        posiciones1: cs?.pos1,
        posiciones2: cs?.pos2,
      });
    },
    onSuccess: () => {
      toast.success('Resultado guardado');
      qc.invalidateQueries({ queryKey: ['partidos'] });
      resetear();
    },
    onError: () => toast.error('Error al guardar resultado'),
  });

  function resetear() {
    setAsistentes([]);
    setInvitados([]);
    setInputInvitado('');
    setEquipoEditado(null);
    setPartidoGuardadoId(null);
    setMostrarResultado(false);
    setMostrarCancha(false);
    setFecha(new Date().toISOString().split('T')[0]);
    setResultado('');
    setDestacado('');
    setRustico('');
    setNotas('');
  }

  const toggleAsistente = (id: string) => {
    setAsistentes(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    setEquipoEditado(null);
    setPartidoGuardadoId(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Armar partido</h1>
        <Badge variant="secondary">{totalJugadores} jugadores</Badge>
      </div>

      {/* Selección de asistentes */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center justify-between">
            <span className="flex items-center gap-2"><Users size={16} /> ¿Quiénes juegan?</span>
            {totalJugadores > 0 && (
              <span className="text-sm font-semibold text-brand">{totalJugadores} seleccionados</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-slate-400">Cargando jugadores...</p>
          ) : jugadoresActivos.length === 0 && jugadoresLesionados.length === 0 ? (
            <p className="text-sm text-slate-400">
              No hay jugadores activos. Agregá jugadores en la sección <strong>Jugadores</strong>.
            </p>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {jugadoresActivos.map(j => {
                  const sel = asistentes.includes(j.id);
                  return (
                    <button
                      key={j.id}
                      onClick={() => toggleAsistente(j.id)}
                      className={`cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                        sel
                          ? 'bg-brand text-white border-brand'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                      }`}
                    >
                      {j.apodo || j.nombre}
                      {j.esArquero && <Shield size={12} className={sel ? 'text-violet-200' : 'text-violet-500'} />}
                      {j.puedeAtajarProximo && !j.esArquero && <ShieldAlert size={12} className={sel ? 'text-blue-200' : 'text-blue-400'} />}
                      {/* <NivelBadge nivel={j.nivel} /> */}
                    </button>
                  );
                })}
              </div>
              {jugadoresLesionados.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1 border-t border-slate-100">
                  <span className="text-xs text-slate-400 w-full flex items-center gap-1">
                    <Bone size={11} className="text-orange-400" /> Lesionados (no disponibles)
                  </span>
                  {jugadoresLesionados.map(j => (
                    <span key={j.id} className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs text-slate-400 bg-slate-100 line-through">
                      {j.apodo || j.nombre}
                    </span>
                  ))}
                </div>
              )}

              {/* Invitados */}
              <div className="pt-1 border-t border-slate-100 space-y-2">
                <p className="text-xs font-medium text-slate-400 flex items-center gap-1">
                  <UserPlus size={12} /> Invitados
                </p>
                {invitados.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {invitados.map(nombre => (
                      <span key={nombre} className="flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-700 border border-purple-200">
                        {nombre}
                        <button onClick={() => quitarInvitado(nombre)} className="cursor-pointer ml-0.5 hover:text-purple-900">
                          <X size={11} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <form
                  onSubmit={e => { e.preventDefault(); agregarInvitado(); }}
                  className="flex gap-2"
                >
                  <input
                    value={inputInvitado}
                    onChange={e => setInputInvitado(e.target.value)}
                    placeholder="Nombre del invitado"
                    className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-1.5 outline-none focus:border-purple-400"
                  />
                  <button
                    type="submit"
                    disabled={!inputInvitado.trim()}
                    className="cursor-pointer px-3 py-1.5 rounded-lg bg-purple-100 text-purple-700 text-sm font-medium hover:bg-purple-200 disabled:opacity-40 disabled:cursor-default"
                  >
                    Agregar
                  </button>
                </form>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Botón generar */}
      <Button
        className="w-full gap-2 bg-brand hover:bg-brand-hover"
        disabled={totalJugadores < 4 || generarMutation.isPending}
        onClick={() => generarMutation.mutate()}
      >
        <Shuffle size={16} />
        {generarMutation.isPending ? 'Generando...' : 'Generar equipos'}
      </Button>

      {totalJugadores > 0 && totalJugadores < 4 && (
        <p className="text-xs text-center text-slate-400">Seleccioná al menos 4 jugadores</p>
      )}

      {/* Editor de equipos */}
      {equipoEditado && !partidoGuardadoId && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <ArrowLeftRight size={15} className="text-slate-400" />
                Equipo del día
              </CardTitle>
              <button
                onClick={() => setMostrarCancha(v => !v)}
                className="cursor-pointer text-xs flex items-center gap-1 px-2 py-1 rounded-lg bg-brand-light text-brand hover:bg-brand-light font-medium"
              >
                <Telescope size={13} />
                {mostrarCancha ? 'Ocultar cancha' : 'Ver en cancha'}
              </button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {mostrarCancha ? (
              <CanchaVista equipo1={equipoEditado.equipo1} equipo2={equipoEditado.equipo2} onStateChange={s => { canchaStateRef.current = s; }} />
            ) : (
              <EditorEquipos
                equipo1={equipoEditado.equipo1}
                equipo2={equipoEditado.equipo2}
                onChange={(e1, e2) => setEquipoEditado({ equipo1: e1, equipo2: e2 })}
                goles1=""
                goles2=""
              />
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Fecha del partido</Label>
                <Input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Notas (opcional)</Label>
                <Input value={notas} onChange={e => setNotas(e.target.value)} placeholder="ej: lluvia..." className="mt-1" />
              </div>
            </div>
            <Button
              className="w-full gap-2 bg-brand hover:bg-brand-hover"
              onClick={() => guardarFormacionMutation.mutate()}
              disabled={guardarFormacionMutation.isPending}
            >
              <ClipboardList size={16} />
              {guardarFormacionMutation.isPending ? 'Guardando...' : 'Guardar formación'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Formación guardada — cargar resultado */}
      {partidoGuardadoId && equipoEditado && (
        <Card className="border-brand/30 bg-brand-light/40">
          <CardContent className="py-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-brand">
                <CheckCircle2 size={16} />
                <span className="text-sm font-semibold">Formación guardada</span>
              </div>
              <button
                onClick={() => setMostrarCancha(v => !v)}
                className="cursor-pointer text-xs flex items-center gap-1 px-2 py-1 rounded-lg bg-brand-light text-brand hover:bg-brand-light font-medium"
              >
                <Telescope size={13} />
                {mostrarCancha ? 'Ver lista' : 'Ver cancha'}
              </button>
            </div>

            {mostrarCancha ? (
              <CanchaVista equipo1={equipoEditado.equipo1} equipo2={equipoEditado.equipo2} onStateChange={s => { canchaStateRef.current = s; }} />
            ) : (
              <EditorEquipos
                equipo1={equipoEditado.equipo1}
                equipo2={equipoEditado.equipo2}
                onChange={(e1, e2) => setEquipoEditado({ equipo1: e1, equipo2: e2 })}
                goles1=""
                goles2=""
              />
            )}

            {!mostrarResultado ? (
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 gap-1.5" onClick={() => setMostrarResultado(true)}>
                  <Save size={15} /> Cargar resultado
                </Button>
                <Button variant="outline" onClick={resetear} className="text-slate-400">Nuevo partido</Button>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Resultado */}
                <div>
                  <Label className="text-xs">Resultado</Label>
                  <div className="grid grid-cols-3 gap-2 mt-1">
                    {(['A', 'empate', 'B'] as const).map(r => (
                      <button
                        key={r}
                        onClick={() => setResultado(prev => prev === r ? '' : r)}
                        className={`cursor-pointer py-2 rounded-lg text-sm font-semibold border transition-all ${
                          resultado === r
                            ? r === 'A' ? 'bg-white border-white text-slate-800 ring-2 ring-slate-400'
                              : r === 'B' ? 'bg-brand border-brand text-white ring-2 ring-brand'
                              : 'bg-slate-200 border-slate-300 text-slate-700 ring-2 ring-slate-400'
                            : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-400'
                        }`}
                      >
                        {r === 'A' ? '🤍 Ganó A' : r === 'B' ? '💚 Ganó B' : '🤝 Empate'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Destacado y Rústico */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">⭐ Destacado (opcional)</Label>
                    <select
                      value={destacado}
                      onChange={e => setDestacado(e.target.value)}
                      className="mt-1 w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white outline-none focus:border-brand"
                    >
                      <option value="">—</option>
                      {equipoEditado && [...equipoEditado.equipo1, ...equipoEditado.equipo2].map(j => (
                        <option key={j.id} value={j.id}>{j.apodo || j.nombre}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs">🪨 Rústico (opcional)</Label>
                    <select
                      value={rustico}
                      onChange={e => setRustico(e.target.value)}
                      className="mt-1 w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white outline-none focus:border-orange-400"
                    >
                      <option value="">—</option>
                      {equipoEditado && [...equipoEditado.equipo1, ...equipoEditado.equipo2].map(j => (
                        <option key={j.id} value={j.id}>{j.apodo || j.nombre}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    className="flex-1 gap-1.5"
                    onClick={() => guardarResultadoMutation.mutate()}
                    disabled={guardarResultadoMutation.isPending}
                  >
                    <Save size={15} />
                    {guardarResultadoMutation.isPending ? 'Guardando...' : 'Guardar resultado'}
                  </Button>
                  <Button variant="outline" onClick={resetear} className="text-slate-400">Omitir</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
