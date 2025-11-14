import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertContactSchema, type InsertContact } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Info, Calculator, HelpCircle } from "lucide-react";

interface ContactFormProps {
  propertyId?: string;
  defaultType?: string;
}

export function ContactForm({ propertyId, defaultType = "general" }: ContactFormProps) {
  const { toast } = useToast();

  const form = useForm<InsertContact>({
    resolver: zodResolver(insertContactSchema),
    defaultValues: {
      nom: "",
      email: "",
      telephone: "",
      sujet: "",
      message: "",
      type: defaultType,
      propertyId: propertyId || undefined,
      consentRGPD: false,
    },
  });

  const createContact = useMutation({
    mutationFn: async (data: InsertContact) =>
      apiRequest("POST", "/api/contacts", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      toast({
        title: "Message envoyé",
        description: "Nous vous répondrons dans les plus brefs délais.",
      });
      form.reset();
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue. Veuillez réessayer.",
        variant: "destructive",
      });
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((data) => createContact.mutate(data))}
        className="space-y-4"
      >
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type de demande</FormLabel>
              <FormControl>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Button
                    type="button"
                    variant={field.value === 'information' ? 'default' : 'outline'}
                    className="h-auto py-3 flex-col gap-2 border-2 border-black/80"
                    onClick={() => field.onChange('information')}
                    data-testid="button-type-information"
                  >
                    <Info className="h-4 w-4" />
                    <span className="text-xs">Demande d'information</span>
                  </Button>
                  <Button
                    type="button"
                    variant={field.value === 'estimation' ? 'default' : 'outline'}
                    className="h-auto py-3 flex-col gap-2 border-2 border-black/80"
                    onClick={() => field.onChange('estimation')}
                    data-testid="button-type-estimation"
                  >
                    <Calculator className="h-4 w-4" />
                    <span className="text-xs">Estimation de bien</span>
                  </Button>
                  <Button
                    type="button"
                    variant={field.value === 'general' ? 'default' : 'outline'}
                    className="h-auto py-3 flex-col gap-2 border-2 border-black/80"
                    onClick={() => field.onChange('general')}
                    data-testid="button-type-general"
                  >
                    <HelpCircle className="h-4 w-4" />
                    <span className="text-xs">Question générale</span>
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="nom"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom complet</FormLabel>
              <FormControl>
                <Input placeholder="Jean Dupont" {...field} data-testid="input-contact-nom" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="jean@example.com" {...field} data-testid="input-contact-email" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="telephone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Téléphone</FormLabel>
                <FormControl>
                  <Input placeholder="06 12 34 56 78" {...field} data-testid="input-contact-telephone" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="sujet"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sujet</FormLabel>
              <FormControl>
                <Input placeholder="Sujet de votre demande" {...field} data-testid="input-sujet" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Message</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Détaillez votre demande..."
                  className="resize-none"
                  rows={4}
                  {...field}
                  data-testid="textarea-contact-message"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="consentRGPD"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  data-testid="checkbox-consent-rgpd-contact"
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="text-sm font-normal">
                  J'accepte que mes données personnelles soient utilisées pour traiter ma demande de contact. *
                </FormLabel>
                <FormDescription className="text-xs">
                  Vos données sont traitées conformément à notre politique de confidentialité et ne seront jamais partagées avec des tiers.
                </FormDescription>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full"
          disabled={createContact.isPending}
          data-testid="button-submit-contact"
        >
          {createContact.isPending ? "Envoi en cours..." : "Envoyer le message"}
        </Button>
      </form>
    </Form>
  );
}
