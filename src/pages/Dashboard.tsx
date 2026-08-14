import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/use-auth";
import {
  DEFAULT_REASONS,
  OTHER_REASON,
  OUTREACH_STATUSES,
  normalizeLocation,
  todayISO,
} from "@/lib/outreach";
import { ExternalLink, Inbox, Loader2, LogOut, Pencil, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router";

type Entry = Doc<"outreachEntries">;

interface FormValues {
  projectName: string;
  contact: string;
  dateContacted: string;
  status: string;
  reason: string;
  customReason: string;
  outreachLocation: string;
  notes: string;
}

type FormErrors = Partial<Record<keyof FormValues, string>>;

const emptyForm: FormValues = {
  projectName: "",
  contact: "",
  dateContacted: todayISO(),
  status: "",
  reason: "",
  customReason: "",
  outreachLocation: "",
  notes: "",
};

function entryToForm(entry: Entry): FormValues {
  return {
    projectName: entry.projectName,
    contact: entry.contact ?? "",
    dateContacted: entry.dateContacted,
    status: entry.status,
    reason: entry.reason,
    customReason: "",
    outreachLocation: entry.outreachLocation ?? "",
    notes: entry.notes ?? "",
  };
}

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {};
  if (!values.projectName.trim()) errors.projectName = "Project name is required";
  if (!values.dateContacted) errors.dateContacted = "Date is required";
  if (!values.status) errors.status = "Select a status";
  if (!values.reason) errors.reason = "Select a reason";
  if (values.reason === OTHER_REASON && !values.customReason.trim()) {
    errors.customReason = "Type a reason";
  }
  return errors;
}

/** Monochrome dot treatment for each status — restrained, no color. */
const STATUS_DOT: Record<string, string> = {
  "No response": "bg-muted-foreground/25",
  Replied: "bg-muted-foreground/60",
  "In talks": "bg-muted-foreground ring-1 ring-muted-foreground/60",
  "Deal closed": "bg-foreground",
  Rejected: "bg-muted-foreground/15",
};

function StatusTag({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center gap-2 text-[10px] font-medium tracking-[0.14em] uppercase ${
        status === "Deal closed" ? "text-foreground" : "text-muted-foreground"
      }`}
    >
      <span className={`size-1.5 rounded-full ${STATUS_DOT[status] ?? "bg-muted-foreground/40"}`} />
      {status}
    </span>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 text-xs text-destructive">{message}</p>;
}

interface FieldsProps {
  values: FormValues;
  errors: FormErrors;
  reasonOptions: string[];
  onChange: (patch: Partial<FormValues>) => void;
}

function EntryFields({ values, errors, reasonOptions, onChange }: FieldsProps) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="projectName" className="text-[11px] font-medium tracking-[0.12em] text-muted-foreground uppercase">
          Project name <span className="text-foreground">*</span>
        </Label>
        <Input
          id="projectName"
          placeholder="e.g. Aurora Labs"
          value={values.projectName}
          onChange={(e) => onChange({ projectName: e.target.value })}
        />
        <FieldError message={errors.projectName} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="contact" className="text-[11px] font-medium tracking-[0.12em] text-muted-foreground uppercase">
          Contact
        </Label>
        <Input
          id="contact"
          placeholder="John Doe"
          value={values.contact}
          onChange={(e) => onChange({ contact: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="dateContacted" className="text-[11px] font-medium tracking-[0.12em] text-muted-foreground uppercase">
          Date contacted <span className="text-foreground">*</span>
        </Label>
        <Input
          id="dateContacted"
          type="date"
          value={values.dateContacted}
          onChange={(e) => onChange({ dateContacted: e.target.value })}
        />
        <FieldError message={errors.dateContacted} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="status" className="text-[11px] font-medium tracking-[0.12em] text-muted-foreground uppercase">
          Status <span className="text-foreground">*</span>
        </Label>
        <Select value={values.status} onValueChange={(v) => onChange({ status: v })}>
          <SelectTrigger id="status" className="w-full">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent position="popper" className="w-[var(--radix-select-trigger-width)]">
            {OUTREACH_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError message={errors.status} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="reason" className="text-[11px] font-medium tracking-[0.12em] text-muted-foreground uppercase">
          Reason for outreach <span className="text-foreground">*</span>
        </Label>
        <Select value={values.reason} onValueChange={(v) => onChange({ reason: v, customReason: "" })}>
          <SelectTrigger id="reason" className="w-full">
            <SelectValue placeholder="Select reason" />
          </SelectTrigger>
          <SelectContent position="popper" className="w-[var(--radix-select-trigger-width)]">
            {reasonOptions.map((r) => (
              <SelectItem key={r} value={r}>
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError message={errors.reason} />
        {values.reason === OTHER_REASON && (
          <div className="space-y-2 pt-1">
            <Input
              placeholder="Type a custom reason"
              value={values.customReason}
              autoFocus
              onChange={(e) => onChange({ customReason: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Saved for future entries.
            </p>
            <FieldError message={errors.customReason} />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="outreachLocation" className="text-[11px] font-medium tracking-[0.12em] text-muted-foreground uppercase">
          Outreach location
        </Label>
        <Input
          id="outreachLocation"
          placeholder="t.me/username"
          value={values.outreachLocation}
          onChange={(e) => onChange({ outreachLocation: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">
          Missing <span className="font-mono">https://</span> is added automatically.
        </p>
      </div>

      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="notes" className="text-[11px] font-medium tracking-[0.12em] text-muted-foreground uppercase">
          Notes
        </Label>
        <Textarea
          id="notes"
          rows={3}
          placeholder="Anything worth remembering about this conversation…"
          value={values.notes}
          onChange={(e) => onChange({ notes: e.target.value })}
        />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState<FormValues>(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const [editing, setEditing] = useState<Entry | null>(null);
  const [editValues, setEditValues] = useState<FormValues | null>(null);
  const [editErrors, setEditErrors] = useState<FormErrors>({});
  const [editSaving, setEditSaving] = useState(false);
  const [deleting, setDeleting] = useState<Entry | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const entries = useQuery(api.outreach.listEntries);
  const customReasons = useQuery(api.outreach.listReasons);

  const addEntry = useMutation(api.outreach.addEntry);
  const updateEntry = useMutation(api.outreach.updateEntry);
  const deleteEntry = useMutation(api.outreach.deleteEntry);

  const reasonOptions = useMemo(() => {
    const base = [...DEFAULT_REASONS, ...(customReasons ?? [])];
    const current = editing?.reason;
    if (current && !base.includes(current)) return [...base, current];
    return base;
  }, [customReasons, editing]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const patchForm = (patch: Partial<FormValues>) => setForm((f) => ({ ...f, ...patch }));

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      const isCustom = form.reason === OTHER_REASON;
      await addEntry({
        projectName: form.projectName,
        contact: form.contact || undefined,
        dateContacted: form.dateContacted,
        status: form.status,
        reason: isCustom ? form.customReason.trim() : form.reason,
        outreachLocation: normalizeLocation(form.outreachLocation) || undefined,
        notes: form.notes || undefined,
        saveReason: isCustom,
      });
      setForm(emptyForm);
      setErrors({});
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (entry: Entry) => {
    setEditing(entry);
    setEditValues(entryToForm(entry));
    setEditErrors({});
  };

  const handleSaveEdit = async () => {
    if (!editing || !editValues) return;
    const nextErrors = validate(editValues);
    setEditErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setEditSaving(true);
    try {
      const isCustom = editValues.reason === OTHER_REASON;
      await updateEntry({
        id: editing._id,
        projectName: editValues.projectName,
        contact: editValues.contact || undefined,
        dateContacted: editValues.dateContacted,
        status: editValues.status,
        reason: isCustom ? editValues.customReason.trim() : editValues.reason,
        outreachLocation: normalizeLocation(editValues.outreachLocation) || undefined,
        notes: editValues.notes || undefined,
        saveReason: isCustom,
      });
      setEditing(null);
      setEditValues(null);
    } finally {
      setEditSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await deleteEntry({ id: deleting._id });
      setDeleting(null);
    } finally {
      setDeleteBusy(false);
    }
  };

  const loading = entries === undefined || customReasons === undefined;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-3xl px-6 py-12 sm:py-16">
        {/* Header */}
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-baseline gap-3">
            <span className="text-lg font-semibold tracking-tight">InTrack</span>
            <span className="hidden text-xs text-muted-foreground sm:inline">
              Web3 BD outreach log
            </span>
          </div>
          <div className="flex items-center gap-3">
            {user?.email && (
              <span className="hidden max-w-[180px] truncate text-xs text-muted-foreground md:inline">
                {user.email}
              </span>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-1.5 text-muted-foreground hover:text-foreground"
              onClick={handleSignOut}
            >
              <LogOut className="size-3.5" />
              Sign out
            </Button>
          </div>
        </header>

        {/* Form */}
        <section className="mt-12">
          <div className="rounded-md border border-border/80">
            <div className="border-b border-border/80 px-6 py-5">
              <h2 className="text-sm font-medium tracking-tight">Log outreach</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Record a touchpoint, then track it through your pipeline.
              </p>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-6">
              <EntryFields
                values={form}
                errors={errors}
                reasonOptions={reasonOptions}
                onChange={patchForm}
              />
              <div className="mt-6 flex justify-end border-t border-border/60 pt-5">
                <Button type="submit" disabled={submitting || loading}>
                  {submitting && <Loader2 className="size-4 animate-spin" />}
                  Log entry
                </Button>
              </div>
            </form>
          </div>
        </section>

        {/* Entries */}
        <section className="mt-14">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-sm font-medium tracking-tight">Entries</h2>
            {entries && (
              <span className="text-xs text-muted-foreground">
                {entries.length} {entries.length === 1 ? "entry" : "entries"}
              </span>
            )}
          </div>

          <div className="rounded-md border border-border/80">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="size-5 animate-spin text-muted-foreground/60" />
              </div>
            ) : entries.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
                <Inbox className="size-6 text-muted-foreground/40" />
                <p className="mt-4 text-sm font-medium text-foreground/80">
                  No outreach logged yet
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Your first entry will appear here, newest first.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-border/60">
                {entries.map((entry) => {
                  const location = entry.outreachLocation;
                  return (
                    <li key={entry._id} className="group px-6 py-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          {location ? (
                            <a
                              href={location}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-sm font-medium tracking-tight hover:text-muted-foreground"
                            >
                              {entry.projectName}
                              <ExternalLink className="size-3 text-muted-foreground/50" />
                            </a>
                          ) : (
                            <span className="text-sm font-medium tracking-tight">
                              {entry.projectName}
                            </span>
                          )}
                          <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-muted-foreground">
                            {entry.contact && <span>{entry.contact}</span>}
                            {entry.contact && (
                              <span className="text-muted-foreground/30">·</span>
                            )}
                            <span>{format(parseISO(entry.dateContacted), "MMM d, yyyy")}</span>
                            <span className="text-muted-foreground/30">·</span>
                            <span>{entry.reason}</span>
                          </div>
                          {entry.notes && (
                            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground/80">
                              {entry.notes}
                            </p>
                          )}
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <StatusTag status={entry.status} />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            className="text-muted-foreground opacity-60 transition-opacity hover:text-foreground group-hover:opacity-100"
                            aria-label={`Edit ${entry.projectName}`}
                            onClick={() => openEdit(entry)}
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            className="text-muted-foreground opacity-60 transition-opacity hover:text-destructive group-hover:opacity-100"
                            aria-label={`Delete ${entry.projectName}`}
                            onClick={() => setDeleting(entry)}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>

        <footer className="mt-16 border-t border-border/60 pt-6 text-xs text-muted-foreground/70">
          InTrack — every conversation, accounted for.
        </footer>
      </div>

      {/* Edit dialog */}
      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit entry</DialogTitle>
            <DialogDescription>
              Update the outreach details for this project.
            </DialogDescription>
          </DialogHeader>
          {editing && editValues && (
            <div className="py-2">
              <EntryFields
                values={editValues}
                errors={editErrors}
                reasonOptions={reasonOptions}
                onChange={(patch) => setEditValues((v) => (v ? { ...v, ...patch } : v))}
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)} disabled={editSaving}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={editSaving || !editValues}>
              {editSaving && <Loader2 className="size-4 animate-spin" />}
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && !deleteBusy && setDeleting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete entry?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes{" "}
              <span className="font-medium text-foreground">
                {deleting?.projectName}
              </span>{" "}
              from your log. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteBusy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={deleteBusy}
            >
              {deleteBusy && <Loader2 className="size-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
