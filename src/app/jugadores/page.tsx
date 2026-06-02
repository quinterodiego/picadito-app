'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, UserCheck, UserX, Bone, Shield, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import type { Jugador, NivelJugador } from '@/lib/types';

const NIVELES: NivelJugador[] = ['bajo', 'semi-medio', 'medio', 'semi-alto', 'alto'];

const NIVEL_CONFIG: Record<NivelJugador, { label: string; color: string }> = {
  'bajo':      { label: 'Bajo',      color: 'bg-blue-100 text-blue-700 border-blue-200' },
  'semi-medio':{ label: 'Semi Medio',color: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
  'medio':     { label: 'Medio',     color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  'semi-alto': { label: 'Semi Alto', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  'alto':      { label: 'Alto',      color: 'bg-red-100 text-red-700 border-red-200' },
};

function nivelColor(nivel: NivelJugador) {
  return NIVEL_CONFIG[nivel].color;
}

function nivelLabel(nivel: NivelJugador) {
  return NIVEL_CONFIG[nivel].label;
}

function JugadorForm({
  initial,
  onSave,
  onClose,
  loading,
}: {
  initial?: Partial<Jugador>;
  onSave: (data: { nombre: string; apodo: string; nivel: NivelJugador; activo: boolean; lesionado: boolean; esArquero: boolean; puedeAtajarProximo: boolean }) => void;
  onClose: () => void;
  loading: boolean;
}) {
  const [nombre, setNombre] = useState(initial?.nombre ?? '');
  const [apodo, setApodo] = useState(initial?.apodo ?? '');
  const [nivel, setNivel] = useState<NivelJugador>(initial?.nivel ?? 'medio');
  const [activo, setActivo] = useState(initial?.activo ?? true);
  const [lesionado, setLesionado] = useState(initial?.lesionado ?? false);
  const [esArquero, setEsArquero] = useState(initial?.esArquero ?? false);
  const [puedeAtajarProximo, setPuedeAtajarProximo] = useState(initial?.puedeAtajarProximo ?? false);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Nombre</Label>
          <Input
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            placeholder="ej: Martín"
            className="mt-1"
            autoFocus
          />
        </div>
        <div>
          <Label>Apodo <span className="text-slate-400 font-normal">(opcional)</span></Label>
          <Input
            value={apodo}
            onChange={e => setApodo(e.target.value)}
            placeholder="ej: El Toro"
            className="mt-1"
          />
        </div>
      </div>
      <div>
        <Label>Nivel</Label>
        <div className="grid grid-cols-2 gap-2 mt-1">
          {NIVELES.map((n, i) => (
            <button
              key={n}
              onClick={() => setNivel(n)}
              className={`cursor-pointer py-2 rounded-lg text-sm font-bold border transition-all ${
                NIVELES.length % 2 !== 0 && i === NIVELES.length - 1 ? 'col-span-2' : ''
              } ${
                nivel === n
                  ? nivelColor(n) + ' ring-2 ring-offset-1 ring-current'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
              }`}
            >
              {nivelLabel(n)}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center gap-2">
          <input type="checkbox" id="activo" checked={activo} onChange={e => setActivo(e.target.checked)} className="w-4 h-4" />
          <Label htmlFor="activo" className="cursor-pointer">Activo</Label>
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="esArquero" checked={esArquero} onChange={e => setEsArquero(e.target.checked)} className="w-4 h-4 accent-violet-600" />
          <Label htmlFor="esArquero" className="cursor-pointer flex items-center gap-1.5">
            <Shield size={14} className="text-violet-600" /> Es arquero
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="puedeAtajar" checked={puedeAtajarProximo} onChange={e => setPuedeAtajarProximo(e.target.checked)} className="w-4 h-4 accent-blue-500" />
          <Label htmlFor="puedeAtajar" className="cursor-pointer flex items-center gap-1.5">
            <ShieldAlert size={14} className="text-blue-500" /> Podría atajar el próximo partido
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="lesionado" checked={lesionado} onChange={e => setLesionado(e.target.checked)} className="w-4 h-4 accent-orange-500" />
          <Label htmlFor="lesionado" className="cursor-pointer flex items-center gap-1.5">
            <Bone size={14} className="text-orange-500" /> Lesionado
          </Label>
        </div>
      </div>
      <DialogFooter className="gap-2">
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
        <Button
          onClick={() => onSave({ nombre: nombre.trim(), apodo: apodo.trim(), nivel, activo, lesionado, esArquero, puedeAtajarProximo })}
          disabled={!nombre.trim() || loading}
        >
          {loading ? 'Guardando...' : 'Guardar'}
        </Button>
      </DialogFooter>
    </div>
  );
}

export default function JugadoresPage() {
  const [openForm, setOpenForm] = useState(false);
  const [editando, setEditando] = useState<Jugador | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Jugador | null>(null);
  const qc = useQueryClient();

  const { data: jugadores = [], isLoading } = useQuery<Jugador[]>({
    queryKey: ['jugadores'],
    queryFn: () => axios.get('/api/jugadores').then(r => r.data),
  });

  const addMutation = useMutation({
    mutationFn: (data: { nombre: string; apodo: string; nivel: NivelJugador; activo: boolean; lesionado: boolean; esArquero: boolean; puedeAtajarProximo: boolean }) =>
      axios.post('/api/jugadores', data),
    onSuccess: () => {
      toast.success('Jugador agregado');
      qc.invalidateQueries({ queryKey: ['jugadores'] });
      setOpenForm(false);
    },
    onError: () => toast.error('Error al agregar jugador'),
  });

  const editMutation = useMutation({
    mutationFn: (data: { nombre: string; apodo: string; nivel: NivelJugador; activo: boolean; lesionado: boolean; esArquero: boolean; puedeAtajarProximo: boolean }) =>
      axios.put(`/api/jugadores/${editando!.id}`, data),
    onSuccess: () => {
      toast.success('Jugador actualizado');
      qc.invalidateQueries({ queryKey: ['jugadores'] });
      setEditando(null);
    },
    onError: () => toast.error('Error al actualizar jugador'),
  });

  const toggleActivoMutation = useMutation({
    mutationFn: (j: Jugador) =>
      axios.put(`/api/jugadores/${j.id}`, { ...j, activo: !j.activo }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['jugadores'] }),
    onError: () => toast.error('Error al actualizar jugador'),
  });

  const toggleLesionadoMutation = useMutation({
    mutationFn: (j: Jugador) =>
      axios.put(`/api/jugadores/${j.id}`, { ...j, lesionado: !j.lesionado }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['jugadores'] }),
    onError: () => toast.error('Error al actualizar jugador'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => axios.delete(`/api/jugadores/${id}`),
    onSuccess: () => {
      toast.success('Jugador eliminado');
      qc.invalidateQueries({ queryKey: ['jugadores'] });
      setConfirmDelete(null);
    },
    onError: () => toast.error('Error al eliminar jugador'),
  });

  const activos = jugadores.filter(j => j.activo);
  const inactivos = jugadores.filter(j => !j.activo);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Jugadores</h1>
        <Button size="sm" className="gap-1.5 bg-green-600 hover:bg-green-700" onClick={() => setOpenForm(true)}>
          <Plus size={15} /> Agregar
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-400 text-center py-8">Cargando...</p>
      ) : (
        <>
          <p className="text-sm text-slate-500">{activos.length} activos · {inactivos.length} inactivos</p>

          <div className="space-y-2">
            {activos.map(j => (
              <Card key={j.id} className={j.lesionado ? 'border-orange-200 bg-orange-50/40' : ''}>
                <CardContent className="py-3 px-4 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="font-medium truncate">{j.apodo || j.nombre}</p>
                      {j.apodo && <p className="text-xs text-slate-400 truncate">({j.nombre})</p>}
                      {j.esArquero && <Shield size={13} className="text-violet-500 shrink-0" />}
                      {j.puedeAtajarProximo && <ShieldAlert size={13} className="text-blue-500 shrink-0" />}
                      {j.lesionado && <Bone size={13} className="text-orange-500 shrink-0" />}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`text-xs font-semibold px-1.5 py-0.5 rounded border ${nivelColor(j.nivel)}`}>
                        {nivelLabel(j.nivel)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => toggleLesionadoMutation.mutate(j)}
                      className={`cursor-pointer p-1.5 rounded-lg transition-colors ${j.lesionado ? 'text-orange-500 bg-orange-100 hover:bg-orange-200' : 'text-slate-300 hover:bg-slate-100 hover:text-orange-400'}`}
                      title={j.lesionado ? 'Quitar lesión' : 'Marcar lesionado'}
                    >
                      <Bone size={15} />
                    </button>
                    <button
                      onClick={() => toggleActivoMutation.mutate(j)}
                      className="cursor-pointer p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                      title="Desactivar"
                    >
                      <UserX size={16} />
                    </button>
                    <button
                      onClick={() => setEditando(j)}
                      className="cursor-pointer p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => setConfirmDelete(j)}
                      className="cursor-pointer p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {inactivos.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Inactivos</p>
              {inactivos.map(j => (
                <Card key={j.id} className="opacity-50">
                  <CardContent className="py-3 px-4 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate text-slate-500">{j.nombre}</p>
                      <span className={`text-xs font-semibold px-1.5 py-0.5 rounded border ${nivelColor(j.nivel)}`}>
                        {j.nivel}
                      </span>
                    </div>
                    <button
                      onClick={() => toggleActivoMutation.mutate(j)}
                      className="cursor-pointer p-1.5 rounded-lg hover:bg-green-50 text-slate-400 hover:text-green-600"
                      title="Activar"
                    >
                      <UserCheck size={16} />
                    </button>
                    <button
                      onClick={() => setConfirmDelete(j)}
                      className="cursor-pointer p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Dialog agregar */}
      <Dialog open={openForm} onOpenChange={setOpenForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo jugador</DialogTitle>
          </DialogHeader>
          <JugadorForm
            onSave={data => addMutation.mutate(data)}
            onClose={() => setOpenForm(false)}
            loading={addMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog editar */}
      <Dialog open={!!editando} onOpenChange={v => !v && setEditando(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar jugador</DialogTitle>
          </DialogHeader>
          {editando && (
            <JugadorForm
              initial={editando}
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
            <DialogTitle>Eliminar jugador</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600">
            ¿Seguro que querés eliminar a <strong>{confirmDelete?.nombre}</strong>? Esta acción no se puede deshacer.
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
