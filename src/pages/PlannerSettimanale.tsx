import { useState } from 'react';
import { useStore } from '@/data/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Pencil, Trash2 } from 'lucide-react';
import type { Giorno, Classe, Livello } from '@/data/types';

const giorni: Giorno[] = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
const livelli: Livello[] = ['Alfa', 'Pre-A1', 'A1', 'A2', 'B1', 'B2'];

export default function PlannerSettimanale() {
  const { classi, setClassi, tavoli, utenti, iscrizioniClassi, setIscrizioniClassi, setProfiliStudenti, profiliVolontari } = useStore();
  const [filterTavolo, setFilterTavolo] = useState<string>('all');
  const [detailClass, setDetailClass] = useState<Classe | null>(null);
  const [editClass, setEditClass] = useState<Classe | null>(null);
  const [editForm, setEditForm] = useState({ nomeClasse: '', idInsegnante: '', idTavolo: '', oraInizio: '', oraFine: '', livelloTarget: '' as string });
  const [deleteClass, setDeleteClass] = useState<Classe | null>(null);

  const getUtente = (id: number) => utenti.find(u => u.id === id);
  const getTavolo = (id: number) => tavoli.find(t => t.id === id);
  const getStudentCount = (classId: number) => iscrizioniClassi.filter(ic => ic.idClasse === classId).length;
  const insegnanti = profiliVolontari.map(v => getUtente(v.idUtente)).filter(Boolean);

  const filteredClassi = filterTavolo === 'all'
    ? classi
    : classi.filter(c => c.idTavolo === parseInt(filterTavolo));

  const getClassiForDay = (giorno: Giorno) =>
    filteredClassi.filter(c => c.giorno === giorno);

  const openDetail = (classe: Classe) => setDetailClass(classe);

  const handleStartEdit = (classe: Classe) => {
    setDetailClass(null);
    setEditClass(classe);
    setEditForm({
      nomeClasse: classe.nomeClasse, idInsegnante: classe.idInsegnante.toString(), idTavolo: classe.idTavolo.toString(),
      oraInizio: classe.oraInizio, oraFine: classe.oraFine, livelloTarget: classe.livelloTarget,
    });
  };

  const handleSaveEdit = () => {
    if (!editClass || !editForm.nomeClasse) return;
    setClassi(prev => prev.map(c => c.id === editClass.id ? {
      ...c, nomeClasse: editForm.nomeClasse, idInsegnante: parseInt(editForm.idInsegnante), idTavolo: parseInt(editForm.idTavolo),
      oraInizio: editForm.oraInizio, oraFine: editForm.oraFine, livelloTarget: editForm.livelloTarget as Livello,
    } : c));
    toast.success(`Classe "${editForm.nomeClasse}" aggiornata`);
    setEditClass(null);
  };

  const handleStartDelete = (classe: Classe) => {
    setDetailClass(null);
    setDeleteClass(classe);
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
            <SelectTrigger><SelectValue placeholder="Filtra per tavolo..." /></SelectTrigger>
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
                <div className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">Nessuna classe</div>
              ) : (
                classiGiorno.map(classe => {
                  const teacher = getUtente(classe.idInsegnante);
                  const tavolo = getTavolo(classe.idTavolo);
                  const studentCount = getStudentCount(classe.id);
                  return (
                    <Card key={classe.id} className="shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => openDetail(classe)}>
                      <CardHeader className="p-3 pb-1">
                        <CardTitle className="text-sm leading-tight">{classe.nomeClasse}</CardTitle>
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

      {/* Detail Dialog */}
      <Dialog open={!!detailClass} onOpenChange={() => setDetailClass(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{detailClass?.nomeClasse}</DialogTitle>
            <DialogDescription>{detailClass?.giorno} — {detailClass?.oraInizio}–{detailClass?.oraFine}</DialogDescription>
          </DialogHeader>
          {detailClass && (() => {
            const teacher = getUtente(detailClass.idInsegnante);
            const tavolo = getTavolo(detailClass.idTavolo);
            const studentCount = getStudentCount(detailClass.id);
            const studentIds = iscrizioniClassi.filter(ic => ic.idClasse === detailClass.id).map(ic => ic.idStudente);
            return (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-muted-foreground">Livello:</span> <Badge variant="secondary">{detailClass.livelloTarget}</Badge></div>
                  <div><span className="text-muted-foreground">Tavolo:</span> {tavolo?.nomeTavolo}</div>
                  <div className="col-span-2"><span className="text-muted-foreground">Insegnante:</span> {teacher?.nome} {teacher?.cognome}</div>
                </div>
                {studentIds.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-1">Studenti ({studentCount})</p>
                    <div className="flex flex-wrap gap-1">
                      {studentIds.map(id => {
                        const u = getUtente(id);
                        return <Badge key={id} variant="outline" className="text-xs">{u?.nome} {u?.cognome}</Badge>;
                      })}
                    </div>
                  </div>
                )}
                <div className="flex gap-2 pt-2 border-t">
                  <Button onClick={() => handleStartEdit(detailClass)} className="gap-2"><Pencil className="h-4 w-4" />Modifica</Button>
                  <Button variant="destructive" onClick={() => handleStartDelete(detailClass)} className="gap-2"><Trash2 className="h-4 w-4" />Elimina</Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editClass} onOpenChange={() => setEditClass(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Modifica Classe</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nome Classe</Label><Input value={editForm.nomeClasse} onChange={e => setEditForm({ ...editForm, nomeClasse: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Insegnante</Label>
                <Select value={editForm.idInsegnante} onValueChange={v => setEditForm({ ...editForm, idInsegnante: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{insegnanti.map(u => u && <SelectItem key={u.id} value={u.id.toString()}>{u.nome} {u.cognome}</SelectItem>)}</SelectContent>
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
                <Label>Tavolo</Label>
                <Select value={editForm.idTavolo} onValueChange={v => setEditForm({ ...editForm, idTavolo: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{tavoli.map(t => <SelectItem key={t.id} value={t.id.toString()}>{t.nomeTavolo}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label>Inizio</Label><Input type="time" value={editForm.oraInizio} onChange={e => setEditForm({ ...editForm, oraInizio: e.target.value })} /></div>
                <div><Label>Fine</Label><Input type="time" value={editForm.oraFine} onChange={e => setEditForm({ ...editForm, oraFine: e.target.value })} /></div>
              </div>
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
