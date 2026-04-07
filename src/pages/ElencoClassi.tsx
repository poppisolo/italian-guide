import { useState } from 'react';
import { useStore } from '@/data/store';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Pencil, Trash2, ArrowUpDown } from 'lucide-react';
import type { Classe, Livello, Giorno } from '@/data/types';

type SortField = 'nomeClasse' | 'insegnante' | 'livelloTarget' | 'studenti' | 'giorno';
const livelli: Livello[] = ['Alfa', 'Pre-A1', 'A1', 'A2', 'B1', 'B2'];
const giorni: Giorno[] = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];

export default function ElencoClassi() {
  const { classi, setClassi, utenti, tavoli, iscrizioniClassi, setIscrizioniClassi, setProfiliStudenti, profiliVolontari } = useStore();
  const [filterInsegnante, setFilterInsegnante] = useState('all');
  const [filterLivello, setFilterLivello] = useState('all');
  const [sortField, setSortField] = useState<SortField>('nomeClasse');
  const [sortAsc, setSortAsc] = useState(true);
  const [editClass, setEditClass] = useState<Classe | null>(null);
  const [editForm, setEditForm] = useState({ nomeClasse: '', idInsegnante: '', idTavolo: '', giorno: '' as string, oraInizio: '', oraFine: '', livelloTarget: '' as string });
  const [deleteClass, setDeleteClass] = useState<Classe | null>(null);

  const getUtente = (id: number) => utenti.find(u => u.id === id);
  const getTavolo = (id: number) => tavoli.find(t => t.id === id);
  const getStudentCount = (classId: number) => iscrizioniClassi.filter(ic => ic.idClasse === classId).length;

  const insegnanti = profiliVolontari.map(v => getUtente(v.idUtente)).filter(Boolean);

  let filtered = classi.filter(c => {
    if (filterInsegnante !== 'all' && c.idInsegnante !== parseInt(filterInsegnante)) return false;
    if (filterLivello !== 'all' && c.livelloTarget !== filterLivello) return false;
    return true;
  });

  filtered = [...filtered].sort((a, b) => {
    let cmp = 0;
    switch (sortField) {
      case 'nomeClasse': cmp = a.nomeClasse.localeCompare(b.nomeClasse); break;
      case 'insegnante': cmp = (getUtente(a.idInsegnante)?.cognome || '').localeCompare(getUtente(b.idInsegnante)?.cognome || ''); break;
      case 'livelloTarget': cmp = livelli.indexOf(a.livelloTarget) - livelli.indexOf(b.livelloTarget); break;
      case 'studenti': cmp = getStudentCount(a.id) - getStudentCount(b.id); break;
      case 'giorno': cmp = giorni.indexOf(a.giorno) - giorni.indexOf(b.giorno); break;
    }
    return sortAsc ? cmp : -cmp;
  });

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(true); }
  };

  const handleEdit = (classe: Classe) => {
    setEditClass(classe);
    setEditForm({
      nomeClasse: classe.nomeClasse, idInsegnante: classe.idInsegnante.toString(), idTavolo: classe.idTavolo.toString(),
      giorno: classe.giorno, oraInizio: classe.oraInizio, oraFine: classe.oraFine, livelloTarget: classe.livelloTarget,
    });
  };

  const handleSaveEdit = () => {
    if (!editClass || !editForm.nomeClasse) return;
    setClassi(prev => prev.map(c => c.id === editClass.id ? {
      ...c, nomeClasse: editForm.nomeClasse, idInsegnante: parseInt(editForm.idInsegnante), idTavolo: parseInt(editForm.idTavolo),
      giorno: editForm.giorno as Giorno, oraInizio: editForm.oraInizio, oraFine: editForm.oraFine, livelloTarget: editForm.livelloTarget as Livello,
    } : c));
    toast.success(`Classe "${editForm.nomeClasse}" aggiornata`);
    setEditClass(null);
  };

  const handleDelete = () => {
    if (!deleteClass) return;
    const studentIds = iscrizioniClassi.filter(ic => ic.idClasse === deleteClass.id).map(ic => ic.idStudente);
    setClassi(prev => prev.filter(c => c.id !== deleteClass.id));
    setIscrizioniClassi(prev => prev.filter(ic => ic.idClasse !== deleteClass.id));
    setProfiliStudenti(prev => prev.map(p => studentIds.includes(p.idUtente) ? { ...p, statoScuola: 'In attesa classe' as const } : p));
    toast.success(`Classe "${deleteClass.nomeClasse}" eliminata. ${studentIds.length} studenti rimessi in attesa.`);
    setDeleteClass(null);
  };

  const SortHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <TableHead className="cursor-pointer select-none" onClick={() => toggleSort(field)}>
      <div className="flex items-center gap-1">{children}<ArrowUpDown className="h-3 w-3 text-muted-foreground" /></div>
    </TableHead>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Elenco Classi</h1>
        <p className="text-muted-foreground">{classi.length} classi attive</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Select value={filterInsegnante} onValueChange={setFilterInsegnante}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Insegnante..." /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutti gli insegnanti</SelectItem>
            {insegnanti.map(u => u && <SelectItem key={u.id} value={u.id.toString()}>{u.nome} {u.cognome}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterLivello} onValueChange={setFilterLivello}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Livello..." /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutti i livelli</SelectItem>
            {livelli.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <SortHeader field="nomeClasse">Classe</SortHeader>
                <SortHeader field="insegnante">Insegnante</SortHeader>
                <SortHeader field="livelloTarget">Livello</SortHeader>
                <SortHeader field="giorno">Giorno</SortHeader>
                <TableHead>Orario</TableHead>
                <TableHead>Tavolo</TableHead>
                <SortHeader field="studenti">Studenti</SortHeader>
                <TableHead className="w-24">Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Nessuna classe trovata</TableCell></TableRow>
              ) : filtered.map(c => {
                const teacher = getUtente(c.idInsegnante);
                const tavolo = getTavolo(c.idTavolo);
                return (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.nomeClasse}</TableCell>
                    <TableCell>{teacher?.nome} {teacher?.cognome}</TableCell>
                    <TableCell><Badge variant="secondary">{c.livelloTarget}</Badge></TableCell>
                    <TableCell>{c.giorno}</TableCell>
                    <TableCell>{c.oraInizio}–{c.oraFine}</TableCell>
                    <TableCell>{tavolo?.nomeTavolo}</TableCell>
                    <TableCell>{getStudentCount(c.id)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(c)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteClass(c)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editClass} onOpenChange={() => setEditClass(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifica Classe</DialogTitle>
            <DialogDescription>Modifica i dettagli della classe.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>Nome Classe</Label><Input value={editForm.nomeClasse} onChange={e => setEditForm({ ...editForm, nomeClasse: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Insegnante</Label>
                <Select value={editForm.idInsegnante} onValueChange={v => setEditForm({ ...editForm, idInsegnante: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {insegnanti.map(u => u && <SelectItem key={u.id} value={u.id.toString()}>{u.nome} {u.cognome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Livello</Label>
                <Select value={editForm.livelloTarget} onValueChange={v => setEditForm({ ...editForm, livelloTarget: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{livelli.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Giorno</Label>
                <Select value={editForm.giorno} onValueChange={v => setEditForm({ ...editForm, giorno: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{giorni.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tavolo</Label>
                <Select value={editForm.idTavolo} onValueChange={v => setEditForm({ ...editForm, idTavolo: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{tavoli.map(t => <SelectItem key={t.id} value={t.id.toString()}>{t.nomeTavolo}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Ora inizio</Label><Input type="time" value={editForm.oraInizio} onChange={e => setEditForm({ ...editForm, oraInizio: e.target.value })} /></div>
              <div><Label>Ora fine</Label><Input type="time" value={editForm.oraFine} onChange={e => setEditForm({ ...editForm, oraFine: e.target.value })} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditClass(null)}>Annulla</Button>
            <Button onClick={handleSaveEdit}>Salva</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteClass} onOpenChange={() => setDeleteClass(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare la classe?</AlertDialogTitle>
            <AlertDialogDescription>La classe "{deleteClass?.nomeClasse}" verrà eliminata e gli studenti iscritti saranno rimessi in stato "In attesa classe".</AlertDialogDescription>
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
