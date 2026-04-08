import { useState } from 'react';
import { useStudenti, useAddStudente, useUpdateStudente, useDeleteStudente, useClassi, useIscrizioni, useTest, type Studente } from '@/hooks/useSupabase';
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
import { Plus, Search, X, Clock, Pencil, Trash2, Loader2 } from 'lucide-react';

type Giorno = 'Lunedì' | 'Martedì' | 'Mercoledì' | 'Giovedì' | 'Venerdì' | 'Sabato';
const giorni: Giorno[] = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];

export default function Studenti() {
  const { data: studenti = [], isLoading } = useStudenti();
  const { data: classi = [] } = useClassi();
  const { data: iscrizioni = [] } = useIscrizioni();
  const { data: tests = [] } = useTest();
  const addStudente = useAddStudente();
  const updateStudente = useUpdateStudente();
  const deleteStudente = useDeleteStudente();

  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [showDetail, setShowDetail] = useState<string | null>(null);
  const [privacy, setPrivacy] = useState(false);
  const [form, setForm] = useState({ nome: '', cognome: '', email: '', telefono: '', dataNascita: '', nazionalita: '', lingue: '' });
  const [newSlots, setNewSlots] = useState<{ giorno: string; oraInizio: string; oraFine: string }[]>([]);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ nome: '', cognome: '', email: '', telefono: '', dataNascita: '', nazionalita: '', lingue: '', note: '' });
  const [editSlots, setEditSlots] = useState<{ giorno: string; oraInizio: string; oraFine: string }[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = studenti.filter(s => {
    const q = search.toLowerCase();
    const lingue = (s.lingue_parlate || []).join(' ');
    return s.nome.toLowerCase().includes(q) || s.cognome.toLowerCase().includes(q) || s.nazionalita.toLowerCase().includes(q) || lingue.toLowerCase().includes(q);
  });

  const handleAdd = async () => {
    if (!privacy) { toast.error('Il consenso privacy è obbligatorio'); return; }
    if (!form.nome || !form.cognome) { toast.error('Nome e cognome sono obbligatori'); return; }
    try {
      await addStudente.mutateAsync({
        nome: form.nome.trim(), cognome: form.cognome.trim(), email: form.email.trim(),
        telefono: form.telefono.trim(), nazionalita: form.nazionalita.trim(),
        data_nascita: form.dataNascita || null,
        lingue_parlate: form.lingue.split(',').map(l => l.trim()).filter(Boolean),
        livello: null, stato_scuola: 'In attesa test', note: '',
        disponibilita: newSlots,
      });
      setShowAdd(false);
      setForm({ nome: '', cognome: '', email: '', telefono: '', dataNascita: '', nazionalita: '', lingue: '' });
      setNewSlots([]);
      setPrivacy(false);
      toast.success('Studente aggiunto con successo');
    } catch { toast.error('Errore durante il salvataggio'); }
  };

  const detailUser = showDetail ? studenti.find(s => s.id === showDetail) : null;
  const detailClassi = showDetail ? iscrizioni.filter(ic => ic.studente_id === showDetail && ic.attiva).map(ic => classi.find(c => c.id === ic.classe_id)).filter(Boolean) : [];
  const detailTests = showDetail ? tests.filter(t => t.studente_id === showDetail) : [];

  const startEdit = () => {
    if (!detailUser) return;
    setEditForm({
      nome: detailUser.nome, cognome: detailUser.cognome, email: detailUser.email, telefono: detailUser.telefono,
      dataNascita: detailUser.data_nascita || '', nazionalita: detailUser.nazionalita,
      lingue: (detailUser.lingue_parlate || []).join(', '), note: detailUser.note || '',
    });
    setEditSlots((detailUser.disponibilita || []) as any);
    setEditing(true);
  };

  const saveEdit = async () => {
    if (!showDetail || !editForm.nome || !editForm.cognome) { toast.error('Nome e cognome sono obbligatori'); return; }
    try {
      await updateStudente.mutateAsync({
        id: showDetail, nome: editForm.nome.trim(), cognome: editForm.cognome.trim(),
        email: editForm.email.trim(), telefono: editForm.telefono.trim(),
        data_nascita: editForm.dataNascita || null, nazionalita: editForm.nazionalita.trim(),
        lingue_parlate: editForm.lingue.split(',').map(l => l.trim()).filter(Boolean),
        note: editForm.note, disponibilita: editSlots,
      });
      setEditing(false);
      toast.success('Studente aggiornato');
    } catch { toast.error('Errore durante il salvataggio'); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteStudente.mutateAsync(deleteId);
      toast.success('Studente eliminato');
      setDeleteId(null); setShowDetail(null); setEditing(false);
    } catch { toast.error('Errore durante l\'eliminazione'); }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

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
            {filtered.map(s => (
              <TableRow key={s.id} className="cursor-pointer hover:bg-muted/50" onClick={() => { setShowDetail(s.id); setEditing(false); }}>
                <TableCell className="font-medium">{s.nome} {s.cognome}</TableCell>
                <TableCell className="hidden sm:table-cell">{s.nazionalita}</TableCell>
                <TableCell className="hidden md:table-cell">{(s.lingue_parlate || []).join(', ') || '—'}</TableCell>
                <TableCell className="hidden md:table-cell">{s.livello || '—'}</TableCell>
                <TableCell><StatusBadge stato={s.stato_scuola as any} /></TableCell>
              </TableRow>
            ))}
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
            <DialogDescription>{detailUser?.nazionalita}</DialogDescription>
          </DialogHeader>

          {!editing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Email:</span> {detailUser?.email || '—'}</div>
                <div><span className="text-muted-foreground">Telefono:</span> {detailUser?.telefono || '—'}</div>
                <div><span className="text-muted-foreground">Data nascita:</span> {detailUser?.data_nascita || '—'}</div>
                <div><span className="text-muted-foreground">Nazionalità:</span> {detailUser?.nazionalita || '—'}</div>
                <div className="col-span-2"><span className="text-muted-foreground">Lingue:</span> {(detailUser?.lingue_parlate || []).join(', ') || '—'}</div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">Stato:</span>
                  <StatusBadge stato={detailUser?.stato_scuola as any} />
                </div>
                {detailUser?.livello && <p className="text-sm"><span className="text-muted-foreground">Livello:</span> {detailUser.livello}</p>}
                {detailUser?.note && <p className="text-sm"><span className="text-muted-foreground">Note:</span> {detailUser.note}</p>}
              </div>

              <div className="space-y-2">
                <p className="font-medium text-sm flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Disponibilità Orarie</p>
                <div className="flex flex-wrap gap-1">
                  {(!detailUser?.disponibilita || (detailUser.disponibilita as any[]).length === 0) && <span className="text-sm text-muted-foreground">Nessuna disponibilità</span>}
                  {(detailUser?.disponibilita as any[] || []).map((s: any, i: number) => (
                    <Badge key={i} variant="outline" className="text-xs">{s.giorno} {s.oraInizio}–{s.oraFine}</Badge>
                  ))}
                </div>
              </div>

              {detailClassi.length > 0 && (
                <div className="space-y-1">
                  <p className="font-medium text-sm">Classi</p>
                  {detailClassi.map(c => c && (
                    <Badge key={c.id} variant="secondary" className="mr-1">{c.nome} — {c.giorno_settimana} {c.orario_inizio}</Badge>
                  ))}
                </div>
              )}

              {detailTests.length > 0 && (
                <div className="space-y-1">
                  <p className="font-medium text-sm">Storico Test</p>
                  {detailTests.map(t => (
                    <p key={t.id} className="text-sm text-muted-foreground">
                      {t.data_test} — {t.livello_assegnato ? `Livello: ${t.livello_assegnato}` : 'Convocato'} {t.note ? `(${t.note})` : ''}
                    </p>
                  ))}
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
              <div><Label>Note</Label><Input value={editForm.note} onChange={e => setEditForm({ ...editForm, note: e.target.value })} /></div>

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

function AvailabilityEditor({ slots, onChange }: { slots: { giorno: string; oraInizio: string; oraFine: string }[]; onChange: (s: { giorno: string; oraInizio: string; oraFine: string }[]) => void }) {
  return (
    <div className="space-y-2 mt-1">
      {slots.map((slot, i) => (
        <div key={i} className="flex items-center gap-2">
          <Select value={slot.giorno} onValueChange={v => { const u = [...slots]; u[i] = { ...u[i], giorno: v }; onChange(u); }}>
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
