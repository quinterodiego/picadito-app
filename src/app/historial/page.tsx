'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';
import { Trash2, Trophy, Minus, Pencil, ArrowRight, X, UserPlus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Jugador, Partido } from '@/lib/types';

function useJugadores() {
  return useQuery<Jugador[]>({
    queryKey: ['jugadores'],
    queryFn: () => axios.get('/api/jugadores').then(r => r.data),
  });
}

function formatFecha(iso: string) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

function ResultadoBadge({ g1, g2 }: { g1?: number; g2?: number }) {
  if (g1 == null || g2 == null) return <span className="text-xs text-slate-400 italic">Sin resultado</span>;
  if (g1 > g2) return <span className="text-xs font-bold text-green-600 flex items-center gap-1"><Trophy size={12} /> A ganó</span>;
  if (g2 > g1) return <span className="text-xs font-bold text-green-600 flex items-center gap-1"><Trophy size={12} /> B ganó</span>;
  return <span className="text-xs font-bold text-slate-500 flex items-center gap-1"><Minus size={12} /> Empate</span>;
}

// ─── Editor de partido ────────────────────────────────────────────────────────
function EditPartidoDialog({
  partido,
  jugadores,
  onSave,
  onClose,
  loading,
}: {
  partido: Partido;
  jugadores: Jugador[];
  onSave: (data: { fecha: string; equipo1: string[]; equipo2: string[]; goles1?: number; goles2?: number; notas: string }) => void;
  onClose: () => void;
  loading: boolean;
}) {
  const [fecha, setFecha] = useState(partido.fecha);
  const [equipo1, setEquipo1] = useState<string[]>(partido.equipo1);
  const [equipo2, setEquipo2] = useState<string[]>(partido.equipo2);
  const [goles1, setGoles1] = useState(partido.goles1?.toString() ?? '');
  const [goles2, setGoles2] = useState(partido.goles2?.toString() ?? '');
  const [notas, setNotas] = useState(partido.notas ?? '');

  const jugMap = new Map(jugadores.map(j => [j.id, j]));
  const asignadosIds = new Set([...equipo1, ...equipo2]);
  const disponibles = jugadores.filter(j => !asignadosIds.has(j.id));

  function nombre(id: string) {
    const j = jugMap.get(id);
    return j ? (j.apodo || j.nombre) : id;
  }

  function moverAEquipo2(id: string) {
    setEquipo1(p => p.filter(x => x !== id));
    setEquipo2(p => p.includes(id) ? p : [...p, id]);
  }
  function moverAEquipo1(id: string) {
    setEquipo2(p => p.filter(x => x !== id));
    setEquipo1(p => p.includes(id) ? p : [...p, id]);
  }
  function agregar(id: string, equipo: 1 | 2) {
    if (equipo === 1) setEquipo1(p => [...p, id]);
    else setEquipo2(p => [...p, id]);
  }

  return (
    <div className="space-y-4">
      {/* Fecha */}
      <div>
        <Label className="text-xs">Fecha del partido</Label>
        <Input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className="mt-1" />
      </div>

      {/* Equipos */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs font-semibold text-slate-600 mb-1.5">Equipo A</p>
          <div className="space-y-1">
            {equipo1.map(id => (
              <div key={id} className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-sm">
                <span className="flex-1 truncate">{nombre(id)}</span>
                <button
                  onClick={() => moverAEquipo2(id)}
                  className="cursor-pointer text-blue-400 hover:text-blue-600 shrink-0"
                  title="Mover a Equipo B"
                >
                  <ArrowRight size={13} />
                </button>
                <button
                  onClick={() => setEquipo1(p => p.filter(x => x !== id))}
                  className="cursor-pointer text-slate-300 hover:text-red-400 shrink-0"
                >
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-600 mb-1.5">Equipo B</p>
          <div className="space-y-1">
            {equipo2.map(id => (
              <div key={id} className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-sm">
                <button
                  onClick={() => moverAEquipo1(id)}
                  className="cursor-pointer text-blue-400 hover:text-blue-600 shrink-0"
                  title="Mover a Equipo A"
                >
                  <ArrowRight size={13} className="rotate-180" />
                </button>
                <span className="flex-1 truncate">{nombre(id)}</span>
                <button
                  onClick={() => setEquipo2(p => p.filter(x => x !== id))}
                  className="cursor-pointer text-slate-300 hover:text-red-400 shrink-0"
                >
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Jugadores disponibles */}
      {disponibles.length > 0 && (
        <div>
          <p className="text-xs font-medium text-slate-400 mb-1.5 flex items-center gap-1">
            <UserPlus size={12} /> Agregar jugadores
          </p>
          <div className="flex flex-wrap gap-1.5">
            {disponibles.map(j => (
              <div key={j.id} className="flex items-center gap-0 border border-slate-200 rounded-full overflow-hidden text-xs">
                <span className="px-2 py-1 text-slate-600">{j.apodo || j.nombre}</span>
                <button
                  onClick={() => agregar(j.id, 1)}
                  className="cursor-pointer px-2 py-1 bg-slate-100 hover:bg-blue-100 text-slate-500 hover:text-blue-700 font-bold border-l border-slate-200"
                >A</button>
                <button
                  onClick={() => agregar(j.id, 2)}
                  className="cursor-pointer px-2 py-1 bg-slate-100 hover:bg-green-100 text-slate-500 hover:text-green-700 font-bold border-l border-slate-200"
                >B</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resultado */}
      <div>
        <p className="text-xs font-medium text-slate-400 mb-1.5">Resultado (opcional)</p>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <Label className="text-xs">Goles A</Label>
            <Input type="number" min={0} value={goles1} onChange={e => setGoles1(e.target.value)} placeholder="—" className="mt-1" />
          </div>
          <span className="text-lg font-bold text-slate-400 mt-4">–</span>
          <div className="flex-1">
            <Label className="text-xs">Goles B</Label>
            <Input type="number" min={0} value={goles2} onChange={e => setGoles2(e.target.value)} placeholder="—" className="mt-1" />
          </div>
        </div>
      </div>

      <div>
        <Label className="text-xs">Notas</Label>
        <Input value={notas} onChange={e => setNotas(e.target.value)} placeholder="ej: lluvia, cancha nueva..." className="mt-1" />
      </div>

      <DialogFooter className="gap-2">
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
        <Button
          onClick={() => onSave({
            fecha, equipo1, equipo2, notas,
            goles1: goles1 !== '' ? parseInt(goles1) : undefined,
            goles2: goles2 !== '' ? parseInt(goles2) : undefined,
          })}
          disabled={loading}
        >
          {loading ? 'Guardando...' : 'Guardar cambios'}
        </Button>
      </DialogFooter>
    </div>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────
export default function HistorialPage() {
  const [confirmDelete, setConfirmDelete] = useState<Partido | null>(null);
  const [editando, setEditando] = useState<Partido | null>(null);
  const qc = useQueryClient();

  const { data: jugadores = [] } = useJugadores();
  const jugMap = new Map(jugadores.map(j => [j.id, j]));

  const { data: partidos = [], isLoading } = useQuery<Partido[]>({
    queryKey: ['partidos'],
    queryFn: () => axios.get('/api/partidos').then(r => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => axios.delete(`/api/partidos/${id}`),
    onSuccess: () => {
      toast.success('Partido eliminado');
      qc.invalidateQueries({ queryKey: ['partidos'] });
      setConfirmDelete(null);
    },
    onError: () => toast.error('Error al eliminar partido'),
  });

  const editMutation = useMutation({
    mutationFn: (data: { fecha: string; equipo1: string[]; equipo2: string[]; goles1?: number; goles2?: number; notas: string }) =>
      axios.put(`/api/partidos/${editando!.id}`, data),
    onSuccess: () => {
      toast.success('Partido actualizado');
      qc.invalidateQueries({ queryKey: ['partidos'] });
      setEditando(null);
    },
    onError: () => toast.error('Error al actualizar partido'),
  });

  const sorted = [...partidos].sort((a, b) => b.fecha.localeCompare(a.fecha));

  function displayNombre(id: string) {
    const j = jugMap.get(id);
    return j ? (j.apodo || j.nombre) : id;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Historial</h1>

      {isLoading ? (
        <p className="text-sm text-slate-400 text-center py-8">Cargando...</p>
      ) : sorted.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-8">No hay partidos registrados aún.</p>
      ) : (
        <div className="space-y-3">
          {sorted.map(p => (
            <Card key={p.id}>
              <CardContent className="py-3 px-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-slate-400">{formatFecha(p.fecha)}</p>
                    <ResultadoBadge g1={p.goles1} g2={p.goles2} />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-2xl font-bold tabular-nums text-slate-700">
                      {p.goles1 != null && p.goles2 != null ? `${p.goles1} – ${p.goles2}` : '— —'}
                    </span>
                    <button
                      onClick={() => setEditando(p)}
                      className="cursor-pointer p-1.5 rounded-lg hover:bg-slate-100 text-slate-300 hover:text-slate-600"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => setConfirmDelete(p)}
                      className="cursor-pointer p-1.5 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-400"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-50 rounded-lg p-2">
                    <p className="font-semibold text-slate-600 mb-1">Equipo A</p>
                    <div className="flex flex-wrap gap-1">
                      {p.equipo1.map(id => (
                        <span key={id} className="bg-white border border-slate-200 px-1.5 py-0.5 rounded-full">
                          {displayNombre(id)}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-2">
                    <p className="font-semibold text-slate-600 mb-1">Equipo B</p>
                    <div className="flex flex-wrap gap-1">
                      {p.equipo2.map(id => (
                        <span key={id} className="bg-white border border-slate-200 px-1.5 py-0.5 rounded-full">
                          {displayNombre(id)}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {p.notas && <p className="text-xs text-slate-400 italic">{p.notas}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog editar */}
      <Dialog open={!!editando} onOpenChange={v => !v && setEditando(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar partido</DialogTitle>
          </DialogHeader>
          {editando && (
            <EditPartidoDialog
              partido={editando}
              jugadores={jugadores}
              onSave={data => editMutation.mutate(data)}
              onClose={() => setEditando(null)}
              loading={editMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog confirmar borrar */}
      <Dialog open={!!confirmDelete} onOpenChange={v => !v && setConfirmDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar partido</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600">
            ¿Seguro que querés eliminar el partido del{' '}
            <strong>{confirmDelete ? formatFecha(confirmDelete.fecha) : ''}</strong>?
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancelar</Button>
            <Button
              variant="destructive"
              onClick={() => deleteMutation.mutate(confirmDelete!.id)}
              disabled={deleteMutation.isPending}
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
