"use client";

import { FormEvent, useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useCreateVisitor } from "@/lib/hooks/useVisitors";

export function VisitorForm() {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    invited_by: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>();

  const createVisitor = useCreateVisitor();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(undefined);

    try {
      await createVisitor.mutateAsync({
        ...form,
        visit_date: new Date().toISOString() as any,
        follow_up_status: "pending" as any,
      });

      setMessage("Visitor logged successfully");
      setForm({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        invited_by: "",
        notes: "",
      });
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1 text-sm font-medium text-slate-600">
          <Input
            id="visitor-first-name"
            label="First name"
            value={form.first_name}
            onChange={(e) => setForm({ ...form, first_name: e.target.value })}
            required
          />
        </div>
        <div className="flex flex-col gap-1 text-sm font-medium text-slate-600">
          <Input
            id="visitor-last-name"
            label="Last name"
            value={form.last_name}
            onChange={(e) => setForm({ ...form, last_name: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1 text-sm font-medium text-slate-600">
          <Input
            id="visitor-email"
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>
        <div className="flex flex-col gap-1 text-sm font-medium text-slate-600">
          <Input
            id="visitor-phone"
            label="Phone"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1 text-sm font-medium text-slate-600">
        <Input
          id="visitor-invited-by"
          label="Invited by"
          value={form.invited_by}
          onChange={(e) => setForm({ ...form, invited_by: e.target.value })}
        />
      </div>

      <div className="flex flex-col gap-1 text-sm font-medium text-slate-600">
        <label htmlFor="visitor-notes" className="text-sm font-medium text-slate-700">
          Notes
        </label>
        <textarea
          id="visitor-notes"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          className="border border-slate-200 rounded-lg px-4 py-2 font-normal text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
          rows={3}
        />
      </div>

      {message && <p className="text-sm text-slate-600">{message}</p>}

      <div className="flex justify-end">
        <Button type="submit" disabled={loading}>
          {loading ? "Logging..." : "Log visitor"}
        </Button>
      </div>
    </form>
  );
}
