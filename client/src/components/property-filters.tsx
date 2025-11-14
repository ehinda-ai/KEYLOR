import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { X } from "lucide-react";

interface PropertyFiltersProps {
  onFilterChange: (filters: FilterValues) => void;
  onClose?: () => void;
}

export interface FilterValues {
  type: string;
  transactionType: string;
  ville: string;
  prixMin: number;
  prixMax: number;
  surfaceMin: number;
  chambresMin: number;
}

export function PropertyFilters({ onFilterChange, onClose }: PropertyFiltersProps) {
  const [filters, setFilters] = useState<FilterValues>({
    type: "tous",
    transactionType: "tous",
    ville: "",
    prixMin: 0,
    prixMax: 5000000,
    surfaceMin: 0,
    chambresMin: 0,
  });

  const handleFilterChange = (key: keyof FilterValues, value: string | number) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const resetFilters = () => {
    const defaultFilters: FilterValues = {
      type: "tous",
      transactionType: "tous",
      ville: "",
      prixMin: 0,
      prixMax: 5000000,
      surfaceMin: 0,
      chambresMin: 0,
    };
    setFilters(defaultFilters);
    onFilterChange(defaultFilters);
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-serif font-normal">Filtres</h3>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose} data-testid="button-close-filters">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="space-y-6">
        <div>
          <Label htmlFor="transactionType" className="text-sm font-medium mb-2 block">
            Type de transaction
          </Label>
          <Select
            value={filters.transactionType}
            onValueChange={(value) => handleFilterChange("transactionType", value)}
          >
            <SelectTrigger id="transactionType" data-testid="select-transaction-type">
              <SelectValue placeholder="Sélectionner" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tous">Tous</SelectItem>
              <SelectItem value="vente">Vente</SelectItem>
              <SelectItem value="location">Location</SelectItem>
              <SelectItem value="location_saisonniere">Location saisonnière</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="type" className="text-sm font-medium mb-2 block">
            Type de bien
          </Label>
          <Select
            value={filters.type}
            onValueChange={(value) => handleFilterChange("type", value)}
          >
            <SelectTrigger id="type" data-testid="select-type">
              <SelectValue placeholder="Sélectionner" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tous">Tous les types</SelectItem>
              <SelectItem value="appartement">Appartement</SelectItem>
              <SelectItem value="maison">Maison</SelectItem>
              <SelectItem value="terrain">Terrain</SelectItem>
              <SelectItem value="commercial">Commercial</SelectItem>
              <SelectItem value="mobilhome">Mobil-home</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="ville" className="text-sm font-medium mb-2 block">
            Ville
          </Label>
          <Input
            id="ville"
            placeholder="Rechercher une ville..."
            value={filters.ville}
            onChange={(e) => handleFilterChange("ville", e.target.value)}
            data-testid="input-ville"
          />
        </div>

        <div>
          <Label className="text-sm font-medium mb-3 block">
            Budget (max: {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", minimumFractionDigits: 0 }).format(filters.prixMax)})
          </Label>
          <Slider
            value={[filters.prixMax]}
            min={0}
            max={5000000}
            step={50000}
            onValueChange={(value) => handleFilterChange("prixMax", value[0])}
            data-testid="slider-prix"
          />
        </div>

        <div>
          <Label className="text-sm font-medium mb-3 block">
            Surface minimum ({filters.surfaceMin} m²)
          </Label>
          <Slider
            value={[filters.surfaceMin]}
            min={0}
            max={500}
            step={10}
            onValueChange={(value) => handleFilterChange("surfaceMin", value[0])}
            data-testid="slider-surface"
          />
        </div>

        <div>
          <Label htmlFor="chambres" className="text-sm font-medium mb-2 block">
            Chambres minimum
          </Label>
          <Select
            value={filters.chambresMin.toString()}
            onValueChange={(value) => handleFilterChange("chambresMin", parseInt(value))}
          >
            <SelectTrigger id="chambres" data-testid="select-chambres">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Indifférent</SelectItem>
              <SelectItem value="1">1+</SelectItem>
              <SelectItem value="2">2+</SelectItem>
              <SelectItem value="3">3+</SelectItem>
              <SelectItem value="4">4+</SelectItem>
              <SelectItem value="5">5+</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          variant="outline"
          className="w-full"
          onClick={resetFilters}
          data-testid="button-reset-filters"
        >
          Réinitialiser les filtres
        </Button>
      </div>
    </Card>
  );
}
