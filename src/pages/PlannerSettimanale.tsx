import { useState } from 'react';
import { useStore } from '@/data/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Pencil, Trash2 } from 'lucide-react';
import type { Giorno, Classe } from '@/data/types';

const giorni: Giorno[] = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];

export default function PlannerSettimanale() {
  const { classi, setClassi, tavoli, utenti, iscrizioniClassi, setIscrizioniClassi, setProfiliStudenti } = useStore();
  const [filterTavolo, setFilterTavolo] = useState<string>('all');
  const [editClass, setEditClass] = useState<Classe | null>(null);
  const [editName, setEditName] = useState('');
  const [deleteClass, setDeleteClass] = useState<Classe | null>(null);

  const getUtente = (id: number) => utenti.find(u => u.id === id);
  const getTavolo = (id: number) => tavoli.find(t => t.id === id);
  const getStudentCount = (classId: number) => iscrizioniClassi.filter(ic => ic.idClasse === classId).length;

  const filteredClassi = filterTavolo === 'all'
    ? classi
    : classi.filter(c => c.idTavolo === parseInt(filterTavolo));

  const getClassiForDay = (giorno: Giorno) =>
    filteredClassi.filter(c => c.giorno === giorno);

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Planner Settimanale</h1>
          <p className="text-muted-foreground">{classi.length} classi attive</p>
        </div>
        <div className="w-56">
          <Select value={filterTavolo} onValueChange={setFilterTavolo}>
            <SelectTrigger>
              <SelectValue placeholder="Filtra per tavolo..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti i tavoli</SelectItem>
              {tavoli.map(t => (
                <SelectItem key={t.id} value={t.id.toString()}>{t.nomeTavolo}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {giorni.map(giorno => {
          const classiGiorno = getClassiForDay(giorno);
          return (
            <div key={giorno} className="space-y-2">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider px-1">{giorno}</h3>
              {classiGiorno.length === 0 ? (
                <div className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
                  Nessuna classe
                </div>
              ) : (
                classiGiorno.map(classe => {
                  const teacher = getUtente(classe.idInsegnante);
                  const tavolo = getTavolo(classe.idTavolo);
                  const studentCount = getStudentCount(classe.id);
                  return (
                    <Card key={classe.id} className="shadow-sm group relative">
                      <CardHeader className="p-3 pb-1">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-sm leading-tight">{classe.nomeClasse}</CardTitle>
                          <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleEdit(classe)}>
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setDeleteClass(classe)}>
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-3 pt-1 space-y-1.5">
                        <p className="text-xs text-muted-foreground">{classe.oraInizio}–{classe.oraFine}</p>
                        <Badge variant="secondary" className="text-xs">{classe.livelloTarget}</Badge>
                        <p className="text-xs">👤 {teacher?.nome} {teacher?.cognome}</p>
                        <p className="text-xs text-muted-foreground">📍 {tavolo?.nomeTavolo}</p>
                        <p className="text-xs text-muted-foreground">🎓 {studentCount} studenti</p>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          );
        })}
      </div>

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
