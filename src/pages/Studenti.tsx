import { useState } from 'react';
import { useStore } from '@/data/store';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { StatusBadge } from '@/components/StatusBadge';
import { toast } from 'sonner';
import { Plus, Search } from 'lucide-react';
import type { Utente, ProfiloStudente } from '@/data/types';

export default function Studenti() {
  const { utenti, setUtenti, profiliStudenti, setProfiliStudenti, lingueParlate, setLingueParlate } = useStore();
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [form, setForm] = useState({ nome: '', cognome: '', email: '', telefono: '', dataNascita: '', nazionalita: '', lingue: '' });

  const studenti = utenti.filter(u => !u.isVolontario);
  const filtered = studenti.filter(s => {
    const q = search.toLowerCase();
    const lingue = lingueParlate.filter(l => l.idUtente === s.id).map(l => l.lingua).join(' ');
    return s.nome.toLowerCase().includes(q) || s.cognome.toLowerCase().includes(q) || s.nazionalita.toLowerCase().includes(q) || lingue.toLowerCase().includes(q);
  });

  const getProfilo = (idUtente: number) => profiliStudenti.find(p => p.idUtente === idUtente);
  const getLingue = (idUtente: number) => lingueParlate.filter(l => l.idUtente === idUtente).map(l => l.lingua).join(', ');

  const handleAdd = () => {
    if (!privacy) { toast.error('Il consenso privacy è obbligatorio'); return; }
    if (!form.nome || !form.cognome) { toast.error('Nome e cognome sono obbligatori'); return; }

    const newId = Math.max(...utenti.map(u => u.id), 0) + 1;
    const newUtente: Utente = {
      id: newId, nome: form.nome.trim(), cognome: form.cognome.trim(), email: form.email.trim(), telefono: form.telefono.trim(),
      dataNascita: form.dataNascita, nazionalita: form.nazionalita.trim(), dataIscrizione: new Date().toISOString().split('T')[0],
      consensoPrivacy: true, isSocio: false, isVolontario: false,
    };
    const newProfilo: ProfiloStudente = { id: profiliStudenti.length + 1, idUtente: newId, statoScuola: 'In attesa test' };

    setUtenti(prev => [...prev, newUtente]);
    setProfiliStudenti(prev => [...prev, newProfilo]);
    if (form.lingue.trim()) {
      const newLingue = form.lingue.split(',').map(l => ({ idUtente: newId, lingua: l.trim() }));
      setLingueParlate(prev => [...prev, ...newLingue]);
    }
    setShowAdd(false);
    setForm({ nome: '', cognome: '', email: '', telefono: '', dataNascita: '', nazionalita: '', lingue: '' });
    setPrivacy(false);
    toast.success(`${newUtente.nome} ${newUtente.cognome} aggiunto/a con successo`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Studenti</h1>
          <p className="text-muted-foreground">{studenti.length} studenti registrati</p>
        </div>
        <Button onClick={() => setShowAdd(true)} className="gap-2"><Plus className="h-4 w-4" />Nuovo Studente</Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Cerca per nome, nazionalità, lingua..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead className="hidden sm:table-cell">Nazionalità</TableHead>
              <TableHead className="hidden md:table-cell">Lingue</TableHead>
              <TableHead className="hidden md:table-cell">Livello</TableHead>
              <TableHead>Stato</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(s => {
              const profilo = getProfilo(s.id);
              return (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.nome} {s.cognome}</TableCell>
                  <TableCell className="hidden sm:table-cell">{s.nazionalita}</TableCell>
                  <TableCell className="hidden md:table-cell">{getLingue(s.id) || '—'}</TableCell>
                  <TableCell className="hidden md:table-cell">{profilo?.livelloRaggiunto || '—'}</TableCell>
                  <TableCell>{profilo && <StatusBadge stato={profilo.statoScuola} />}</TableCell>
                </TableRow>
              );
            })}
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nessuno studente trovato</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nuovo Studente</DialogTitle>
            <DialogDescription>Inserisci i dati dello studente. Il consenso privacy è obbligatorio.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Nome *</Label><Input value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} /></div>
              <div><Label>Cognome *</Label><Input value={form.cognome} onChange={e => setForm({...form, cognome: e.target.value})} /></div>
            </div>
            <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></div>
            <div><Label>Telefono</Label><Input value={form.telefono} onChange={e => setForm({...form, telefono: e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Data di nascita</Label><Input type="date" value={form.dataNascita} onChange={e => setForm({...form, dataNascita: e.target.value})} /></div>
              <div><Label>Nazionalità</Label><Input value={form.nazionalita} onChange={e => setForm({...form, nazionalita: e.target.value})} /></div>
            </div>
            <div><Label>Lingue parlate (separate da virgola)</Label><Input placeholder="es. Arabo, Francese" value={form.lingue} onChange={e => setForm({...form, lingue: e.target.value})} /></div>
            <div className="flex items-start gap-3 p-4 rounded-lg border bg-muted/50">
              <Checkbox id="privacy" checked={privacy} onCheckedChange={(v) => setPrivacy(v === true)} className="mt-0.5" />
              <Label htmlFor="privacy" className="text-sm leading-relaxed cursor-pointer">
                Autorizzo il trattamento dei miei dati personali ai sensi del GDPR (Reg. UE 2016/679) per le finalità didattiche dell'associazione SEMI FORESTI. *
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Annulla</Button>
            <Button onClick={handleAdd} disabled={!privacy}>Salva Studente</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
