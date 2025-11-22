import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Edit2, FileText, Eye } from "lucide-react";
import { SitePdf } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";

export function ConfigPdfsAdmin() {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<SitePdf>>({});
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    nom: "",
    description: "",
    url: "",
    type: "bareme" as const,
  });

  const { data: pdfs = [] } = useQuery<SitePdf[]>({
    queryKey: ["/api/site-pdfs"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/site-pdfs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Erreur");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/site-pdfs"] });
      toast({ title: "Document ajouté" });
      setShowForm(false);
      setFormData({ nom: "", description: "", url: "", type: "bareme" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/site-pdfs/${data.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Erreur");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/site-pdfs"] });
      toast({ title: "Document mis à jour" });
      setIsEditing(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/site-pdfs/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Erreur");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/site-pdfs"] });
      toast({ title: "Document supprimé" });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async (pdf: SitePdf) => {
      const res = await fetch(`/api/site-pdfs/${pdf.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ actif: !pdf.actif }),
      });
      if (!res.ok) throw new Error("Erreur");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/site-pdfs"] });
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Documents légaux (PDFs)</h3>
        <Button
          size="sm"
          onClick={() => setShowForm(!showForm)}
          data-testid="button-add-pdf"
        >
          <Plus className="h-4 w-4 mr-1" />
          Ajouter un document
        </Button>
      </div>

      {showForm && (
        <Card className="bg-muted/50 p-4">
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Titre du document</label>
              <input
                type="text"
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                className="w-full mt-1 px-3 py-2 border rounded text-sm"
                placeholder="ex: Barème de tarifs 2024"
                data-testid="input-pdf-nom"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description (optionnelle)</label>
              <input
                type="text"
                value={formData.description || ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full mt-1 px-3 py-2 border rounded text-sm"
                placeholder="ex: Tarifs appliqués en 2024"
                data-testid="input-pdf-description"
              />
            </div>
            <div>
              <label className="text-sm font-medium">URL du PDF</label>
              <input
                type="text"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                className="w-full mt-1 px-3 py-2 border rounded text-sm"
                placeholder="https://example.com/document.pdf"
                data-testid="input-pdf-url"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full mt-1 px-3 py-2 border rounded text-sm"
                data-testid="select-pdf-type"
              >
                <option value="bareme">Barème de tarifs</option>
                <option value="mentions_legales">Mentions légales</option>
                <option value="conditions">Conditions générales</option>
                <option value="autre">Autre</option>
              </select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowForm(false)}
              >
                Annuler
              </Button>
              <Button
                size="sm"
                onClick={() => createMutation.mutate(formData)}
                disabled={createMutation.isPending || !formData.nom || !formData.url}
              >
                {createMutation.isPending ? "Création..." : "Créer"}
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className="space-y-2">
        {pdfs.length === 0 ? (
          <Card className="p-6 text-center">
            <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Aucun document ajouté</p>
          </Card>
        ) : (
          pdfs.map((pdf) => (
            <Card key={pdf.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-accent" />
                    <h4 className="font-medium text-sm">{pdf.nom}</h4>
                    {!pdf.actif && (
                      <span className="text-xs bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded text-gray-600 dark:text-gray-400">
                        Inactif
                      </span>
                    )}
                  </div>
                  {pdf.description && (
                    <p className="text-xs text-muted-foreground mt-1">{pdf.description}</p>
                  )}
                  <div className="text-xs text-muted-foreground mt-2 font-mono break-all">
                    {pdf.url}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Type: <span className="font-medium">{pdf.type}</span>
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      toggleActiveMutation.mutate(pdf)
                    }
                    title={pdf.actif ? "Désactiver" : "Activer"}
                  >
                    <Eye className={`h-4 w-4 ${!pdf.actif ? "opacity-50" : ""}`} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setIsEditing(pdf.id);
                      setEditData(pdf);
                    }}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteMutation.mutate(pdf.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>

              {isEditing === pdf.id && (
                <div className="mt-4 pt-4 border-t space-y-3">
                  <div>
                    <label className="text-sm font-medium">Titre</label>
                    <input
                      type="text"
                      value={editData.nom || ""}
                      onChange={(e) => setEditData({ ...editData, nom: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">URL</label>
                    <input
                      type="text"
                      value={editData.url || ""}
                      onChange={(e) => setEditData({ ...editData, url: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border rounded text-sm"
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(null)}
                    >
                      Annuler
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        updateMutation.mutate(editData);
                        setIsEditing(null);
                      }}
                      disabled={updateMutation.isPending}
                    >
                      {updateMutation.isPending ? "Mise à jour..." : "Mettre à jour"}
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
