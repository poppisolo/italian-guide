import { useStore } from '@/data/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock } from 'lucide-react';

export default function Insegnanti() {
  const { utenti, profiliVolontari, disponibilita } = useStore();

  const getUtente = (id: number) => utenti.find(u => u.id === id);
  const getDisp = (idUtente: number) => disponibilita.filter(d => d.idUtente === idUtente);

  const isExpiring = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diff < 60;
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
            <Card key={v.id}>
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
    </div>
  );
}
