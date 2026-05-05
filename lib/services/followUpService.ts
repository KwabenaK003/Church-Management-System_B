import { supabase } from "@/lib/supabase";
import { FollowUpTask } from "@/types";

export async function getFollowUpTasks(clusterId?: string, status?: string): Promise<FollowUpTask[]> {
  let query = supabase
    .from("follow_up_tasks")
    .select("*, member:members(id,first_name,last_name), cluster:clusters(id,name)")
    .order("created_at", { ascending: false });

  if (clusterId) {
    query = query.eq("cluster_id", clusterId);
  }
  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data as FollowUpTask[];
}

export async function createFollowUpTask(payload: Partial<FollowUpTask>): Promise<FollowUpTask> {
  const { data, error } = await supabase
    .from("follow_up_tasks")
    .insert(payload)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as FollowUpTask;
}

export async function updateFollowUpTask(id: string, payload: Partial<FollowUpTask>): Promise<FollowUpTask> {
  const { data, error } = await supabase
    .from("follow_up_tasks")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as FollowUpTask;
}

export async function getFollowUpTasksPaginated(params: {
  clusterId?: string;
  status?: string;
  page: number;
  rowsPerPage: number;
}): Promise<{ data: FollowUpTask[]; count: number }> {
  let query = supabase
    .from("follow_up_tasks")
    .select("*, member:members(id,first_name,last_name), cluster:clusters(id,name)", { count: "exact" })
    .order("created_at", { ascending: false });

  if (params.clusterId) {
    query = query.eq("cluster_id", params.clusterId);
  }
  if (params.status) {
    query = query.eq("status", params.status);
  }

  const from = (params.page - 1) * params.rowsPerPage;
  query = query.range(from, from + params.rowsPerPage - 1);

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);
  return { data: (data ?? []) as FollowUpTask[], count: count ?? 0 };
}
