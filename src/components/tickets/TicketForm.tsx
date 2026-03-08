"use client";

import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { useRouter } from "next/navigation";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const ticketFormSchema = z.object({
  category: z.enum(["plumbing", "electrical", "hvac", "structural", "other"], {
    message: "Select a category.",
  }),
  description: z.string().min(10, "Description must be at least 10 characters.").max(2000),
  images: z.array(z.instanceof(File)).max(5, "You can upload up to 5 images."),
  priority: z.enum(["low", "medium", "high", "critical"], {
    message: "Select a priority.",
  }),
  title: z.string().min(3, "Title must be at least 3 characters.").max(120),
});

type TicketFormValues = z.infer<typeof ticketFormSchema>;

type CreateTicketResponse = {
  id?: number | string;
};

const defaultValues: TicketFormValues = {
  category: "other",
  description: "",
  images: [],
  priority: "medium",
  title: "",
};

const extractErrorMessage = async (response: Response): Promise<string> => {
  try {
    const body = (await response.json()) as { errors?: Array<{ message?: string }>; message?: string };
    const firstError = body.errors?.[0]?.message;

    if (firstError) {
      return firstError;
    }

    if (body.message) {
      return body.message;
    }
  } catch {
    // ignore parsing errors and fall through to generic message
  }

  return "Request failed. Please try again.";
};

const cleanupUploadedMedia = async (mediaIds: Array<number | string>) => {
  await Promise.allSettled(
    mediaIds.map(async (id) => {
      await fetch(`/api/media/${id}`, {
        credentials: "include",
        method: "DELETE",
      });
    }),
  );
};

export const TicketForm = () => {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<TicketFormValues>({
    defaultValues,
    resolver: zodResolver(ticketFormSchema),
  });

  const watchedImages = form.watch("images");
  const previews = useMemo(
    () =>
      watchedImages.map((file) => ({
        name: file.name,
        url: URL.createObjectURL(file),
      })),
    [watchedImages],
  );

  useEffect(() => {
    return () => {
      previews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [previews]);

  const onSubmit = async (values: TicketFormValues) => {
    setSubmitError(null);
    const uploadedMediaIds: Array<number | string> = [];

    try {
      for (const file of values.images) {
        const formData = new FormData();
        formData.append("file", file);

        const uploadResponse = await fetch("/api/media", {
          body: formData,
          credentials: "include",
          method: "POST",
        });

        if (!uploadResponse.ok) {
          throw new Error(await extractErrorMessage(uploadResponse));
        }

        const uploadData = (await uploadResponse.json()) as { id?: number | string };

        if (!uploadData.id) {
          throw new Error("Media upload succeeded but no media id was returned.");
        }

        uploadedMediaIds.push(uploadData.id);
      }

      const response = await fetch("/api/tickets", {
        body: JSON.stringify({
          category: values.category,
          description: values.description,
          images: uploadedMediaIds.map((id) => ({ image: id })),
          priority: values.priority,
          title: values.title,
        }),
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      if (!response.ok) {
        throw new Error(await extractErrorMessage(response));
      }

      await response.json().catch(() => ({} as CreateTicketResponse));
      router.push("/tickets");
      router.refresh();
    } catch (error) {
      if (uploadedMediaIds.length > 0) {
        await cleanupUploadedMedia(uploadedMediaIds);
      }
      const message = error instanceof Error ? error.message : "Unable to create ticket.";
      setSubmitError(message);
    }
  };

  return (
    <Card className="mx-auto w-full max-w-3xl">
      <CardHeader>
        <CardTitle>Report a maintenance issue</CardTitle>
        <CardDescription>Provide enough context so your property team can take action quickly.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" id="ticket-form" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label htmlFor="ticket-title">Title</Label>
            <Input
              aria-invalid={Boolean(form.formState.errors.title)}
              id="ticket-title"
              placeholder="Leaking sink in kitchen"
              {...form.register("title")}
            />
            {form.formState.errors.title ? (
              <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="ticket-description">Description</Label>
            <Textarea
              aria-invalid={Boolean(form.formState.errors.description)}
              id="ticket-description"
              placeholder="Water is dripping constantly from the pipe under the sink."
              rows={5}
              {...form.register("description")}
            />
            {form.formState.errors.description ? (
              <p className="text-sm text-destructive">{form.formState.errors.description.message}</p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ticket-category">Category</Label>
              <Controller
                control={form.control}
                name="category"
                render={({ field }) => (
                  <Select items={[]} onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="w-full" id="ticket-category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="plumbing">Plumbing</SelectItem>
                        <SelectItem value="electrical">Electrical</SelectItem>
                        <SelectItem value="hvac">HVAC</SelectItem>
                        <SelectItem value="structural">Structural</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                )}
              />
              {form.formState.errors.category ? (
                <p className="text-sm text-destructive">{form.formState.errors.category.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="ticket-priority">Priority</Label>
              <Controller
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <Select items={[]} onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="w-full" id="ticket-priority">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                )}
              />
              {form.formState.errors.priority ? (
                <p className="text-sm text-destructive">{form.formState.errors.priority.message}</p>
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ticket-images">Images (optional, up to 5)</Label>
            <Input
              accept="image/jpeg,image/png,image/webp"
              id="ticket-images"
              multiple
              onChange={(event) => {
                const files = Array.from(event.target.files ?? []);
                form.setValue("images", files, {
                  shouldDirty: true,
                  shouldValidate: true,
                });
              }}
              type="file"
            />
            {form.formState.errors.images ? (
              <p className="text-sm text-destructive">{form.formState.errors.images.message}</p>
            ) : null}
            {previews.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {previews.map((preview) => (
                  <div className="overflow-hidden rounded-md border bg-muted" key={preview.url}>
                    <Image
                      alt={preview.name}
                      className="h-28 w-full object-cover"
                      height={112}
                      src={preview.url}
                      unoptimized
                      width={220}
                    />
                    <p className="truncate px-2 py-1 text-xs text-muted-foreground">{preview.name}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          {submitError ? <p className="text-sm text-destructive">{submitError}</p> : null}
        </form>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button onClick={() => router.push("/tickets")} type="button" variant="outline">
          Cancel
        </Button>
        <Button disabled={form.formState.isSubmitting} form="ticket-form" type="submit">
          {form.formState.isSubmitting ? "Submitting..." : "Submit request"}
        </Button>
      </CardFooter>
    </Card>
  );
};
