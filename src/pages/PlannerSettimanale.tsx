import { useState } from 'react';
import { useClassi, useUpdateClasse, useDeleteClasse, useInsegnanti, useIscrizioni, useStudenti, useUpdateStudente } from '@/hooks/useSupabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Pencil, Trash2, Loader2 } from 'lucide-react';
import type { Classe } from '@/hooks/useSupabase';

const giorni = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
const livelli = ['Alfa', 'Pre-A1', 'A1', 'A2', 'B1', 'B2'];

export default function PlannerSettimanale() {
  const { data: classi = [], isLoading } = useClassi();
  const { data: insegnanti = [] } = useInsegnanti();
  const { data: iscrizioni = [] } = useIscrizioni();
  const { data: studenti = [] } = useStudenti();
  const updateClasse = useUpdateClasse();
  const deleteClasse = useDeleteClasse();
  const updateStudente = useUpdateStudente();

  const [detailClass, setDetailClass] = useState<Classe | null>(null);
  const [editClass, setEditClass] = useState<Classe | null>(null);
  const [editForm, setEditForm] = useState({ nome: '', insegnante_id: '', aula: '', orario_inizio: '', orario_fine: '', livello: '' });
  const [deleteClassItem, setDeleteClassItem] = useState<Classe | null>(null);

  const getInsegnante = (id: string | null) => insegnanti.find(i => i.id === id);
  const getStudentCount = (classId: string) => iscrizioni.filter(ic => ic.classe_id === classId && ic.attiva).length;

  const getClassiForDay = (giorno: string) => classi.filter(c => c.giorno_settimana === giorno);

  const handleStartEdit = (classe: Classe) => {
    setDetailClass(null);
    setEditClass(classe);
    setEditForm({
      nome: classe.nome, insegnante_id: classe.insegnante_id || '', aula: classe.aula || '',
      orario_inizio: classe.orario_inizio || '', orario_fine: classe.orario_fine || '', livello: classe.livello || '',
    });
  };

  const handleSaveEdit = async () => {
    if (!editClass || !editForm.nome) return;
    try {
      await updateClasse.mutateAsync({
        id: editClass.id, nome: editForm.nome, insegnante_id: editForm.insegnante_id || null,
        aula: editForm.aula || null, orario_inizio: editForm.orario_inizio || null,
        orario_fine: editForm.orario_fine || null, livello: editForm.livello || null,
      });
      toast.success(`Classe "${editForm.nome}" aggiornata`);
      setEditClass(null);
    } catch { toast.error('Errore'); }
  };

  const handleStartDelete = (classe: Classe) => {
    setDetailClass(null);
    setDeleteClassItem(classe);
  };

  const handleDelete = async () => {
    if (!deleteClassItem) return;
    try {
      const studentIds = iscrizioni.filter(ic => ic.classe_id === deleteClassItem.id).map(ic => ic.studente_id);
      for (const sid of studentIds) {
        await updateStudente.mutateAsync({ id: sid, stato_scuola: 'In attesa classe' });
      }
      await deleteClasse.mutateAsync(deleteClassItem.id);
      toast.success(`Classe "${deleteClassItem.nome}" eliminata.`);
      setDeleteClassItem(null);
    } catch { toast.error('Errore'); }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Planner Settimanale</h1>
        <p className="text-muted-foreground">{classi.length} classi attive</p>
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
                  const ins = getInsegnante(classe.insegnante_id);
                  const studentCount = getStudentCount(classe.id);
                  return (
                    <Card key={classe.id} className="shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => setDetailClass(classe)}>
                      <CardHeader className="p-3 pb-1">
                        <CardTitle className="text-sm leading-tight">{classe.nome}</CardTitle>
                      </CardHeader>
                      <CardContent className="p-3 pt-1 space-y-1.5">
                        <p className="text-xs text-muted-foreground">{classe.orario_inizio}–{classe.orario_fine}</p>
                        <Badge variant="secondary" className="text-xs">{classe.livello || '—'}</Badge>
                        <p className="text-xs">👤 {ins ? `${ins.nome} ${ins.cognome}` : '—'}</p>
                        {classe.aula && <p className="text-xs text-muted-foreground">📍 {classe.aula}</p>}
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
            <DialogTitle>{detailClass?.nome}</DialogTitle>
            <DialogDescription>{detailClass?.giorno_settimana} — {detailClass?.orario_inizio}–{detailClass?.orario_fine}</DialogDescription>
          </DialogHeader>
          {detailClass && (() => {
            const ins = getInsegnante(detailClass.insegnante_id);
            const studentIds = iscrizioni.filter(ic => ic.classe_id === detailClass.id && ic.attiva).map(ic => ic.studente_id);
            return (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-muted-foreground">Livello:</span> <Badge variant="secondary">{detailClass.livello || '—'}</Badge></div>
                  <div><span className="text-muted-foreground">Aula:</span> {detailClass.aula || '—'}</div>
                  <div className="col-span-2"><span className="text-muted-foreground">Insegnante:</span> {ins ? `${ins.nome} ${ins.cognome}` : '—'}</div>
                </div>
                {studentIds.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-1">Studenti ({studentIds.length})</p>
                    <div className="flex flex-wrap gap-1">
                      {studentIds.map(id => {
                        const s = studenti.find(st => st.id === id);
                        return <Badge key={id} variant="outline" className="text-xs">{s?.nome} {s?.cognome}</Badge>;
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
            <div><Label>Nome Classe</Label><Input value={editForm.nome} onChange={e => setEditForm({ ...editForm, nome: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Insegnante</Label>
                <Select value={editForm.insegnante_id || 'none'} onValueChange={v => setEditForm({ ...editForm, insegnante_id: v === 'none' ? '' : v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">—</SelectItem>
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
              <div><Label>Aula</Label><Input value={editForm.aula} onChange={e => setEditForm({ ...editForm, aula: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label>Inizio</Label><Input type="time" value={editForm.orario_inizio} onChange={e => setEditForm({ ...editForm, orario_inizio: e.target.value })} /></div>
                <div><Label>Fine</Label><Input type="time" value={editForm.orario_fine} onChange={e => setEditForm({ ...editForm, orario_fine: e.target.value })} /></div>
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
