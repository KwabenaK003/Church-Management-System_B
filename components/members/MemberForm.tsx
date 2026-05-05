"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Member } from "@/types";
import { useCreateMember } from "@/lib/hooks/useMembers";

interface MemberFormProps {
  initialData?: Partial<Member>;
  onSuccess?: () => void;
}

const EMPTY_MEMBER_FORM: Partial<Member> = {};

export function MemberForm({
  initialData = EMPTY_MEMBER_FORM,
  onSuccess,
}: MemberFormProps) {
  const [form, setForm] = useState({
    first_name: initialData.first_name ?? "",
    last_name: initialData.last_name ?? "",
    email: initialData.email ?? "",
    phone: initialData.phone ?? "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const router = useRouter();

  const createMember = useCreateMember();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(undefined);

    try {
      await createMember.mutateAsync(form as any);
      onSuccess?.();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1 text-sm font-medium text-slate-600">
          <Input
            id="member-first-name"
            label="First name"
            name="first_name"
            value={form.first_name}
            onChange={(e) => setForm({ ...form, first_name: e.target.value })}
            required
          />
        </div>
        <div className="flex flex-col gap-1 text-sm font-medium text-slate-600">
          <Input
            id="member-last-name"
            label="Last name"
            name="last_name"
            value={form.last_name}
            onChange={(e) => setForm({ ...form, last_name: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1 text-sm font-medium text-slate-600">
          <Input
            id="member-email"
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
        </div>
        <div className="flex flex-col gap-1 text-sm font-medium text-slate-600">
          <Input
            id="member-phone"
            label="Phone"
            name="phone"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            required
          />
        </div>
      </div>


      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end">
        <Button type="submit" className="w-full sm:w-auto" disabled={loading}>
          {loading ? "Saving…" : "Create member"}
        </Button>
      </div>
    </form>
  );
}
