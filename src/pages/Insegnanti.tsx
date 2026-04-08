import { useState } from 'react';
import { useInsegnanti, useUpdateInsegnante, useDeleteInsegnante, useClassi, useIscrizioni, useDeleteClasse, useDeleteIscrizioniByClasse, useUpdateStudente, useStudenti, type Insegnante } from '@/hooks/useSupabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Calendar, Clock, X, Pencil, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const giorni = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
const livelli = ['Alfa', 'Pre-A1', 'A1', 'A2', 'B1', 'B2'];

export default function Insegnanti() {
  const { data: insegnanti = [], isLoading } = useInsegnanti();
  const { data: classi = [] } = useClassi();
  const { data: iscrizioni = [] } = useIscrizioni();
  const { data: studenti = [] } = useStudenti();
  const updateInsegnante = useUpdateInsegnante();
  const deleteInsegnante = useDeleteInsegnante();
  const deleteClasse = useDeleteClasse();
  const updateStudente = useUpdateStudente();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ nome: '', cognome: '', email: '', telefono: '', dataNascita: '', nazionalita: '', livelloPreferito: '', noteMetodologiche: '', dataScadenzaSocio: '' });
  const [editSlots, setEditSlots] = useState<{ giorno: string; oraInizio: string; oraFine: string }[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const getClassi = (insId: string) => classi.filter(c => c.insegnante_id === insId);

  const isExpiring = (date: string | null) => {
    if (!date) return false;
    const d = new Date(date);
    return (d.getTime() - Date.now()) / (1000 * 60 * 60 * 24) < 60;
  };

  const selected = selectedId ? insegnanti.find(i => i.id === selectedId) : null;
  const selectedClassi = selectedId ? getClassi(selectedId) : [];

  const startEdit = () => {
    if (!selected) return;
    setEditForm({
      nome: selected.nome, cognome: selected.cognome, email: selected.email, telefono: selected.telefono,
      dataNascita: selected.data_nascita || '', nazionalita: selected.nazionalita,
      livelloPreferito: selected.livello_preferito || '', noteMetodologiche: selected.note_metodologiche || '',
      dataScadenzaSocio: selected.data_scadenza_socio || '',
    });
    setEditSlots((selected.disponibilita || []) as any);
    setEditing(true);
  };

  const saveEdit = async () => {
    if (!selectedId || !editForm.nome || !editForm.cognome) { toast.error('Nome e cognome sono obbligatori'); return; }
    try {
      await updateInsegnante.mutateAsync({
        id: selectedId, nome: editForm.nome.trim(), cognome: editForm.cognome.trim(),
        email: editForm.email.trim(), telefono: editForm.telefono.trim(),
        data_nascita: editForm.dataNascita || null, nazionalita: editForm.nazionalita.trim(),
        livello_preferito: editForm.livelloPreferito || null,
        note_metodologiche: editForm.noteMetodologiche, data_scadenza_socio: editForm.dataScadenzaSocio || null,
        disponibilita: editSlots,
      });
      setEditing(false);
      toast.success('Insegnante aggiornato');
    } catch { toast.error('Errore durante il salvataggio'); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      // Reset students from teacher's classes
      const teacherClassi = classi.filter(c => c.insegnante_id === deleteId);
      for (const c of teacherClassi) {
        const classStudents = iscrizioni.filter(ic => ic.classe_id === c.id).map(ic => ic.studente_id);
        for (const sid of classStudents) {
          await updateStudente.mutateAsync({ id: sid, stato_scuola: 'In attesa classe' });
        }
        await deleteClasse.mutateAsync(c.id);
      }
      await deleteInsegnante.mutateAsync(deleteId);
      toast.success('Insegnante eliminato');
      setDeleteId(null); setSelectedId(null); setEditing(false);
    } catch { toast.error('Errore durante l\'eliminazione'); }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Insegnanti Volontari</h1>
        <p className="text-muted-foreground">{insegnanti.length} volontari registrati</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {insegnanti.map(v => {
          const slots = (v.disponibilita || []) as any[];
          const expiring = isExpiring(v.data_scadenza_socio);
          return (
            <Card key={v.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => { setSelectedId(v.id); setEditing(false); }}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{v.nome} {v.cognome}</CardTitle>
                  {v.livello_preferito && <Badge variant="secondary">{v.livello_preferito}</Badge>}
                </div>
                <CardDescription>{v.email}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {v.note_metodologiche && <p className="text-sm">{v.note_metodologiche}</p>}
                <div>
                  <p className="text-sm font-medium flex items-center gap-1 mb-1"><Clock className="h-3.5 w-3.5" />Disponibilità</p>
                  <div className="flex flex-wrap gap-1">
                    {slots.map((s: any, i: number) => (
                      <Badge key={i} variant="outline" className="text-xs">{s.giorno} {s.oraInizio}–{s.oraFine}</Badge>
                    ))}
                  </div>
                </div>
                <div className={`text-xs flex items-center gap-1 ${expiring ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                  <Calendar className="h-3.5 w-3.5" />
                  Scadenza tessera: {v.data_scadenza_socio || '—'}
                  {expiring && ' ⚠ In scadenza'}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedId} onOpenChange={(open) => { if (!open) { setSelectedId(null); setEditing(false); } }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selected?.nome} {selected?.cognome}</DialogTitle>
            <DialogDescription>{selected?.email} — {selected?.telefono}</DialogDescription>
          </DialogHeader>

          {!editing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Email:</span> {selected?.email || '—'}</div>
                <div><span className="text-muted-foreground">Telefono:</span> {selected?.telefono || '—'}</div>
                <div><span className="text-muted-foreground">Data nascita:</span> {selected?.data_nascita || '—'}</div>
                <div><span className="text-muted-foreground">Nazionalità:</span> {selected?.nazionalita || '—'}</div>
              </div>

              {selected?.livello_preferito && <p className="text-sm"><span className="text-muted-foreground">Livello preferito:</span> <Badge variant="secondary">{selected.livello_preferito}</Badge></p>}
              {selected?.note_metodologiche && <p className="text-sm"><span className="text-muted-foreground">Note metodologiche:</span> {selected.note_metodologiche}</p>}
              {selected?.data_scadenza_socio && (
                <div className={`text-sm flex items-center gap-1 ${isExpiring(selected.data_scadenza_socio) ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                  <Calendar className="h-3.5 w-3.5" />
                  Scadenza tessera: {selected.data_scadenza_socio}
                  {isExpiring(selected.data_scadenza_socio) && ' ⚠ In scadenza'}
                </div>
              )}

              {selectedClassi.length > 0 && (
                <div className="space-y-1">
                  <p className="font-medium text-sm">Classi assegnate</p>
                  {selectedClassi.map(c => (
                    <Badge key={c.id} variant="secondary" className="mr-1">{c.nome} — {c.giorno_settimana} {c.orario_inizio}</Badge>
                  ))}
                </div>
              )}

              <div className="space-y-2">
                <p className="font-medium text-sm flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Disponibilità Orarie</p>
                <div className="flex flex-wrap gap-1">
                  {(!selected?.disponibilita || (selected.disponibilita as any[]).length === 0) && <span className="text-sm text-muted-foreground">Nessuna disponibilità</span>}
                  {(selected?.disponibilita as any[] || []).map((s: any, i: number) => (
                    <Badge key={i} variant="outline" className="text-xs">{s.giorno} {s.oraInizio}–{s.oraFine}</Badge>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t">
                <Button onClick={startEdit} className="gap-2"><Pencil className="h-4 w-4" />Modifica</Button>
                <Button variant="destructive" onClick={() => selectedId && setDeleteId(selectedId)} className="gap-2"><Trash2 className="h-4 w-4" />Elimina</Button>
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Livello preferito</Label>
                  <Select value={editForm.livelloPreferito || 'none'} onValueChange={v => setEditForm({ ...editForm, livelloPreferito: v === 'none' ? '' : v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nessuna preferenza</SelectItem>
                      {livelli.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Scadenza tessera</Label><Input type="date" value={editForm.dataScadenzaSocio} onChange={e => setEditForm({ ...editForm, dataScadenzaSocio: e.target.value })} /></div>
              </div>
              <div><Label>Note metodologiche</Label><Input value={editForm.noteMetodologiche} onChange={e => setEditForm({ ...editForm, noteMetodologiche: e.target.value })} /></div>

              <div>
                <Label>Disponibilità Orarie</Label>
                <div className="space-y-2 mt-1">
                  {editSlots.map((slot, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Select value={slot.giorno} onValueChange={v => { const u = [...editSlots]; u[i] = { ...u[i], giorno: v }; setEditSlots(u); }}>
                        <SelectTrigger className="w-28 h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>{giorni.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                      </Select>
                      <Input type="time" value={slot.oraInizio} onChange={e => { const u = [...editSlots]; u[i] = { ...u[i], oraInizio: e.target.value }; setEditSlots(u); }} className="w-24 h-8 text-xs" />
                      <span className="text-xs text-muted-foreground">–</span>
                      <Input type="time" value={slot.oraFine} onChange={e => { const u = [...editSlots]; u[i] = { ...u[i], oraFine: e.target.value }; setEditSlots(u); }} className="w-24 h-8 text-xs" />
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setEditSlots(editSlots.filter((_, idx) => idx !== i))}><X className="h-3 w-3" /></Button>
                    </div>
                  ))}
                  <Button size="sm" variant="outline" onClick={() => setEditSlots([...editSlots, { giorno: 'Lunedì', oraInizio: '09:00', oraFine: '11:00' }])} className="text-xs">+ Aggiungi slot</Button>
                </div>
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
            <AlertDialogTitle>Eliminare l'insegnante?</AlertDialogTitle>
            <AlertDialogDescription>L'insegnante verrà rimosso e le classi assegnate saranno eliminate. Gli studenti iscritti torneranno in stato "In attesa classe".</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Elimina</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
