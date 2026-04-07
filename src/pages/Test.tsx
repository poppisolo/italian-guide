import { useState } from 'react';
import { useStore } from '@/data/store';
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
import { StatusBadge } from '@/components/StatusBadge';
import { toast } from 'sonner';
import { Plus, ClipboardCheck, Users, CalendarClock } from 'lucide-react';
import type { Livello, SessioneTest } from '@/data/types';

const livelli: Livello[] = ['Alfa', 'Pre-A1', 'A1', 'A2', 'B1', 'B2'];

export default function TestPage() {
  const { utenti, profiliStudenti, setProfiliStudenti, sessioniTest, setSessioniTest } = useStore();
  const [showNew, setShowNew] = useState(false);
  const [showResult, setShowResult] = useState<SessioneTest | null>(null);
  const [newDate, setNewDate] = useState('');
  const [selected, setSelected] = useState<number[]>([]);
  const [results, setResults] = useState<Record<number, { livello: Livello; note: string }>>({});

  const getUtente = (idUtente: number) => utenti.find(u => u.id === idUtente);

  // Students awaiting test but NOT yet convoked to any future session
  const convokedStudentIds = sessioniTest.filter(s => !s.completata).flatMap(s => s.studentiConvocati);
  const studentiAttesaTest = profiliStudenti.filter(p => p.statoScuola === 'In attesa test' && !convokedStudentIds.includes(p.idUtente));
  const studentiConvocati = profiliStudenti.filter(p => p.statoScuola === 'In attesa test' && convokedStudentIds.includes(p.idUtente));
  const studentiAttesaClasse = profiliStudenti.filter(p => p.statoScuola === 'In attesa classe');

  const getConvocationDate = (idUtente: number) => {
    const session = sessioniTest.find(s => !s.completata && s.studentiConvocati.includes(idUtente));
    return session?.data || '';
  };

  const handleCreateSession = () => {
    if (!newDate) { toast.error('Seleziona una data'); return; }
    if (selected.length === 0) { toast.error('Seleziona almeno uno studente'); return; }
    const newSession: SessioneTest = {
      id: Math.max(...sessioniTest.map(s => s.id), 0) + 1,
      data: newDate,
      studentiConvocati: selected.map(profId => {
        const p = profiliStudenti.find(ps => ps.id === profId);
        return p!.idUtente;
      }),
      risultati: [],
      completata: false,
    };
    setSessioniTest(prev => [...prev, newSession]);
    setShowNew(false);
    setSelected([]);
    setNewDate('');
    toast.success('Sessione di test creata');
  };

  const handleSaveResults = (session: SessioneTest) => {
    const risultati = Object.entries(results).map(([idStr, r]) => ({
      idStudente: parseInt(idStr), livello: r.livello, note: r.note || undefined,
    }));
    if (risultati.length !== session.studentiConvocati.length) {
      toast.error('Inserisci il livello per tutti gli studenti convocati');
      return;
    }
    setSessioniTest(prev => prev.map(s => s.id === session.id ? { ...s, risultati, completata: true } : s));
    setProfiliStudenti(prev => prev.map(p => {
      const res = risultati.find(r => r.idStudente === p.idUtente);
      if (res) return { ...p, statoScuola: 'In attesa classe' as const, livelloRaggiunto: res.livello, dataUltimoTest: session.data, noteDidattiche: res.note };
      return p;
    }));
    setShowResult(null);
    setResults({});
    toast.success('Risultati salvati. Studenti aggiornati a "In attesa classe"');
  };

  const openResults = (session: SessioneTest) => {
    setShowResult(session);
    if (session.completata) {
      const r: Record<number, { livello: Livello; note: string }> = {};
      session.risultati.forEach(res => { r[res.idStudente] = { livello: res.livello, note: res.note || '' }; });
      setResults(r);
    } else {
      const r: Record<number, { livello: Livello; note: string }> = {};
      session.studentiConvocati.forEach(id => { r[id] = { livello: 'A1', note: '' }; });
      setResults(r);
    }
  };

  const futureSessions = sessioniTest.filter(s => !s.completata);
  const pastSessions = sessioniTest.filter(s => s.completata);

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
                {studentiAttesaTest.map(p => {
                  const u = getUtente(p.idUtente);
                  return (
                    <div key={p.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 text-sm">
                      <span className="font-medium">{u?.nome} {u?.cognome}</span>
                      <span className="text-muted-foreground text-xs">{u?.nazionalita}</span>
                    </div>
                  );
                })}
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
                {studentiConvocati.map(p => {
                  const u = getUtente(p.idUtente);
                  const date = getConvocationDate(p.idUtente);
                  return (
                    <div key={p.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 text-sm">
                      <span className="font-medium">{u?.nome} {u?.cognome}</span>
                      <Badge variant="outline" className="text-xs">{date}</Badge>
                    </div>
                  );
                })}
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
                {studentiAttesaClasse.map(p => {
                  const u = getUtente(p.idUtente);
                  return (
                    <div key={p.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 text-sm">
                      <div>
                        <span className="font-medium">{u?.nome} {u?.cognome}</span>
                        {p.livelloRaggiunto && <Badge variant="secondary" className="ml-2 text-xs">{p.livelloRaggiunto}</Badge>}
                      </div>
                      <span className="text-muted-foreground text-xs">{p.dataUltimoTest}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Test Sessions */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Sessioni di Test</h2>

        {futureSessions.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Sessioni in programma</h3>
            {futureSessions.map(session => (
              <Card key={session.id} className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-orange-400" onClick={() => openResults(session)}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-base">Sessione del {session.data}</CardTitle>
                  <Badge variant="outline">In corso</Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{session.studentiConvocati.length} studenti convocati</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {pastSessions.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Sessioni completate</h3>
            {[...pastSessions].reverse().map(session => (
              <Card key={session.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => openResults(session)}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-base">Sessione del {session.data}</CardTitle>
                  <Badge variant="default" className="bg-primary">✓ Completata</Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{session.studentiConvocati.length} studenti convocati</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {session.risultati.map(r => {
                      const u = getUtente(r.idStudente);
                      return <Badge key={r.idStudente} variant="secondary" className="text-xs">{u?.nome}: {r.livello}</Badge>;
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {sessioniTest.length === 0 && (
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
                {studentiAttesaTest.map(p => {
                  const u = getUtente(p.idUtente);
                  return (
                    <div key={p.id} className="flex items-center gap-3">
                      <Checkbox checked={selected.includes(p.id)} onCheckedChange={(v) => setSelected(prev => v ? [...prev, p.id] : prev.filter(id => id !== p.id))} />
                      <span className="text-sm">{u?.nome} {u?.cognome} — {u?.nazionalita}</span>
                    </div>
                  );
                })}
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
      <Dialog open={!!showResult} onOpenChange={() => { setShowResult(null); setResults({}); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Risultati Test — {showResult?.data}</DialogTitle>
            <DialogDescription>{showResult?.completata ? 'Risultati registrati.' : 'Assegna il livello a ciascuno studente.'}</DialogDescription>
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
              {showResult?.studentiConvocati.map(idStudente => {
                const u = getUtente(idStudente);
                return (
                  <TableRow key={idStudente}>
                    <TableCell>{u?.nome} {u?.cognome}</TableCell>
                    <TableCell>
                      <Select disabled={showResult.completata} value={results[idStudente]?.livello || 'A1'} onValueChange={v => setResults(prev => ({ ...prev, [idStudente]: { ...prev[idStudente], livello: v as Livello } }))}>
                        <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                        <SelectContent>{livelli.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input disabled={showResult.completata} placeholder="Note..." value={results[idStudente]?.note || ''} onChange={e => setResults(prev => ({ ...prev, [idStudente]: { ...prev[idStudente], note: e.target.value } }))} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowResult(null); setResults({}); }}>Chiudi</Button>
            {!showResult?.completata && <Button onClick={() => showResult && handleSaveResults(showResult)}>Salva Risultati</Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
