'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Trophy, TrendingUp, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Jugador, Partido } from '@/lib/types';

function useData() {
  const jugadoresQ = useQuery<Jugador[]>({
    queryKey: ['jugadores'],
    queryFn: () => axios.get('/api/jugadores').then(r => r.data),
  });
  const partidosQ = useQuery<Partido[]>({
    queryKey: ['partidos'],
    queryFn: () => axios.get('/api/partidos').then(r => r.data),
  });
  return { jugadores: jugadoresQ.data ?? [], partidos: partidosQ.data ?? [], loading: jugadoresQ.isLoading || partidosQ.isLoading };
}

function calcStats(jugadores: Jugador[], partidos: Partido[]) {
  const jugMap = new Map(jugadores.map(j => [j.id, j]));

  const stats = new Map<string, {
    jugador: Jugador;
    jugados: number;
    victorias: number;
    derrotas: number;
    empates: number;
    golesFavor: number;
    golesContra: number;
    companeros: Map<string, number>;
    rivales: Map<string, number>;
  }>();

  for (const j of jugadores) {
    stats.set(j.id, {
      jugador: j,
      jugados: 0,
      victorias: 0,
      derrotas: 0,
      empates: 0,
      golesFavor: 0,
      golesContra: 0,
      companeros: new Map(),
      rivales: new Map(),
    });
  }

  for (const p of partidos) {
    const tieneResultado = p.goles1 != null && p.goles2 != null;
    const resultado = tieneResultado
      ? (p.goles1 === p.goles2 ? 'empate' : p.goles1! > p.goles2! ? 'a' : 'b')
      : null;

    const procesarEquipo = (ids: string[], rival: string[], gf: number, gc: number) => {
      for (const id of ids) {
        const s = stats.get(id);
        if (!s) continue;
        s.jugados++;
        if (tieneResultado) {
          s.golesFavor += gf;
          s.golesContra += gc;
          if (resultado === 'empate') s.empates++;
          else if ((resultado === 'a' && gf > gc) || (resultado === 'b' && gc > gf)) s.victorias++;
          else s.derrotas++;
        }
        for (const comp of ids) {
          if (comp !== id) s.companeros.set(comp, (s.companeros.get(comp) ?? 0) + 1);
        }
        for (const riv of rival) {
          s.rivales.set(riv, (s.rivales.get(riv) ?? 0) + 1);
        }
      }
    };

    procesarEquipo(p.equipo1, p.equipo2, p.goles1 ?? 0, p.goles2 ?? 0);
    procesarEquipo(p.equipo2, p.equipo1, p.goles2 ?? 0, p.goles1 ?? 0);
  }

  return Array.from(stats.values())
    .filter(s => s.jugados > 0)
    .sort((a, b) => b.victorias - a.victorias || b.jugados - a.jugados);
}

function pct(v: number, total: number) {
  return total === 0 ? 0 : Math.round((v / total) * 100);
}

function WinBar({ victorias, empates, derrotas }: { victorias: number; empates: number; derrotas: number }) {
  const total = victorias + empates + derrotas;
  if (total === 0) return null;
  return (
    <div className="flex h-1.5 rounded-full overflow-hidden w-full">
      <div style={{ width: `${pct(victorias, total)}%` }} className="bg-green-500" />
      <div style={{ width: `${pct(empates, total)}%` }} className="bg-slate-300" />
      <div style={{ width: `${pct(derrotas, total)}%` }} className="bg-red-400" />
    </div>
  );
}

export default function EstadisticasPage() {
  const { jugadores, partidos, loading } = useData();
  const jugMap = useMemo(() => new Map(jugadores.map(j => [j.id, j])), [jugadores]);
  const stats = useMemo(() => calcStats(jugadores, partidos), [jugadores, partidos]);

  if (loading) return <p className="text-sm text-slate-400 text-center py-8">Cargando...</p>;

  if (partidos.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Estadísticas</h1>
        <p className="text-sm text-slate-400 text-center py-8">
          Registrá partidos para ver las estadísticas.
        </p>
      </div>
    );
  }

  const topAsistencia = [...stats].sort((a, b) => b.jugados - a.jugados).slice(0, 5);
  const topGanadores = [...stats].sort((a, b) => pct(b.victorias, b.jugados) - pct(a.victorias, a.jugados) || b.jugados - a.jugados).slice(0, 5);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Estadísticas</h1>
      <p className="text-xs text-slate-400">{partidos.length} partidos registrados</p>

      <Tabs defaultValue="jugadores">
        <TabsList className="w-full">
          <TabsTrigger value="jugadores" className="flex-1">Jugadores</TabsTrigger>
          <TabsTrigger value="ranking" className="flex-1">Ranking</TabsTrigger>
          <TabsTrigger value="duplas" className="flex-1">Duplas</TabsTrigger>
        </TabsList>

        {/* Tab: Jugadores */}
        <TabsContent value="jugadores" className="space-y-2 mt-3">
          {stats.map(s => (
            <Card key={s.jugador.id}>
              <CardContent className="py-3 px-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{s.jugador.nombre}</span>
                  <span className="text-xs text-slate-400">{s.jugados} partidos</span>
                </div>
                <WinBar victorias={s.victorias} empates={s.empates} derrotas={s.derrotas} />
                <div className="grid grid-cols-3 text-center text-xs">
                  <div>
                    <p className="font-bold text-green-600">{s.victorias}</p>
                    <p className="text-slate-400">Ganados</p>
                  </div>
                  <div>
                    <p className="font-bold text-slate-500">{s.empates}</p>
                    <p className="text-slate-400">Empates</p>
                  </div>
                  <div>
                    <p className="font-bold text-red-500">{s.derrotas}</p>
                    <p className="text-slate-400">Perdidos</p>
                  </div>
                </div>
                <div className="flex gap-3 text-xs text-slate-500">
                  <span>GF: <strong>{s.golesFavor}</strong></span>
                  <span>GC: <strong>{s.golesContra}</strong></span>
                  <span>+/-: <strong className={s.golesFavor - s.golesContra >= 0 ? 'text-green-600' : 'text-red-500'}>{s.golesFavor - s.golesContra >= 0 ? '+' : ''}{s.golesFavor - s.golesContra}</strong></span>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Tab: Ranking */}
        <TabsContent value="ranking" className="space-y-3 mt-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Trophy size={14} className="text-yellow-500" /> Más victorias (%)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {topGanadores.map((s, i) => (
                <div key={s.jugador.id} className="flex items-center gap-2 text-sm">
                  <span className="w-5 text-slate-400 text-xs">{i + 1}.</span>
                  <span className="flex-1">{s.jugador.nombre}</span>
                  <span className="font-bold text-green-600">{pct(s.victorias, s.jugados)}%</span>
                  <span className="text-xs text-slate-400">({s.jugados}p)</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users size={14} className="text-blue-500" /> Más asistencia
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {topAsistencia.map((s, i) => (
                <div key={s.jugador.id} className="flex items-center gap-2 text-sm">
                  <span className="w-5 text-slate-400 text-xs">{i + 1}.</span>
                  <span className="flex-1">{s.jugador.nombre}</span>
                  <span className="font-bold">{s.jugados}</span>
                  <span className="text-xs text-slate-400">partidos</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp size={14} className="text-green-500" /> Mejor diferencia de goles
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[...stats]
                .filter(s => s.jugados >= 2)
                .sort((a, b) => (b.golesFavor - b.golesContra) - (a.golesFavor - a.golesContra))
                .slice(0, 5)
                .map((s, i) => {
                  const diff = s.golesFavor - s.golesContra;
                  return (
                    <div key={s.jugador.id} className="flex items-center gap-2 text-sm">
                      <span className="w-5 text-slate-400 text-xs">{i + 1}.</span>
                      <span className="flex-1">{s.jugador.nombre}</span>
                      <span className={`font-bold ${diff >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {diff >= 0 ? '+' : ''}{diff}
                      </span>
                    </div>
                  );
                })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Duplas */}
        <TabsContent value="duplas" className="space-y-3 mt-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Compañeros más frecuentes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {stats.slice(0, 6).map(s => {
                const top = [...s.companeros.entries()]
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 2);
                if (!top.length) return null;
                return (
                  <div key={s.jugador.id} className="text-sm">
                    <span className="font-medium">{s.jugador.nombre}</span>
                    <span className="text-slate-400"> jugó más con </span>
                    {top.map(([id, veces], i) => (
                      <span key={id}>
                        {i > 0 && <span className="text-slate-300"> y </span>}
                        <span className="font-medium">{jugMap.get(id)?.nombre ?? id}</span>
                        <span className="text-xs text-slate-400"> ({veces}x)</span>
                      </span>
                    ))}
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Rivales más frecuentes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {stats.slice(0, 6).map(s => {
                const top = [...s.rivales.entries()]
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 2);
                if (!top.length) return null;
                return (
                  <div key={s.jugador.id} className="text-sm">
                    <span className="font-medium">{s.jugador.nombre}</span>
                    <span className="text-slate-400"> se enfrentó más a </span>
                    {top.map(([id, veces], i) => (
                      <span key={id}>
                        {i > 0 && <span className="text-slate-300"> y </span>}
                        <span className="font-medium">{jugMap.get(id)?.nombre ?? id}</span>
                        <span className="text-xs text-slate-400"> ({veces}x)</span>
                      </span>
                    ))}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
