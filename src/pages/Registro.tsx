import { useState } from 'react';
import { useClassi, useInsegnanti, useIscrizioni, useStudenti, usePresenze, useUpsertPresenze } from '@/hooks/useSupabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Check, X, Loader2 } from 'lucide-react';

export default function Registro() {
  const { data: classi = [], isLoading: loadingC } = useClassi();
  const { data: insegnanti = [] } = useInsegnanti();
  const { data: iscrizioni = [] } = useIscrizioni();
  const { data: studenti = [] } = useStudenti();
  const { data: presenze = [] } = usePresenze();
  const upsertPresenze = useUpsertPresenze();

  const today = new Date().toISOString().split('T')[0];
  const todayDay = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'][new Date().getDay()];

  const [selectedClasse, setSelectedClasse] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState(today);
  const [localPresenze, setLocalPresenze] = useState<Record<string, boolean>>({});

  const todayClasses = classi.filter(c => c.giorno_settimana === todayDay);
  const activeClasse = classi.find(c => c.id === selectedClasse);
  const classStudents = selectedClasse
    ? iscrizioni.filter(ic => ic.classe_id === selectedClasse && ic.attiva).map(ic => studenti.find(s => s.id === ic.studente_id)).filter(Boolean)
    : [];

  const existingPresenze = presenze.filter(p => p.classe_id === selectedClasse && p.data === selectedDate);

  const getPresenza = (studentId: string) => {
    if (localPresenze[studentId] !== undefined) return localPresenze[studentId];
    const existing = existingPresenze.find(p => p.studente_id === studentId);
    return existing?.presente ?? true;
  };

  const togglePresenza = (studentId: string) => {
    setLocalPresenze(prev => ({ ...prev, [studentId]: !getPresenza(studentId) }));
  };

  const handleSave = async () => {
    if (!selectedClasse || classStudents.length === 0) return;
    try {
      const records = classStudents.map(s => ({
        studente_id: s!.id,
        classe_id: selectedClasse,
        data: selectedDate,
        presente: getPresenza(s!.id),
        note: null,
      }));
      await upsertPresenze.mutateAsync(records);
      setLocalPresenze({});
      toast.success('Presenze salvate con successo');
    } catch { toast.error('Errore durante il salvataggio'); }
  };

  const loading = loadingC;

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Registro</h1>
        <p className="text-muted-foreground">Registra le presenze degli studenti</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Select value={selectedClasse} onValueChange={v => { setSelectedClasse(v); setLocalPresenze({}); }}>
            <SelectTrigger><SelectValue placeholder="Seleziona classe..." /></SelectTrigger>
            <SelectContent>
              {todayClasses.length > 0 && (
                <>
                  <p className="px-2 py-1 text-xs text-muted-foreground font-medium">Classi di oggi ({todayDay})</p>
                  {todayClasses.map(c => {
                    const ins = insegnanti.find(i => i.id === c.insegnante_id);
                    return <SelectItem key={c.id} value={c.id}>{c.nome} ({ins?.nome})</SelectItem>;
                  })}
                </>
              )}
              <p className="px-2 py-1 text-xs text-muted-foreground font-medium">Tutte le classi</p>
              {classi.map(c => {
                const ins = insegnanti.find(i => i.id === c.insegnante_id);
                return <SelectItem key={c.id} value={c.id}>{c.nome} ({ins?.nome}) — {c.giorno_settimana}</SelectItem>;
              })}
            </SelectContent>
          </Select>
        </div>
        <div>
          <input type="date" value={selectedDate} onChange={e => { setSelectedDate(e.target.value); setLocalPresenze({}); }}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
        </div>
      </div>

      {!selectedClasse && (
        <Card><CardContent className="py-8 text-center text-muted-foreground">Seleziona una classe per registrare le presenze</CardContent></Card>
      )}

      {selectedClasse && activeClasse && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{activeClasse.nome}</CardTitle>
            <p className="text-sm text-muted-foreground">{selectedDate} — {activeClasse.orario_inizio}–{activeClasse.orario_fine}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <p className="font-medium text-sm">Appello</p>
              {classStudents.length === 0 && <p className="text-sm text-muted-foreground">Nessuno studente iscritto</p>}
              {classStudents.map(s => {
                if (!s) return null;
                const presente = getPresenza(s.id);
                return (
                  <div key={s.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <span className="font-medium">{s.nome} {s.cognome}</span>
                    <div className="flex gap-1">
                      <Button size="sm" variant={presente ? 'default' : 'outline'}
                        onClick={() => togglePresenza(s.id)} className="h-8 w-8 p-0">
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant={!presente ? 'destructive' : 'outline'}
                        onClick={() => togglePresenza(s.id)} className="h-8 w-8 p-0">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            <Button onClick={handleSave} className="w-full" disabled={classStudents.length === 0}>Salva Presenze</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
