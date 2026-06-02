'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';
import { Trash2, Trophy, Minus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { Jugador, Partido } from '@/lib/types';

function useJugadoresMap() {
  const { data: jugadores = [] } = useQuery<Jugador[]>({
    queryKey: ['jugadores'],
    queryFn: () => axios.get('/api/jugadores').then(r => r.data),
  });
  return new Map(jugadores.map(j => [j.id, j]));
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

export default function HistorialPage() {
  const [confirmDelete, setConfirmDelete] = useState<Partido | null>(null);
  const qc = useQueryClient();
  const jugadoresMap = useJugadoresMap();

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

  const sorted = [...partidos].sort((a, b) => b.fecha.localeCompare(a.fecha));

  function nombreJugador(id: string) {
    return jugadoresMap.get(id)?.nombre ?? id;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Historial</h1>

      {isLoading ? (
        <p className="text-sm text-slate-400 text-center py-8">Cargando...</p>
      ) : sorted.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-8">
          No hay partidos registrados aún.
        </p>
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
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold tabular-nums text-slate-700">
                      {p.goles1 != null && p.goles2 != null ? `${p.goles1} – ${p.goles2}` : '— —'}
                    </span>
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
                          {nombreJugador(id)}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-2">
                    <p className="font-semibold text-slate-600 mb-1">Equipo B</p>
                    <div className="flex flex-wrap gap-1">
                      {p.equipo2.map(id => (
                        <span key={id} className="bg-white border border-slate-200 px-1.5 py-0.5 rounded-full">
                          {nombreJugador(id)}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {p.notas && (
                  <p className="text-xs text-slate-400 italic">{p.notas}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

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
