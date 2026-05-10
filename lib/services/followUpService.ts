import { supabase } from "@/lib/supabase";
import { FollowUpTask } from "@/types";

async function resolveClusterFilter(clusterFilter?: string) {
  if (!clusterFilter) {
    return undefined;
  }

  if (!clusterFilter.startsWith("name:")) {
    return clusterFilter;
  }

  const clusterName = clusterFilter.slice(5);
  const { data, error } = await supabase
    .from("clusters")
    .select("id")
    .ilike("name", clusterName)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data?.id ?? null;
}

export async function getFollowUpTasks(clusterId?: string, status?: string): Promise<FollowUpTask[]> {
  const resolvedClusterId = await resolveClusterFilter(clusterId);
  if (resolvedClusterId === null) {
    return [];
  }

  let query = supabase
    .from("follow_up_tasks")
    .select("*, member:members(id,first_name,last_name), cluster:clusters(id,name)")
    .order("created_at", { ascending: false });

  if (resolvedClusterId) {
    query = query.eq("cluster_id", resolvedClusterId);
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

export async function deleteFollowUpTask(id: string): Promise<void> {
  const { error } = await supabase.from("follow_up_tasks").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}

export async function getFollowUpTasksPaginated(params: {
  clusterId?: string;
  status?: string;
  page: number;
  rowsPerPage: number;
}): Promise<{ data: FollowUpTask[]; count: number }> {
  const resolvedClusterId = await resolveClusterFilter(params.clusterId);
  if (resolvedClusterId === null) {
    return { data: [], count: 0 };
  }

  let query = supabase
    .from("follow_up_tasks")
    .select("*, member:members(id,first_name,last_name), cluster:clusters(id,name)", { count: "exact" })
    .order("created_at", { ascending: false });

  if (resolvedClusterId) {
    query = query.eq("cluster_id", resolvedClusterId);
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
