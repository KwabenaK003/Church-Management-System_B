import { z } from "zod";

import { supabaseAdmin } from "@/lib/supabase-admin";
import {
  handleRouteError,
  jsonSuccess,
  parseJson,
  parseNumberParam,
  requireApiUser,
} from "@/lib/api/server";

const expenseSchema = z.object({
  category_id: z.string().uuid().optional().or(z.literal("")),
  description: z.string().min(1, "Description is required"),
  amount: z.number().positive(),
  payment_method: z.enum([
    "cash",
    "mobile_money",
    "bank_transfer",
    "cheque",
    "online",
  ]),
  expense_date: z.string(),
  notes: z.string().optional(),
});

export async function GET(request: Request) {
  const auth = await requireApiUser();
  if ("response" in auth) {
    return auth.response;
  }

  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year");
    const month = searchParams.get("month");
    const pageParam = searchParams.get("page");
    const rowsPerPageParam = searchParams.get("rowsPerPage");

    let query = supabaseAdmin
      .from("expenses")
      .select("*, category:expense_categories(id,name)", { count: "exact" })
      .order("expense_date", { ascending: false });

    if (year) {
      query = query
        .gte("expense_date", `${year}-01-01`)
        .lte("expense_date", `${year}-12-31`);
    }

    if (month) {
      const resolvedYear = year ?? `${new Date().getFullYear()}`;
      const monthNumber = Number(month);
      const monthStr = String(monthNumber).padStart(2, "0");
      const lastDay = new Date(Number(resolvedYear), monthNumber, 0).getDate();
      query = query
        .gte("expense_date", `${resolvedYear}-${monthStr}-01`)
        .lte("expense_date", `${resolvedYear}-${monthStr}-${lastDay}`);
    }

    if (pageParam && rowsPerPageParam) {
      const page = parseNumberParam(pageParam, 1);
      const rowsPerPage = parseNumberParam(rowsPerPageParam, 10);
      const from = (page - 1) * rowsPerPage;
      query = query.range(from, from + rowsPerPage - 1);
    }

    const { data, error, count } = await query;
    if (error) {
      throw new Error(error.message);
    }

    if (pageParam && rowsPerPageParam) {
      return jsonSuccess({ data: data ?? [], count: count ?? 0 });
    }

    return jsonSuccess(data ?? []);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  const auth = await requireApiUser();
  if ("response" in auth) {
    return auth.response;
  }

  try {
    const payload = await parseJson(request, expenseSchema);
    const row = {
      ...payload,
      category_id: payload.category_id || undefined,
    };

    const { data, error } = await supabaseAdmin
      .from("expenses")
      .insert(row)
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return jsonSuccess(data, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
