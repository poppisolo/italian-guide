import { useState } from 'react';
import { useStore } from '@/data/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import type { Giorno } from '@/data/types';

const giorni: Giorno[] = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];

export default function PlannerSettimanale() {
  const { classi, tavoli, utenti, iscrizioniClassi } = useStore();
  const [filterTavolo, setFilterTavolo] = useState<string>('all');

  const getUtente = (id: number) => utenti.find(u => u.id === id);
  const getTavolo = (id: number) => tavoli.find(t => t.id === id);
  const getStudentCount = (classId: number) => iscrizioniClassi.filter(ic => ic.idClasse === classId).length;

  const filteredClassi = filterTavolo === 'all'
    ? classi
    : classi.filter(c => c.idTavolo === parseInt(filterTavolo));

  const getClassiForDay = (giorno: Giorno) =>
    filteredClassi.filter(c => c.giorno === giorno);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Planner Settimanale</h1>
          <p className="text-muted-foreground">{classi.length} classi attive</p>
        </div>
        <div className="w-56">
          <Select value={filterTavolo} onValueChange={setFilterTavolo}>
            <SelectTrigger>
              <SelectValue placeholder="Filtra per tavolo..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti i tavoli</SelectItem>
              {tavoli.map(t => (
                <SelectItem key={t.id} value={t.id.toString()}>{t.nomeTavolo}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {giorni.map(giorno => {
          const classiGiorno = getClassiForDay(giorno);
          return (
            <div key={giorno} className="space-y-2">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider px-1">{giorno}</h3>
              {classiGiorno.length === 0 ? (
                <div className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
                  Nessuna classe
                </div>
              ) : (
                classiGiorno.map(classe => {
                  const teacher = getUtente(classe.idInsegnante);
                  const tavolo = getTavolo(classe.idTavolo);
                  const studentCount = getStudentCount(classe.id);
                  return (
                    <Card key={classe.id} className="shadow-sm">
                      <CardHeader className="p-3 pb-1">
                        <CardTitle className="text-sm leading-tight">{classe.nomeClasse}</CardTitle>
                      </CardHeader>
                      <CardContent className="p-3 pt-1 space-y-1.5">
                        <p className="text-xs text-muted-foreground">{classe.oraInizio}–{classe.oraFine}</p>
                        <Badge variant="secondary" className="text-xs">{classe.livelloTarget}</Badge>
                        <p className="text-xs">👤 {teacher?.nome} {teacher?.cognome}</p>
                        <p className="text-xs text-muted-foreground">📍 {tavolo?.nomeTavolo}</p>
                        <p className="text-xs text-muted-foreground">🎓 {studentCount} studenti</p>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
