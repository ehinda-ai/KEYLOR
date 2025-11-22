import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Edit2, Download, FileText } from "lucide-react";
import { queryClient } from "@/lib/queryClient";

interface QuotationTemplate {
  id: string;
  nom: string;
  type: string;
  actif: boolean;
  items?: any[];
}

export function QuotationBuilderAdmin() {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);
  const [templateForm, setTemplateForm] = useState({
    nom: "",
    type: "location",
    items: [{ label: "", valeur: "0", type: "percentage" }],
  });

  const { data: templates = [] } = useQuery<QuotationTemplate[]>({
    queryKey: ["/api/quotation-templates"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/quotation-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Erreur");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotation-templates"] });
      toast({ title: "Modèle créé" });
      setShowForm(false);
      setTemplateForm({ nom: "", type: "location", items: [{ label: "", valeur: "0", type: "percentage" }] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/quotation-templates/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Erreur");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotation-templates"] });
      toast({ title: "Modèle supprimé" });
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Modèles de Devis</h3>
        <Button
          size="sm"
          onClick={() => setShowForm(!showForm)}
          data-testid="button-add-quotation"
        >
          <Plus className="h-4 w-4 mr-1" />
          Nouveau modèle
        </Button>
      </div>

      {showForm && (
        <Card className="p-4 bg-muted/50">
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Nom du modèle</label>
              <input
                type="text"
                value={templateForm.nom}
                onChange={(e) => setTemplateForm({ ...templateForm, nom: e.target.value })}
                className="w-full mt-1 px-3 py-2 border rounded text-sm"
                placeholder="ex: Gestion locative"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Type</label>
              <select
                value={templateForm.type}
                onChange={(e) => setTemplateForm({ ...templateForm, type: e.target.value })}
                className="w-full mt-1 px-3 py-2 border rounded text-sm"
              >
                <option value="location">Location</option>
                <option value="vente">Vente</option>
                <option value="location_saisonniere">Location saisonnière</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Services</label>
              {templateForm.items.map((item, idx) => (
                <div key={idx} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={item.label}
                    onChange={(e) => {
                      const newItems = [...templateForm.items];
                      newItems[idx].label = e.target.value;
                      setTemplateForm({ ...templateForm, items: newItems });
                    }}
                    className="flex-1 px-3 py-2 border rounded text-sm"
                    placeholder="Description (ex: Gestion locative)"
                  />
                  <input
                    type="number"
                    value={item.valeur}
                    onChange={(e) => {
                      const newItems = [...templateForm.items];
                      newItems[idx].valeur = e.target.value;
                      setTemplateForm({ ...templateForm, items: newItems });
                    }}
                    className="w-24 px-3 py-2 border rounded text-sm"
                    placeholder="0"
                  />
                  <select
                    value={item.type}
                    onChange={(e) => {
                      const newItems = [...templateForm.items];
                      newItems[idx].type = e.target.value;
                      setTemplateForm({ ...templateForm, items: newItems });
                    }}
                    className="px-3 py-2 border rounded text-sm"
                  >
                    <option value="percentage">%</option>
                    <option value="fixed">€</option>
                  </select>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      const newItems = templateForm.items.filter((_, i) => i !== idx);
                      setTemplateForm({ ...templateForm, items: newItems });
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setTemplateForm({
                    ...templateForm,
                    items: [...templateForm.items, { label: "", valeur: "0", type: "percentage" }],
                  });
                }}
              >
                Ajouter une ligne
              </Button>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>
                Annuler
              </Button>
              <Button
                size="sm"
                onClick={() => createMutation.mutate(templateForm)}
                disabled={createMutation.isPending || !templateForm.nom}
              >
                Créer
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className="space-y-2">
        {templates.length === 0 ? (
          <Card className="p-6 text-center">
            <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Aucun modèle créé</p>
          </Card>
        ) : (
          templates.map((template) => (
            <Card key={template.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{template.nom}</h4>
                  <p className="text-xs text-muted-foreground mt-1 capitalize">{template.type}</p>
                  {template.items && template.items.length > 0 && (
                    <div className="mt-3 space-y-1 text-xs">
                      {template.items.map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between text-muted-foreground">
                          <span>{item.label}</span>
                          <span className="font-mono">
                            {item.valeur}
                            {item.type === "percentage" ? "%" : "€"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Button variant="ghost" size="icon">
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteMutation.mutate(template.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
