import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useStore } from '@/data/store';
import { Users, Clock, GraduationCap, UserCog } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { profiliStudenti, classi, profiliVolontari } = useStore();
  const navigate = useNavigate();

  const attesaTest = profiliStudenti.filter(p => p.statoScuola === 'In attesa test').length;
  const attesaClasse = profiliStudenti.filter(p => p.statoScuola === 'In attesa classe').length;
  const classiAttive = classi.length;
  const insegnantiDisp = profiliVolontari.length;

  const kpis = [
    { title: 'In attesa di test', value: attesaTest, icon: Clock, color: 'text-secondary' },
    { title: 'In attesa di classe', value: attesaClasse, icon: Users, color: 'text-accent' },
    { title: 'Classi attive', value: classiAttive, icon: GraduationCap, color: 'text-primary' },
    { title: 'Insegnanti disponibili', value: insegnantiDisp, icon: UserCog, color: 'text-primary' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard Segreteria</h1>
        <p className="text-muted-foreground mt-1">Panoramica della scuola SEMI FORESTI</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.title}</CardTitle>
              <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{kpi.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/test')}>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="h-12 w-12 rounded-lg bg-secondary/20 flex items-center justify-center">
              <Clock className="h-6 w-6 text-secondary" />
            </div>
            <div>
              <h3 className="font-semibold">Gestione Test</h3>
              <p className="text-sm text-muted-foreground">{attesaTest} studenti da testare</p>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/class-builder')}>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center">
              <GraduationCap className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Class Builder</h3>
              <p className="text-sm text-muted-foreground">{attesaClasse} studenti da assegnare</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
