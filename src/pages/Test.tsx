import { useState } from 'react';
import { useStore } from '@/data/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Plus, ClipboardCheck } from 'lucide-react';
import type { Livello, SessioneTest } from '@/data/types';

const livelli: Livello[] = ['Alfa', 'Pre-A1', 'A1', 'A2', 'B1', 'B2'];

export default function TestPage() {
  const { utenti, profiliStudenti, setProfiliStudenti, sessioniTest, setSessioniTest } = useStore();
  const [showNew, setShowNew] = useState(false);
  const [showResult, setShowResult] = useState<SessioneTest | null>(null);
  const [newDate, setNewDate] = useState('');
  const [selected, setSelected] = useState<number[]>([]);
  const [results, setResults] = useState<Record<number, { livello: Livello; note: string }>>({});

  const studentiAttesaTest = profiliStudenti.filter(p => p.statoScuola === 'In attesa test');
  const getUtente = (idUtente: number) => utenti.find(u => u.id === idUtente);

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
      if (res) {
        return { ...p, statoScuola: 'In attesa classe' as const, livelloRaggiunto: res.livello, dataUltimoTest: session.data, noteDidattiche: res.note };
      }
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Gestione Test</h1>
          <p className="text-muted-foreground">{studentiAttesaTest.length} studenti in attesa di test</p>
        </div>
        <Button onClick={() => setShowNew(true)} className="gap-2"><Plus className="h-4 w-4" />Nuova Sessione</Button>
      </div>

      <div className="grid gap-4">
        {sessioniTest.length === 0 && (
          <Card><CardContent className="py-8 text-center text-muted-foreground">Nessuna sessione di test creata</CardContent></Card>
        )}
        {[...sessioniTest].reverse().map(session => (
          <Card key={session.id}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Sessione del {session.data}</CardTitle>
              {session.completata
                ? <span className="text-sm text-primary font-medium">✓ Completata</span>
                : <Button size="sm" variant="outline" onClick={() => openResults(session)} className="gap-2"><ClipboardCheck className="h-4 w-4" />Inserisci Risultati</Button>
              }
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{session.studentiConvocati.length} studenti convocati</p>
              {session.completata && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {session.risultati.map(r => {
                    const u = getUtente(r.idStudente);
                    return <span key={r.idStudente} className="text-xs bg-muted px-2 py-1 rounded">{u?.nome} {u?.cognome}: {r.livello}</span>;
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
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
                      <Checkbox checked={selected.includes(p.id)} onCheckedChange={(v) => {
                        setSelected(prev => v ? [...prev, p.id] : prev.filter(id => id !== p.id));
                      }} />
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
            <DialogDescription>Assegna il livello a ciascuno studente.</DialogDescription>
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
                      <Select value={results[idStudente]?.livello || 'A1'} onValueChange={v => setResults(prev => ({ ...prev, [idStudente]: { ...prev[idStudente], livello: v as Livello } }))}>
                        <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                        <SelectContent>{livelli.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input placeholder="Note..." value={results[idStudente]?.note || ''} onChange={e => setResults(prev => ({ ...prev, [idStudente]: { ...prev[idStudente], note: e.target.value } }))} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowResult(null); setResults({}); }}>Annulla</Button>
            {!showResult?.completata && <Button onClick={() => showResult && handleSaveResults(showResult)}>Salva Risultati</Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
