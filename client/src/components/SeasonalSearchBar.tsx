import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarIcon, Users, Search } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface SeasonalSearchBarProps {
  onSearch: (criteria: {
    dateArrivee: Date | undefined;
    dateDepart: Date | undefined;
    nombreVoyageurs: number;
  }) => void;
}

export function SeasonalSearchBar({ onSearch }: SeasonalSearchBarProps) {
  const [dateArrivee, setDateArrivee] = useState<Date>();
  const [dateDepart, setDateDepart] = useState<Date>();
  const [nombreVoyageurs, setNombreVoyageurs] = useState<number>(2);

  const handleSearch = () => {
    onSearch({
      dateArrivee,
      dateDepart,
      nombreVoyageurs,
    });
  };

  return (
    <Card className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label>Arrivée</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
                data-testid="button-date-arrivee"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateArrivee ? (
                  format(dateArrivee, "dd MMM yyyy", { locale: fr })
                ) : (
                  <span className="text-muted-foreground">Date d'arrivée</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateArrivee}
                onSelect={setDateArrivee}
                disabled={(date) => date < new Date()}
                initialFocus
                locale={fr}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label>Départ</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
                data-testid="button-date-depart"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateDepart ? (
                  format(dateDepart, "dd MMM yyyy", { locale: fr })
                ) : (
                  <span className="text-muted-foreground">Date de départ</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateDepart}
                onSelect={setDateDepart}
                disabled={(date) => {
                  if (dateArrivee) {
                    return date <= dateArrivee;
                  }
                  return date < new Date();
                }}
                initialFocus
                locale={fr}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label>Voyageurs</Label>
          <Select
            value={nombreVoyageurs.toString()}
            onValueChange={(value) => setNombreVoyageurs(parseInt(value))}
          >
            <SelectTrigger data-testid="select-voyageurs">
              <Users className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <SelectItem key={num} value={num.toString()}>
                  {num} {num === 1 ? "voyageur" : "voyageurs"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-end">
          <Button 
            onClick={handleSearch} 
            className="w-full"
            data-testid="button-search-seasonal"
          >
            <Search className="mr-2 h-4 w-4" />
            Rechercher
          </Button>
        </div>
      </div>

      {dateArrivee && dateDepart && (
        <div className="mt-4 text-sm text-muted-foreground text-center">
          {Math.ceil((dateDepart.getTime() - dateArrivee.getTime()) / (1000 * 60 * 60 * 24))} nuits • {nombreVoyageurs} {nombreVoyageurs === 1 ? "voyageur" : "voyageurs"}
        </div>
      )}
    </Card>
  );
}
