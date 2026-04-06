import { useState } from 'react';
import { useStore } from '@/data/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Pencil, Trash2, ArrowUpDown } from 'lucide-react';
import type { Classe, Livello } from '@/data/types';

type SortField = 'nomeClasse' | 'insegnante' | 'livelloTarget' | 'studenti' | 'giorno';

export default function ElencoClassi() {
  const { classi, setClassi, utenti, tavoli, iscrizioniClassi, setIscrizioniClassi, setProfiliStudenti } = useStore();
  const [filterInsegnante, setFilterInsegnante] = useState('all');
  const [filterLivello, setFilterLivello] = useState('all');
  const [sortField, setSortField] = useState<SortField>('nomeClasse');
  const [sortAsc, setSortAsc] = useState(true);
  const [editClass, setEditClass] = useState<Classe | null>(null);
  const [editName, setEditName] = useState('');
  const [deleteClass, setDeleteClass] = useState<Classe | null>(null);

  const getUtente = (id: number) => utenti.find(u => u.id === id);
  const getTavolo = (id: number) => tavoli.find(t => t.id === id);
  const getStudentCount = (classId: number) => iscrizioniClassi.filter(ic => ic.idClasse === classId).length;

  const insegnanti = [...new Set(classi.map(c => c.idInsegnante))].map(id => getUtente(id)).filter(Boolean);
  const livelli: Livello[] = ['Alfa', 'Pre-A1', 'A1', 'A2', 'B1', 'B2'];

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
      case 'giorno': {
        const giorni = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
        cmp = giorni.indexOf(a.giorno) - giorni.indexOf(b.giorno);
        break;
      }
    }
    return sortAsc ? cmp : -cmp;
  });

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(true); }
  };

  const handleEdit = (classe: Classe) => {
    setEditClass(classe);
    setEditName(classe.nomeClasse);
  };

  const handleSaveEdit = () => {
    if (!editClass) return;
    setClassi(prev => prev.map(c => c.id === editClass.id ? { ...c, nomeClasse: editName } : c));
    toast.success(`Classe "${editName}" aggiornata`);
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
      <div className="flex items-center gap-1">
        {children}
        <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
      </div>
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
            {insegnanti.map(u => u && (
              <SelectItem key={u.id} value={u.id.toString()}>{u.nome} {u.cognome}</SelectItem>
            ))}
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
          <DialogHeader><DialogTitle>Modifica Classe</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nome Classe</Label><Input value={editName} onChange={e => setEditName(e.target.value)} /></div>
          </div>
          <DialogFooter><Button onClick={handleSaveEdit}>Salva</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteClass} onOpenChange={() => setDeleteClass(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare la classe?</AlertDialogTitle>
            <AlertDialogDescription>
              La classe "{deleteClass?.nomeClasse}" verrà eliminata e gli studenti iscritti saranno rimessi in stato "In attesa classe".
            </AlertDialogDescription>
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
