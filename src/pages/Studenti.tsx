import { useState } from 'react';
import { useStore } from '@/data/store';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { StatusBadge } from '@/components/StatusBadge';
import { toast } from 'sonner';
import { Plus, Search, X, Clock, Pencil, Trash2 } from 'lucide-react';
import type { Utente, ProfiloStudente, Giorno } from '@/data/types';

const giorni: Giorno[] = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];

export default function Studenti() {
  const { utenti, setUtenti, profiliStudenti, setProfiliStudenti, lingueParlate, setLingueParlate, disponibilita, setDisponibilita, classi, iscrizioniClassi, setIscrizioniClassi, sessioniTest } = useStore();
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [showDetail, setShowDetail] = useState<number | null>(null);
  const [privacy, setPrivacy] = useState(false);
  const [form, setForm] = useState({ nome: '', cognome: '', email: '', telefono: '', dataNascita: '', nazionalita: '', lingue: '' });
  const [newSlots, setNewSlots] = useState<{ giorno: Giorno; oraInizio: string; oraFine: string }[]>([]);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ nome: '', cognome: '', email: '', telefono: '', dataNascita: '', nazionalita: '', lingue: '', noteDidattiche: '' });
  const [editSlots, setEditSlots] = useState<{ giorno: Giorno; oraInizio: string; oraFine: string }[]>([]);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const studenti = utenti.filter(u => !u.isVolontario);
  const filtered = studenti.filter(s => {
    const q = search.toLowerCase();
    const lingue = lingueParlate.filter(l => l.idUtente === s.id).map(l => l.lingua).join(' ');
    return s.nome.toLowerCase().includes(q) || s.cognome.toLowerCase().includes(q) || s.nazionalita.toLowerCase().includes(q) || lingue.toLowerCase().includes(q);
  });

  const getProfilo = (idUtente: number) => profiliStudenti.find(p => p.idUtente === idUtente);
  const getLingue = (idUtente: number) => lingueParlate.filter(l => l.idUtente === idUtente).map(l => l.lingua);
  const getDisp = (idUtente: number) => disponibilita.filter(d => d.idUtente === idUtente);

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
      setLingueParlate(prev => [...prev, ...form.lingue.split(',').map(l => ({ idUtente: newId, lingua: l.trim() }))]);
    }
    if (newSlots.length > 0) {
      const maxDispId = Math.max(...disponibilita.map(d => d.id), 0);
      setDisponibilita(prev => [...prev, ...newSlots.map((s, i) => ({ id: maxDispId + i + 1, idUtente: newId, ...s }))]);
    }
    setShowAdd(false);
    setForm({ nome: '', cognome: '', email: '', telefono: '', dataNascita: '', nazionalita: '', lingue: '' });
    setNewSlots([]);
    setPrivacy(false);
    toast.success(`${newUtente.nome} ${newUtente.cognome} aggiunto/a con successo`);
  };

  const detailUser = showDetail ? utenti.find(u => u.id === showDetail) : null;
  const detailProfilo = showDetail ? getProfilo(showDetail) : null;
  const detailSlots = showDetail ? getDisp(showDetail) : [];
  const detailClassi = showDetail ? iscrizioniClassi.filter(ic => ic.idStudente === showDetail).map(ic => classi.find(c => c.id === ic.idClasse)).filter(Boolean) : [];
  const detailTests = showDetail ? sessioniTest.filter(s => s.studentiConvocati.includes(showDetail)) : [];

  const startEdit = () => {
    if (!detailUser) return;
    const lingue = showDetail ? getLingue(showDetail).join(', ') : '';
    setEditForm({
      nome: detailUser.nome, cognome: detailUser.cognome, email: detailUser.email, telefono: detailUser.telefono,
      dataNascita: detailUser.dataNascita, nazionalita: detailUser.nazionalita, lingue,
      noteDidattiche: detailProfilo?.noteDidattiche || '',
    });
    setEditSlots(detailSlots.map(s => ({ giorno: s.giorno, oraInizio: s.oraInizio, oraFine: s.oraFine })));
    setEditing(true);
  };

  const saveEdit = () => {
    if (!showDetail || !editForm.nome || !editForm.cognome) { toast.error('Nome e cognome sono obbligatori'); return; }
    setUtenti(prev => prev.map(u => u.id === showDetail ? {
      ...u, nome: editForm.nome.trim(), cognome: editForm.cognome.trim(), email: editForm.email.trim(),
      telefono: editForm.telefono.trim(), dataNascita: editForm.dataNascita, nazionalita: editForm.nazionalita.trim(),
    } : u));
    // Update lingue
    setLingueParlate(prev => {
      const without = prev.filter(l => l.idUtente !== showDetail);
      const newL = editForm.lingue.split(',').map(l => l.trim()).filter(Boolean).map(l => ({ idUtente: showDetail, lingua: l }));
      return [...without, ...newL];
    });
    // Update note didattiche
    setProfiliStudenti(prev => prev.map(p => p.idUtente === showDetail ? { ...p, noteDidattiche: editForm.noteDidattiche || undefined } : p));
    // Update disponibilità
    const withoutOld = disponibilita.filter(d => d.idUtente !== showDetail);
    const maxId = Math.max(...disponibilita.map(d => d.id), 0);
    const newDisps = editSlots.map((s, i) => ({ id: maxId + i + 1, idUtente: showDetail, ...s }));
    setDisponibilita([...withoutOld, ...newDisps]);
    setEditing(false);
    toast.success('Studente aggiornato');
  };

  const handleDelete = () => {
    if (!deleteId) return;
    setUtenti(prev => prev.filter(u => u.id !== deleteId));
    setProfiliStudenti(prev => prev.filter(p => p.idUtente !== deleteId));
    setLingueParlate(prev => prev.filter(l => l.idUtente !== deleteId));
    setDisponibilita(prev => prev.filter(d => d.idUtente !== deleteId));
    setIscrizioniClassi(prev => prev.filter(ic => ic.idStudente !== deleteId));
    toast.success('Studente eliminato');
    setDeleteId(null);
    setShowDetail(null);
    setEditing(false);
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
                <TableRow key={s.id} className="cursor-pointer hover:bg-muted/50" onClick={() => { setShowDetail(s.id); setEditing(false); }}>
                  <TableCell className="font-medium">{s.nome} {s.cognome}</TableCell>
                  <TableCell className="hidden sm:table-cell">{s.nazionalita}</TableCell>
                  <TableCell className="hidden md:table-cell">{getLingue(s.id).join(', ') || '—'}</TableCell>
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

      {/* Detail Dialog */}
      <Dialog open={!!showDetail} onOpenChange={(open) => { if (!open) { setShowDetail(null); setEditing(false); } }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{detailUser?.nome} {detailUser?.cognome}</DialogTitle>
            <DialogDescription>{detailUser?.nazionalita} — Iscritto il {detailUser?.dataIscrizione}</DialogDescription>
          </DialogHeader>

          {!editing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Email:</span> {detailUser?.email || '—'}</div>
                <div><span className="text-muted-foreground">Telefono:</span> {detailUser?.telefono || '—'}</div>
                <div><span className="text-muted-foreground">Data nascita:</span> {detailUser?.dataNascita || '—'}</div>
                <div><span className="text-muted-foreground">Nazionalità:</span> {detailUser?.nazionalita || '—'}</div>
                <div className="col-span-2"><span className="text-muted-foreground">Lingue:</span> {showDetail ? getLingue(showDetail).join(', ') || '—' : '—'}</div>
              </div>

              {detailProfilo && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">Stato:</span>
                    <StatusBadge stato={detailProfilo.statoScuola} />
                  </div>
                  {detailProfilo.livelloRaggiunto && <p className="text-sm"><span className="text-muted-foreground">Livello:</span> {detailProfilo.livelloRaggiunto}</p>}
                  {detailProfilo.dataUltimoTest && <p className="text-sm"><span className="text-muted-foreground">Ultimo test:</span> {detailProfilo.dataUltimoTest}</p>}
                  {detailProfilo.noteDidattiche && <p className="text-sm"><span className="text-muted-foreground">Note:</span> {detailProfilo.noteDidattiche}</p>}
                </div>
              )}

              <div className="space-y-2">
                <p className="font-medium text-sm flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Disponibilità Orarie</p>
                <div className="flex flex-wrap gap-1">
                  {detailSlots.length === 0 && <span className="text-sm text-muted-foreground">Nessuna disponibilità</span>}
                  {detailSlots.map(s => (
                    <Badge key={s.id} variant="outline" className="text-xs">{s.giorno} {s.oraInizio}–{s.oraFine}</Badge>
                  ))}
                </div>
              </div>

              {detailClassi.length > 0 && (
                <div className="space-y-1">
                  <p className="font-medium text-sm">Classi</p>
                  {detailClassi.map(c => c && (
                    <Badge key={c.id} variant="secondary" className="mr-1">{c.nomeClasse} — {c.giorno} {c.oraInizio}</Badge>
                  ))}
                </div>
              )}

              {detailTests.length > 0 && (
                <div className="space-y-1">
                  <p className="font-medium text-sm">Storico Test</p>
                  {detailTests.map(t => {
                    const res = t.risultati.find(r => r.idStudente === showDetail);
                    return (
                      <p key={t.id} className="text-sm text-muted-foreground">
                        {t.data} — {res ? `Livello: ${res.livello}` : 'Convocato'} {res?.note ? `(${res.note})` : ''}
                      </p>
                    );
                  })}
                </div>
              )}

              <div className="flex gap-2 pt-2 border-t">
                <Button onClick={startEdit} className="gap-2"><Pencil className="h-4 w-4" />Modifica</Button>
                <Button variant="destructive" onClick={() => showDetail && setDeleteId(showDetail)} className="gap-2"><Trash2 className="h-4 w-4" />Elimina</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Nome *</Label><Input value={editForm.nome} onChange={e => setEditForm({ ...editForm, nome: e.target.value })} /></div>
                <div><Label>Cognome *</Label><Input value={editForm.cognome} onChange={e => setEditForm({ ...editForm, cognome: e.target.value })} /></div>
              </div>
              <div><Label>Email</Label><Input type="email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} /></div>
              <div><Label>Telefono</Label><Input value={editForm.telefono} onChange={e => setEditForm({ ...editForm, telefono: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Data di nascita</Label><Input type="date" value={editForm.dataNascita} onChange={e => setEditForm({ ...editForm, dataNascita: e.target.value })} /></div>
                <div><Label>Nazionalità</Label><Input value={editForm.nazionalita} onChange={e => setEditForm({ ...editForm, nazionalita: e.target.value })} /></div>
              </div>
              <div><Label>Lingue parlate (separate da virgola)</Label><Input value={editForm.lingue} onChange={e => setEditForm({ ...editForm, lingue: e.target.value })} /></div>
              <div><Label>Note didattiche</Label><Input value={editForm.noteDidattiche} onChange={e => setEditForm({ ...editForm, noteDidattiche: e.target.value })} /></div>

              <div>
                <Label>Disponibilità Orarie</Label>
                <AvailabilityEditor slots={editSlots} onChange={setEditSlots} />
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setEditing(false)}>Annulla</Button>
                <Button onClick={saveEdit}>Salva</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare lo studente?</AlertDialogTitle>
            <AlertDialogDescription>Lo studente verrà rimosso da tutte le classi e i dati saranno eliminati definitivamente.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Elimina</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
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
            <div>
              <Label>Disponibilità Orarie</Label>
              <AvailabilityEditor slots={newSlots} onChange={setNewSlots} />
            </div>
            <div className="flex items-start gap-3 p-4 rounded-lg border bg-muted/50">
              <Checkbox id="privacy" checked={privacy} onCheckedChange={(v) => setPrivacy(v === true)} className="mt-0.5" />
              <Label htmlFor="privacy" className="text-sm leading-relaxed cursor-pointer">
                Autorizzo il trattamento dei miei dati personali ai sensi del GDPR (Reg. UE 2016/679) per le finalità didattiche dell'associazione. *
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

function AvailabilityEditor({ slots, onChange }: { slots: { giorno: Giorno; oraInizio: string; oraFine: string }[]; onChange: (s: { giorno: Giorno; oraInizio: string; oraFine: string }[]) => void }) {
  const giorni: Giorno[] = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
  return (
    <div className="space-y-2 mt-1">
      {slots.map((slot, i) => (
        <div key={i} className="flex items-center gap-2">
          <Select value={slot.giorno} onValueChange={v => { const u = [...slots]; u[i] = { ...u[i], giorno: v as Giorno }; onChange(u); }}>
            <SelectTrigger className="w-28 h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>{giorni.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
          </Select>
          <Input type="time" value={slot.oraInizio} onChange={e => { const u = [...slots]; u[i] = { ...u[i], oraInizio: e.target.value }; onChange(u); }} className="w-24 h-8 text-xs" />
          <span className="text-xs text-muted-foreground">–</span>
          <Input type="time" value={slot.oraFine} onChange={e => { const u = [...slots]; u[i] = { ...u[i], oraFine: e.target.value }; onChange(u); }} className="w-24 h-8 text-xs" />
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => onChange(slots.filter((_, idx) => idx !== i))}><X className="h-3 w-3" /></Button>
        </div>
      ))}
      <Button size="sm" variant="outline" onClick={() => onChange([...slots, { giorno: 'Lunedì', oraInizio: '09:00', oraFine: '11:00' }])} className="text-xs">+ Aggiungi slot</Button>
    </div>
  );
}
