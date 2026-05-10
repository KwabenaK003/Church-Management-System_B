import { Cluster } from "@/types";

export const DEFAULT_DEPARTMENT_NAMES = [
  "MUSIC DEPARTMENT",
  "SABBATH SCHOOL DEPARTMENT",
  "PERSONAL MINISTRIES DEPARTMENT",
  "YOUNG LADIES DEPARTMENT",
  "AMM DEPARTMENT",
  "YOUNG ADULT DEPARTMENT",
] as const;

function normalizeDepartmentName(name: string) {
  return name.trim().toLowerCase();
}

export function getDepartmentLabel(name: string) {
  const normalizedName = normalizeDepartmentName(name);
  const matchingDefault = DEFAULT_DEPARTMENT_NAMES.find(
    (department) => normalizeDepartmentName(department) === normalizedName,
  );

  return matchingDefault ?? name;
}

export function buildDepartmentOptions(
  clusters: Cluster[] | undefined,
  emptyLabel: string,
) {
  const existingDepartmentNames = new Set(
    (clusters ?? []).map((cluster) => normalizeDepartmentName(cluster.name)),
  );

  return [
    { value: "", label: emptyLabel },
    ...((clusters ?? []).map((cluster) => ({
      value: cluster.id,
      label: getDepartmentLabel(cluster.name),
    })) ?? []),
    ...DEFAULT_DEPARTMENT_NAMES.filter(
      (department) =>
        !existingDepartmentNames.has(normalizeDepartmentName(department)),
    ).map((department) => ({
      value: `name:${department}`,
      label: department,
    })),
  ];
}
