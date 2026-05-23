import type { PermissionDTO } from "@/lib/api";
import { groupPermissionsByResource, resourceLabel } from "@/lib/adminPermissions";
import { Checkbox } from "@/components/ui/checkbox";

export function PermissionPicker({
  permissions,
  selectedIds,
  onChange,
  disabled,
}: {
  permissions: PermissionDTO[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
}) {
  const groups = groupPermissionsByResource(permissions);

  const toggle = (id: string, checked: boolean) => {
    if (checked) onChange([...selectedIds, id]);
    else onChange(selectedIds.filter((x) => x !== id));
  };

  const toggleGroup = (items: PermissionDTO[], checked: boolean) => {
    const ids = items.map((p) => p.id);
    if (checked) onChange(Array.from(new Set([...selectedIds, ...ids])));
    else onChange(selectedIds.filter((id) => !ids.includes(id)));
  };

  return (
    <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
      {groups.map(([resource, items]) => {
        const allSelected = items.every((p) => selectedIds.includes(p.id));
        const someSelected = items.some((p) => selectedIds.includes(p.id));
        return (
          <div key={resource} className="rounded-lg border bg-surface/50 p-3 space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
              <Checkbox
                checked={allSelected}
                disabled={disabled}
                onCheckedChange={(v) => toggleGroup(items, v === true)}
                className={someSelected && !allSelected ? "opacity-60" : undefined}
              />
              {resourceLabel(resource)}
            </label>
            <div className="pl-6 space-y-1.5">
              {items.map((p) => (
                <label key={p.id} className="flex items-start gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={selectedIds.includes(p.id)}
                    disabled={disabled}
                    onCheckedChange={(v) => toggle(p.id, v === true)}
                    className="mt-0.5"
                  />
                  <span>
                    <span className="font-mono text-xs text-muted-foreground">{p.code}</span>
                    {p.description && (
                      <span className="block text-xs text-muted-foreground">{p.description}</span>
                    )}
                  </span>
                </label>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
