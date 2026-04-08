import { useState } from 'react';
import { useClassi, useUpdateClasse, useDeleteClasse, useInsegnanti, useIscrizioni, useDeleteIscrizioniByClasse, useStudenti, useUpdateStudente } from '@/hooks/useSupabase';
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
import { Pencil, Trash2, ArrowUpDown, Loader2 } from 'lucide-react';
import type { Classe } from '@/hooks/useSupabase';

type SortField = 'nome' | 'insegnante' | 'livello' | 'studenti' | 'giorno';
const livelli = ['Alfa', 'Pre-A1', 'A1', 'A2', 'B1', 'B2'];
const giorni = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];

export default function ElencoClassi() {
  const { data: classi = [], isLoading } = useClassi();
  const { data: insegnanti = [] } = useInsegnanti();
  const { data: iscrizioni = [] } = useIscrizioni();
  const { data: studenti = [] } = useStudenti();
  const updateClasse = useUpdateClasse();
  const deleteClasse = useDeleteClasse();
  const updateStudente = useUpdateStudente();

  const [filterInsegnante, setFilterInsegnante] = useState('all');
  const [filterLivello, setFilterLivello] = useState('all');
  const [sortField, setSortField] = useState<SortField>('nome');
  const [sortAsc, setSortAsc] = useState(true);
  const [editClass, setEditClass] = useState<Classe | null>(null);
  const [editForm, setEditForm] = useState({ nome: '', insegnante_id: '', aula: '', giorno_settimana: '', orario_inizio: '', orario_fine: '', livello: '' });
  const [deleteClassItem, setDeleteClassItem] = useState<Classe | null>(null);

  const getInsegnante = (id: string | null) => insegnanti.find(i => i.id === id);
  const getStudentCount = (classId: string) => iscrizioni.filter(ic => ic.classe_id === classId && ic.attiva).length;

  let filtered = classi.filter(c => {
    if (filterInsegnante !== 'all' && c.insegnante_id !== filterInsegnante) return false;
    if (filterLivello !== 'all' && c.livello !== filterLivello) return false;
    return true;
  });

  filtered = [...filtered].sort((a, b) => {
    let cmp = 0;
    switch (sortField) {
      case 'nome': cmp = a.nome.localeCompare(b.nome); break;
      case 'insegnante': cmp = (getInsegnante(a.insegnante_id)?.cognome || '').localeCompare(getInsegnante(b.insegnante_id)?.cognome || ''); break;
      case 'livello': cmp = livelli.indexOf(a.livello || '') - livelli.indexOf(b.livello || ''); break;
      case 'studenti': cmp = getStudentCount(a.id) - getStudentCount(b.id); break;
      case 'giorno': cmp = giorni.indexOf(a.giorno_settimana || '') - giorni.indexOf(b.giorno_settimana || ''); break;
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
      nome: classe.nome, insegnante_id: classe.insegnante_id || '', aula: classe.aula || '',
      giorno_settimana: classe.giorno_settimana || '', orario_inizio: classe.orario_inizio || '',
      orario_fine: classe.orario_fine || '', livello: classe.livello || '',
    });
  };

  const handleSaveEdit = async () => {
    if (!editClass || !editForm.nome) return;
    try {
      await updateClasse.mutateAsync({
        id: editClass.id, nome: editForm.nome, insegnante_id: editForm.insegnante_id || null,
        aula: editForm.aula || null, giorno_settimana: editForm.giorno_settimana || null,
        orario_inizio: editForm.orario_inizio || null, orario_fine: editForm.orario_fine || null,
        livello: editForm.livello || null,
      });
      toast.success(`Classe "${editForm.nome}" aggiornata`);
      setEditClass(null);
    } catch { toast.error('Errore durante il salvataggio'); }
  };

  const handleDelete = async () => {
    if (!deleteClassItem) return;
    try {
      const studentIds = iscrizioni.filter(ic => ic.classe_id === deleteClassItem.id).map(ic => ic.studente_id);
      for (const sid of studentIds) {
        await updateStudente.mutateAsync({ id: sid, stato_scuola: 'In attesa classe' });
      }
      await deleteClasse.mutateAsync(deleteClassItem.id);
      toast.success(`Classe "${deleteClassItem.nome}" eliminata. ${studentIds.length} studenti rimessi in attesa.`);
      setDeleteClassItem(null);
    } catch { toast.error('Errore durante l\'eliminazione'); }
  };

  const SortHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <TableHead className="cursor-pointer select-none" onClick={() => toggleSort(field)}>
      <div className="flex items-center gap-1">{children}<ArrowUpDown className="h-3 w-3 text-muted-foreground" /></div>
    </TableHead>
  );

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

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
            {insegnanti.map(i => <SelectItem key={i.id} value={i.id}>{i.nome} {i.cognome}</SelectItem>)}
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
                <SortHeader field="nome">Classe</SortHeader>
                <SortHeader field="insegnante">Insegnante</SortHeader>
                <SortHeader field="livello">Livello</SortHeader>
                <SortHeader field="giorno">Giorno</SortHeader>
                <TableHead>Orario</TableHead>
                <TableHead>Aula</TableHead>
                <SortHeader field="studenti">Studenti</SortHeader>
                <TableHead className="w-24">Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Nessuna classe trovata</TableCell></TableRow>
              ) : filtered.map(c => {
                const ins = getInsegnante(c.insegnante_id);
                return (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.nome}</TableCell>
                    <TableCell>{ins ? `${ins.nome} ${ins.cognome}` : '—'}</TableCell>
                    <TableCell><Badge variant="secondary">{c.livello || '—'}</Badge></TableCell>
                    <TableCell>{c.giorno_settimana || '—'}</TableCell>
                    <TableCell>{c.orario_inizio}–{c.orario_fine}</TableCell>
                    <TableCell>{c.aula || '—'}</TableCell>
                    <TableCell>{getStudentCount(c.id)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(c)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteClassItem(c)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
            <div><Label>Nome Classe</Label><Input value={editForm.nome} onChange={e => setEditForm({ ...editForm, nome: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Insegnante</Label>
                <Select value={editForm.insegnante_id || 'none'} onValueChange={v => setEditForm({ ...editForm, insegnante_id: v === 'none' ? '' : v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nessuno</SelectItem>
                    {insegnanti.map(i => <SelectItem key={i.id} value={i.id}>{i.nome} {i.cognome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Livello</Label>
                <Select value={editForm.livello || 'none'} onValueChange={v => setEditForm({ ...editForm, livello: v === 'none' ? '' : v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">—</SelectItem>
                    {livelli.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Giorno</Label>
                <Select value={editForm.giorno_settimana || 'none'} onValueChange={v => setEditForm({ ...editForm, giorno_settimana: v === 'none' ? '' : v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">—</SelectItem>
                    {giorni.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Aula</Label><Input value={editForm.aula} onChange={e => setEditForm({ ...editForm, aula: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Ora inizio</Label><Input type="time" value={editForm.orario_inizio} onChange={e => setEditForm({ ...editForm, orario_inizio: e.target.value })} /></div>
              <div><Label>Ora fine</Label><Input type="time" value={editForm.orario_fine} onChange={e => setEditForm({ ...editForm, orario_fine: e.target.value })} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditClass(null)}>Annulla</Button>
            <Button onClick={handleSaveEdit}>Salva</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteClassItem} onOpenChange={() => setDeleteClassItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare la classe?</AlertDialogTitle>
            <AlertDialogDescription>La classe "{deleteClassItem?.nome}" verrà eliminata e gli studenti iscritti saranno rimessi in stato "In attesa classe".</AlertDialogDescription>
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
