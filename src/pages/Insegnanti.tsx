import { useState } from 'react';
import { useStore } from '@/data/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Calendar, Clock, X, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Giorno, Livello } from '@/data/types';

const giorni: Giorno[] = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
const livelli: Livello[] = ['Alfa', 'Pre-A1', 'A1', 'A2', 'B1', 'B2'];

export default function Insegnanti() {
  const { utenti, setUtenti, profiliVolontari, setProfiliVolontari, disponibilita, setDisponibilita, classi, iscrizioniClassi, setIscrizioniClassi, setClassi, setProfiliStudenti } = useStore();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ nome: '', cognome: '', email: '', telefono: '', dataNascita: '', nazionalita: '', livelloPreferito: '' as string, noteMetodologiche: '', dataScadenzaSocio: '' });
  const [editSlots, setEditSlots] = useState<{ giorno: Giorno; oraInizio: string; oraFine: string }[]>([]);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const getUtente = (id: number) => utenti.find(u => u.id === id);
  const getDisp = (idUtente: number) => disponibilita.filter(d => d.idUtente === idUtente);
  const getClassi = (idInsegnante: number) => classi.filter(c => c.idInsegnante === idInsegnante);

  const isExpiring = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    return (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24) < 60;
  };

  const selectedVol = selectedId ? profiliVolontari.find(v => v.idUtente === selectedId) : null;
  const selectedUser = selectedId ? getUtente(selectedId) : null;
  const selectedSlots = selectedId ? getDisp(selectedId) : [];
  const selectedClassi = selectedId ? getClassi(selectedId) : [];

  const startEdit = () => {
    if (!selectedUser || !selectedVol) return;
    setEditForm({
      nome: selectedUser.nome, cognome: selectedUser.cognome, email: selectedUser.email, telefono: selectedUser.telefono,
      dataNascita: selectedUser.dataNascita, nazionalita: selectedUser.nazionalita,
      livelloPreferito: selectedVol.livelloPreferito || '', noteMetodologiche: selectedVol.noteMetodologiche || '',
      dataScadenzaSocio: selectedVol.dataScadenzaSocio,
    });
    setEditSlots(selectedSlots.map(s => ({ giorno: s.giorno, oraInizio: s.oraInizio, oraFine: s.oraFine })));
    setEditing(true);
  };

  const saveEdit = () => {
    if (!selectedId || !editForm.nome || !editForm.cognome) { toast.error('Nome e cognome sono obbligatori'); return; }
    setUtenti(prev => prev.map(u => u.id === selectedId ? {
      ...u, nome: editForm.nome.trim(), cognome: editForm.cognome.trim(), email: editForm.email.trim(),
      telefono: editForm.telefono.trim(), dataNascita: editForm.dataNascita, nazionalita: editForm.nazionalita.trim(),
    } : u));
    setProfiliVolontari(prev => prev.map(v => v.idUtente === selectedId ? {
      ...v, livelloPreferito: (editForm.livelloPreferito as Livello) || undefined,
      noteMetodologiche: editForm.noteMetodologiche || undefined, dataScadenzaSocio: editForm.dataScadenzaSocio,
    } : v));
    const withoutOld = disponibilita.filter(d => d.idUtente !== selectedId);
    const maxId = Math.max(...disponibilita.map(d => d.id), 0);
    const newDisps = editSlots.map((s, i) => ({ id: maxId + i + 1, idUtente: selectedId, ...s }));
    setDisponibilita([...withoutOld, ...newDisps]);
    setEditing(false);
    toast.success('Insegnante aggiornato');
  };

  const handleDelete = () => {
    if (!deleteId) return;
    const teacherClassi = classi.filter(c => c.idInsegnante === deleteId);
    const affectedStudents = iscrizioniClassi.filter(ic => teacherClassi.some(c => c.id === ic.idClasse)).map(ic => ic.idStudente);
    setClassi(prev => prev.filter(c => c.idInsegnante !== deleteId));
    setIscrizioniClassi(prev => prev.filter(ic => !teacherClassi.some(c => c.id === ic.idClasse)));
    setProfiliStudenti(prev => prev.map(p => affectedStudents.includes(p.idUtente) ? { ...p, statoScuola: 'In attesa classe' as const } : p));
    setUtenti(prev => prev.filter(u => u.id !== deleteId));
    setProfiliVolontari(prev => prev.filter(v => v.idUtente !== deleteId));
    setDisponibilita(prev => prev.filter(d => d.idUtente !== deleteId));
    toast.success(`Insegnante eliminato. ${teacherClassi.length} classi rimosse.`);
    setDeleteId(null);
    setSelectedId(null);
    setEditing(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Insegnanti Volontari</h1>
        <p className="text-muted-foreground">{profiliVolontari.length} volontari registrati</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {profiliVolontari.map(v => {
          const u = getUtente(v.idUtente);
          const slots = getDisp(v.idUtente);
          const expiring = isExpiring(v.dataScadenzaSocio);
          return (
            <Card key={v.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => { setSelectedId(v.idUtente); setEditing(false); }}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{u?.nome} {u?.cognome}</CardTitle>
                  {v.livelloPreferito && <Badge variant="secondary">{v.livelloPreferito}</Badge>}
                </div>
                <CardDescription>{u?.email}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {v.noteMetodologiche && <p className="text-sm">{v.noteMetodologiche}</p>}
                <div>
                  <p className="text-sm font-medium flex items-center gap-1 mb-1"><Clock className="h-3.5 w-3.5" />Disponibilità</p>
                  <div className="flex flex-wrap gap-1">
                    {slots.map(s => (
                      <Badge key={s.id} variant="outline" className="text-xs">{s.giorno} {s.oraInizio}–{s.oraFine}</Badge>
                    ))}
                  </div>
                </div>
                <div className={`text-xs flex items-center gap-1 ${expiring ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                  <Calendar className="h-3.5 w-3.5" />
                  Scadenza tessera: {v.dataScadenzaSocio}
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
            <DialogTitle>{selectedUser?.nome} {selectedUser?.cognome}</DialogTitle>
            <DialogDescription>{selectedUser?.email} — {selectedUser?.telefono}</DialogDescription>
          </DialogHeader>

          {!editing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Email:</span> {selectedUser?.email || '—'}</div>
                <div><span className="text-muted-foreground">Telefono:</span> {selectedUser?.telefono || '—'}</div>
                <div><span className="text-muted-foreground">Data nascita:</span> {selectedUser?.dataNascita || '—'}</div>
                <div><span className="text-muted-foreground">Nazionalità:</span> {selectedUser?.nazionalita || '—'}</div>
              </div>

              {selectedVol && (
                <>
                  {selectedVol.livelloPreferito && <p className="text-sm"><span className="text-muted-foreground">Livello preferito:</span> <Badge variant="secondary">{selectedVol.livelloPreferito}</Badge></p>}
                  {selectedVol.noteMetodologiche && <p className="text-sm"><span className="text-muted-foreground">Note metodologiche:</span> {selectedVol.noteMetodologiche}</p>}
                  <div className={`text-sm flex items-center gap-1 ${isExpiring(selectedVol.dataScadenzaSocio) ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                    <Calendar className="h-3.5 w-3.5" />
                    Scadenza tessera: {selectedVol.dataScadenzaSocio}
                    {isExpiring(selectedVol.dataScadenzaSocio) && ' ⚠ In scadenza'}
                  </div>
                </>
              )}

              {selectedClassi.length > 0 && (
                <div className="space-y-1">
                  <p className="font-medium text-sm">Classi assegnate</p>
                  {selectedClassi.map(c => (
                    <Badge key={c.id} variant="secondary" className="mr-1">{c.nomeClasse} — {c.giorno} {c.oraInizio}</Badge>
                  ))}
                </div>
              )}

              <div className="space-y-2">
                <p className="font-medium text-sm flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Disponibilità Orarie</p>
                <div className="flex flex-wrap gap-1">
                  {selectedSlots.length === 0 && <span className="text-sm text-muted-foreground">Nessuna disponibilità</span>}
                  {selectedSlots.map(s => (
                    <Badge key={s.id} variant="outline" className="text-xs">{s.giorno} {s.oraInizio}–{s.oraFine}</Badge>
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
                      <Select value={slot.giorno} onValueChange={v => { const u = [...editSlots]; u[i] = { ...u[i], giorno: v as Giorno }; setEditSlots(u); }}>
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
