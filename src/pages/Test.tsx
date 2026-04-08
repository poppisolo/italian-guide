import { useState } from 'react';
import { useStudenti, useUpdateStudente, useTest, useAddTestBatch, useUpdateTest, type Studente } from '@/hooks/useSupabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Plus, ClipboardCheck, Users, CalendarClock, Loader2 } from 'lucide-react';

const livelli = ['Alfa', 'Pre-A1', 'A1', 'A2', 'B1', 'B2'];

export default function TestPage() {
  const { data: studenti = [], isLoading: loadingS } = useStudenti();
  const { data: tests = [], isLoading: loadingT } = useTest();
  const addTestBatch = useAddTestBatch();
  const updateTest = useUpdateTest();
  const updateStudente = useUpdateStudente();

  const [showNew, setShowNew] = useState(false);
  const [showSession, setShowSession] = useState<string | null>(null); // date string
  const [newDate, setNewDate] = useState('');
  const [selected, setSelected] = useState<string[]>([]); // student IDs
  const [results, setResults] = useState<Record<string, { livello: string; note: string }>>({});

  // Group tests by data_test to create "sessions"
  const sessions = (() => {
    const map = new Map<string, typeof tests>();
    tests.forEach(t => {
      if (!t.data_test) return;
      const key = t.data_test;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    });
    return Array.from(map.entries()).map(([date, records]) => ({
      date,
      records,
      completata: records.every(r => r.livello_assegnato !== null),
    }));
  })();

  // Students awaiting test but NOT convoked
  const convokedStudentIds = tests.filter(t => !t.livello_assegnato).map(t => t.studente_id);
  const studentiAttesaTest = studenti.filter(s => s.stato_scuola === 'In attesa test' && !convokedStudentIds.includes(s.id));
  const studentiConvocati = studenti.filter(s => s.stato_scuola === 'In attesa test' && convokedStudentIds.includes(s.id));
  const studentiAttesaClasse = studenti.filter(s => s.stato_scuola === 'In attesa classe');

  const getConvocationDate = (studentId: string) => {
    const t = tests.find(t => t.studente_id === studentId && !t.livello_assegnato);
    return t?.data_test || '';
  };

  const handleCreateSession = async () => {
    if (!newDate) { toast.error('Seleziona una data'); return; }
    if (selected.length === 0) { toast.error('Seleziona almeno uno studente'); return; }
    try {
      await addTestBatch.mutateAsync(
        selected.map(studentId => ({ studente_id: studentId, data_test: newDate, livello_assegnato: null, note: null }))
      );
      setShowNew(false); setSelected([]); setNewDate('');
      toast.success('Sessione di test creata');
    } catch { toast.error('Errore durante la creazione'); }
  };

  const openSession = (date: string) => {
    const session = sessions.find(s => s.date === date);
    if (!session) return;
    setShowSession(date);
    const r: Record<string, { livello: string; note: string }> = {};
    session.records.forEach(t => {
      r[t.id] = { livello: t.livello_assegnato || 'A1', note: t.note || '' };
    });
    setResults(r);
  };

  const handleSaveResults = async () => {
    const session = sessions.find(s => s.date === showSession);
    if (!session) return;
    const entries = Object.entries(results);
    if (entries.length !== session.records.length) {
      toast.error('Inserisci il livello per tutti gli studenti convocati'); return;
    }
    try {
      for (const [testId, r] of entries) {
        await updateTest.mutateAsync({ id: testId, livello_assegnato: r.livello, note: r.note || null });
        const testRec = session.records.find(t => t.id === testId);
        if (testRec) {
          await updateStudente.mutateAsync({ id: testRec.studente_id, stato_scuola: 'In attesa classe', livello: r.livello });
        }
      }
      setShowSession(null); setResults({});
      toast.success('Risultati salvati. Studenti aggiornati a "In attesa classe"');
    } catch { toast.error('Errore durante il salvataggio'); }
  };

  const futureSessions = sessions.filter(s => !s.completata);
  const pastSessions = sessions.filter(s => s.completata);

  if (loadingS || loadingT) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Gestione Test</h1>
          <p className="text-muted-foreground">Gestisci sessioni di test e risultati</p>
        </div>
        <Button onClick={() => setShowNew(true)} className="gap-2"><Plus className="h-4 w-4" />Nuova Sessione</Button>
      </div>

      {/* Student status cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-destructive">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-destructive" />
              In attesa test ({studentiAttesaTest.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {studentiAttesaTest.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-2">Nessuno studente</p>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {studentiAttesaTest.map(s => (
                  <div key={s.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 text-sm">
                    <span className="font-medium">{s.nome} {s.cognome}</span>
                    <span className="text-muted-foreground text-xs">{s.nazionalita}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-400">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-orange-500" />
              Convocati al test ({studentiConvocati.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {studentiConvocati.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-2">Nessuno studente</p>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {studentiConvocati.map(s => (
                  <div key={s.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 text-sm">
                    <span className="font-medium">{s.nome} {s.cognome}</span>
                    <Badge variant="outline" className="text-xs">{getConvocationDate(s.id)}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              In attesa classe ({studentiAttesaClasse.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {studentiAttesaClasse.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-2">Nessuno studente</p>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {studentiAttesaClasse.map(s => (
                  <div key={s.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 text-sm">
                    <div>
                      <span className="font-medium">{s.nome} {s.cognome}</span>
                      {s.livello && <Badge variant="secondary" className="ml-2 text-xs">{s.livello}</Badge>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Sessions */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Sessioni di Test</h2>

        {futureSessions.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Sessioni in programma</h3>
            {futureSessions.map(session => (
              <Card key={session.date} className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-orange-400" onClick={() => openSession(session.date)}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-base">Sessione del {session.date}</CardTitle>
                  <Badge variant="outline">In corso</Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{session.records.length} studenti convocati</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {pastSessions.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Sessioni completate</h3>
            {[...pastSessions].reverse().map(session => (
              <Card key={session.date} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => openSession(session.date)}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-base">Sessione del {session.date}</CardTitle>
                  <Badge variant="default" className="bg-primary">✓ Completata</Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{session.records.length} studenti</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {session.records.map(r => {
                      const s = studenti.find(st => st.id === r.studente_id);
                      return <Badge key={r.id} variant="secondary" className="text-xs">{s?.nome}: {r.livello_assegnato}</Badge>;
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {sessions.length === 0 && (
          <Card><CardContent className="py-8 text-center text-muted-foreground">Nessuna sessione creata</CardContent></Card>
        )}
      </div>

      {/* New Session Dialog */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuova Sessione di Test</DialogTitle>
            <DialogDescription>Seleziona la data e gli studenti da convocare.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>Data del test</Label><Input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} /></div>
            <div>
              <Label>Studenti da convocare</Label>
              <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                {studentiAttesaTest.length === 0 && <p className="text-sm text-muted-foreground">Nessuno studente in attesa di test</p>}
                {studentiAttesaTest.map(s => (
                  <div key={s.id} className="flex items-center gap-3">
                    <Checkbox checked={selected.includes(s.id)} onCheckedChange={(v) => setSelected(prev => v ? [...prev, s.id] : prev.filter(id => id !== s.id))} />
                    <span className="text-sm">{s.nome} {s.cognome} — {s.nazionalita}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>Annulla</Button>
            <Button onClick={handleCreateSession}>Crea Sessione</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Results Dialog */}
      <Dialog open={!!showSession} onOpenChange={() => { setShowSession(null); setResults({}); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Risultati Test — {showSession}</DialogTitle>
            <DialogDescription>{sessions.find(s => s.date === showSession)?.completata ? 'Risultati registrati.' : 'Assegna il livello a ciascuno studente.'}</DialogDescription>
          </DialogHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Studente</TableHead>
                <TableHead>Livello</TableHead>
                <TableHead>Note</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.find(s => s.date === showSession)?.records.map(t => {
                const s = studenti.find(st => st.id === t.studente_id);
                const isComplete = sessions.find(ss => ss.date === showSession)?.completata;
                return (
                  <TableRow key={t.id}>
                    <TableCell>{s?.nome} {s?.cognome}</TableCell>
                    <TableCell>
                      <Select disabled={isComplete} value={results[t.id]?.livello || 'A1'} onValueChange={v => setResults(prev => ({ ...prev, [t.id]: { ...prev[t.id], livello: v } }))}>
                        <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                        <SelectContent>{livelli.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input disabled={isComplete} placeholder="Note..." value={results[t.id]?.note || ''} onChange={e => setResults(prev => ({ ...prev, [t.id]: { ...prev[t.id], note: e.target.value } }))} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowSession(null); setResults({}); }}>Chiudi</Button>
            {!sessions.find(s => s.date === showSession)?.completata && <Button onClick={handleSaveResults}>Salva Risultati</Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
