import { useState } from 'react';
import { useStore } from '@/data/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Check, Clock, X } from 'lucide-react';
import type { StatoPresenza } from '@/data/types';

export default function Registro() {
  const { utenti, classi, lezioni, setLezioni, iscrizioniClassi, presenze, setPresenze, profiliStudenti } = useStore();

  // Simulate "today's teacher" as teacher 102 (Giulia)
  const currentTeacherId = 102;
  const todayLessons = lezioni.filter(l => l.idInsegnanteEffettivo === currentTeacherId);

  const getUtente = (id: number) => utenti.find(u => u.id === id);
  const getClasse = (id: number) => classi.find(c => c.id === id);
  const getStudentsForClass = (classId: number) => {
    return iscrizioniClassi.filter(ic => ic.idClasse === classId).map(ic => {
      const u = getUtente(ic.idStudente);
      const p = profiliStudenti.find(ps => ps.idUtente === ic.idStudente);
      return { ...ic, utente: u, profilo: p };
    });
  };

  const [argomenti, setArgomenti] = useState<Record<number, string>>(() => {
    const init: Record<number, string> = {};
    todayLessons.forEach(l => { init[l.id] = l.argomentoTrattato || ''; });
    return init;
  });

  const [localPresenze, setLocalPresenze] = useState<Record<string, { stato: StatoPresenza; minuti: number }>>(() => {
    const init: Record<string, { stato: StatoPresenza; minuti: number }> = {};
    presenze.forEach(p => { init[`${p.idLezione}-${p.idStudente}`] = { stato: p.stato, minuti: p.minutiRitardo || 0 }; });
    return init;
  });

  const togglePresenza = (lezioneId: number, studenteId: number, stato: StatoPresenza) => {
    const key = `${lezioneId}-${studenteId}`;
    setLocalPresenze(prev => ({ ...prev, [key]: { stato, minuti: stato === 'Ritardo' ? (prev[key]?.minuti || 5) : 0 } }));
  };

  const setMinutiRitardo = (lezioneId: number, studenteId: number, minuti: number) => {
    const key = `${lezioneId}-${studenteId}`;
    setLocalPresenze(prev => ({ ...prev, [key]: { ...prev[key], minuti } }));
  };

  const handleSave = (lezioneId: number) => {
    // Save argomento
    setLezioni(prev => prev.map(l => l.id === lezioneId ? { ...l, argomentoTrattato: argomenti[lezioneId] || '' } : l));

    // Save presenze
    const lezionePresenze = Object.entries(localPresenze)
      .filter(([key]) => key.startsWith(`${lezioneId}-`))
      .map(([key, val]) => ({
        idLezione: lezioneId,
        idStudente: parseInt(key.split('-')[1]),
        stato: val.stato,
        minutiRitardo: val.stato === 'Ritardo' ? val.minuti : undefined,
      }));

    setPresenze(prev => {
      const without = prev.filter(p => p.idLezione !== lezioneId);
      return [...without, ...lezionePresenze];
    });

    toast.success('Registro salvato con successo');
  };

  const teacher = getUtente(currentTeacherId);

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Registro</h1>
        <p className="text-muted-foreground">Benvenuto/a, {teacher?.nome} {teacher?.cognome}</p>
      </div>

      {todayLessons.length === 0 && (
        <Card><CardContent className="py-8 text-center text-muted-foreground">Nessuna lezione prevista per oggi</CardContent></Card>
      )}

      {todayLessons.map(lezione => {
        const classe = getClasse(lezione.idClasse);
        const students = getStudentsForClass(lezione.idClasse);

        return (
          <Card key={lezione.id}>
            <CardHeader>
              <CardTitle className="text-lg">{classe?.nomeClasse}</CardTitle>
              <p className="text-sm text-muted-foreground">{lezione.dataLezione} — {classe?.oraInizio}–{classe?.oraFine}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Appello */}
              <div className="space-y-3">
                <p className="font-medium text-sm">Appello</p>
                {students.map(({ idStudente, utente }) => {
                  const key = `${lezione.id}-${idStudente}`;
                  const current = localPresenze[key];
                  return (
                    <div key={idStudente} className="flex flex-col gap-2 p-3 rounded-lg bg-muted/30">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{utente?.nome} {utente?.cognome}</span>
                        <div className="flex gap-1">
                          <Button size="sm" variant={current?.stato === 'Presente' ? 'default' : 'outline'}
                            onClick={() => togglePresenza(lezione.id, idStudente, 'Presente')} className="h-8 w-8 p-0">
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant={current?.stato === 'Ritardo' ? 'default' : 'outline'}
                            onClick={() => togglePresenza(lezione.id, idStudente, 'Ritardo')}
                            className={`h-8 w-8 p-0 ${current?.stato === 'Ritardo' ? 'bg-[hsl(33,76%,51%)] hover:bg-[hsl(33,76%,45%)]' : ''}`}>
                            <Clock className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant={current?.stato === 'Assente' ? 'destructive' : 'outline'}
                            onClick={() => togglePresenza(lezione.id, idStudente, 'Assente')} className="h-8 w-8 p-0">
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {current?.stato === 'Ritardo' && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Minuti di ritardo:</span>
                          <Input type="number" min={1} max={120} value={current.minuti} onChange={e => setMinutiRitardo(lezione.id, idStudente, parseInt(e.target.value) || 0)} className="w-20 h-7 text-sm" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Diario di bordo */}
              <div>
                <p className="font-medium text-sm mb-2">Diario di bordo</p>
                <Textarea placeholder="Argomento trattato, note sulla lezione..." value={argomenti[lezione.id] || ''}
                  onChange={e => setArgomenti(prev => ({ ...prev, [lezione.id]: e.target.value }))} rows={3} />
              </div>

              <Button onClick={() => handleSave(lezione.id)} className="w-full">Salva Registro</Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
