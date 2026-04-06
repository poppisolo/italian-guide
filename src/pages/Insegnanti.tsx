import { useState } from 'react';
import { useStore } from '@/data/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Calendar, Clock, X } from 'lucide-react';
import { toast } from 'sonner';
import type { Giorno } from '@/data/types';

const giorni: Giorno[] = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];

export default function Insegnanti() {
  const { utenti, profiliVolontari, disponibilita, setDisponibilita, classi } = useStore();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [editSlots, setEditSlots] = useState<{ giorno: Giorno; oraInizio: string; oraFine: string }[]>([]);
  const [editingAvail, setEditingAvail] = useState(false);

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

  const startEditAvail = () => {
    setEditSlots(selectedSlots.map(s => ({ giorno: s.giorno, oraInizio: s.oraInizio, oraFine: s.oraFine })));
    setEditingAvail(true);
  };

  const saveAvail = () => {
    if (!selectedId) return;
    const withoutOld = disponibilita.filter(d => d.idUtente !== selectedId);
    const maxId = Math.max(...disponibilita.map(d => d.id), 0);
    const newDisps = editSlots.map((s, i) => ({ id: maxId + i + 1, idUtente: selectedId, ...s }));
    setDisponibilita([...withoutOld, ...newDisps]);
    setEditingAvail(false);
    toast.success('Disponibilità aggiornate');
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
            <Card key={v.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => { setSelectedId(v.idUtente); setEditingAvail(false); }}>
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
      <Dialog open={!!selectedId} onOpenChange={(open) => { if (!open) { setSelectedId(null); setEditingAvail(false); } }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedUser?.nome} {selectedUser?.cognome}</DialogTitle>
            <DialogDescription>{selectedUser?.email} — {selectedUser?.telefono}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
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

            {/* Classi */}
            {selectedClassi.length > 0 && (
              <div className="space-y-1">
                <p className="font-medium text-sm">Classi assegnate</p>
                {selectedClassi.map(c => (
                  <Badge key={c.id} variant="secondary" className="mr-1">{c.nomeClasse} — {c.giorno} {c.oraInizio}</Badge>
                ))}
              </div>
            )}

            {/* Disponibilità */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="font-medium text-sm flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Disponibilità Orarie</p>
                <Button size="sm" variant="outline" onClick={editingAvail ? saveAvail : startEditAvail}>
                  {editingAvail ? 'Salva' : 'Modifica'}
                </Button>
              </div>
              {!editingAvail ? (
                <div className="flex flex-wrap gap-1">
                  {selectedSlots.length === 0 && <span className="text-sm text-muted-foreground">Nessuna disponibilità</span>}
                  {selectedSlots.map(s => (
                    <Badge key={s.id} variant="outline" className="text-xs">{s.giorno} {s.oraInizio}–{s.oraFine}</Badge>
                  ))}
                </div>
              ) : (
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
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
