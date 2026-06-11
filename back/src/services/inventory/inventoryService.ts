import { Op, Transaction } from 'sequelize';
import {
  ConsultationInventoryUsage,
  InventoryItem,
  sequelize,
} from '../../models';
import { BadRequest, Forbidden } from '../../utils/errors';

export type InventoryUsageInput = {
  inventoryItemId: string;
  quantity: number;
};

function toNum(v: unknown): number {
  return Number(v);
}

function assertInventoryReadPermission(permissions: string[], roles: string[]): void {
  if (roles.includes('admin') || permissions.includes('inventory.read')) return;
  throw Forbidden('Missing permission: inventory.read');
}

export function serializeInventoryItem(item: InventoryItem) {
  const quantity = toNum(item.quantity);
  const minQuantity = toNum(item.minQuantity);
  return {
    ...item.toJSON(),
    quantity,
    minQuantity,
    isLowStock: quantity <= minQuantity,
  };
}

export function serializeUsage(usage: ConsultationInventoryUsage & { inventoryItem?: InventoryItem }) {
  const result: Record<string, unknown> = {
    id: usage.id,
    consultationId: usage.consultationId,
    inventoryItemId: usage.inventoryItemId,
    quantity: toNum(usage.quantity),
  };
  if (usage.inventoryItem) {
    result.itemName = usage.inventoryItem.name;
    result.unit = usage.inventoryItem.unit;
  }
  return result;
}

async function lockItems(
  brandingId: string,
  itemIds: string[],
  transaction: Transaction,
): Promise<Map<string, InventoryItem>> {
  const uniqueIds = [...new Set(itemIds)];
  if (!uniqueIds.length) return new Map();

  const items = await InventoryItem.findAll({
    where: { id: { [Op.in]: uniqueIds }, brandingId, active: true },
    transaction,
    lock: transaction.LOCK.UPDATE,
  });

  const map = new Map(items.map((i) => [i.id, i]));
  for (const id of uniqueIds) {
    if (!map.has(id)) throw BadRequest(`Insumo no encontrado o inactivo: ${id}`);
  }
  return map;
}

export async function applyInventoryUsages(opts: {
  consultationId: string;
  brandingId: string;
  usages: InventoryUsageInput[];
  transaction: Transaction;
}): Promise<void> {
  const { consultationId, brandingId, usages, transaction } = opts;
  if (!usages.length) return;

  const merged = new Map<string, number>();
  for (const u of usages) {
    if (u.quantity <= 0) throw BadRequest('La cantidad debe ser mayor a cero');
    merged.set(u.inventoryItemId, (merged.get(u.inventoryItemId) ?? 0) + u.quantity);
  }

  const itemMap = await lockItems(brandingId, [...merged.keys()], transaction);

  for (const [itemId, qty] of merged) {
    const item = itemMap.get(itemId)!;
    const available = toNum(item.quantity);
    if (available < qty) {
      throw BadRequest(
        `Stock insuficiente: ${item.name} (disponible: ${available}, solicitado: ${qty})`,
      );
    }
    await item.update({ quantity: available - qty }, { transaction });
    await ConsultationInventoryUsage.create(
      { consultationId, inventoryItemId: itemId, quantity: qty },
      { transaction },
    );
  }
}

export async function restoreInventoryForConsultation(
  consultationId: string,
  brandingId: string,
  transaction: Transaction,
): Promise<void> {
  const usages = await ConsultationInventoryUsage.findAll({
    where: { consultationId },
    transaction,
  });
  if (!usages.length) return;

  const itemIds = usages.map((u) => u.inventoryItemId);
  const items = await InventoryItem.findAll({
    where: { id: { [Op.in]: itemIds }, brandingId },
    transaction,
    lock: transaction.LOCK.UPDATE,
  });
  const itemMap = new Map(items.map((i) => [i.id, i]));

  for (const usage of usages) {
    const item = itemMap.get(usage.inventoryItemId);
    if (!item) continue;
    await item.update({ quantity: toNum(item.quantity) + toNum(usage.quantity) }, { transaction });
  }

  await ConsultationInventoryUsage.destroy({ where: { consultationId }, transaction });
}

export async function syncInventoryUsages(opts: {
  consultationId: string;
  brandingId: string;
  newUsages: InventoryUsageInput[];
  transaction: Transaction;
}): Promise<void> {
  await restoreInventoryForConsultation(opts.consultationId, opts.brandingId, opts.transaction);
  await applyInventoryUsages({
    consultationId: opts.consultationId,
    brandingId: opts.brandingId,
    usages: opts.newUsages,
    transaction: opts.transaction,
  });
}

export async function getLowStockItems(brandingId: string): Promise<InventoryItem[]> {
  return InventoryItem.findAll({
    where: {
      brandingId,
      active: true,
      [Op.and]: sequelize.where(sequelize.col('quantity'), Op.lte, sequelize.col('min_quantity')),
    },
    order: [['quantity', 'ASC']],
  });
}

export async function restockItem(
  itemId: string,
  brandingId: string,
  addQuantity: number,
): Promise<InventoryItem> {
  if (addQuantity <= 0) throw BadRequest('La cantidad a agregar debe ser mayor a cero');

  return sequelize.transaction(async (transaction) => {
    const item = await InventoryItem.findOne({
      where: { id: itemId, brandingId },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!item) throw BadRequest('Insumo no encontrado');
    const current = toNum(item.quantity);
    await item.update({ quantity: current + addQuantity }, { transaction });
    return item;
  });
}

export async function handleInventoryUsagesOnSave(opts: {
  consultationId: string;
  brandingId: string;
  usages: InventoryUsageInput[] | undefined;
  permissions: string[];
  roles: string[];
  isUpdate: boolean;
  transaction: Transaction;
}): Promise<void> {
  const { consultationId, brandingId, usages, permissions, roles, isUpdate, transaction } = opts;
  const list = usages ?? [];

  if (list.length > 0) {
    assertInventoryReadPermission(permissions, roles);
  }

  if (isUpdate) {
    await syncInventoryUsages({ consultationId, brandingId, newUsages: list, transaction });
  } else if (list.length > 0) {
    await applyInventoryUsages({ consultationId, brandingId, usages: list, transaction });
  }
}

export async function loadConsultationUsages(consultationIds: string[]) {
  if (!consultationIds.length) return new Map<string, ReturnType<typeof serializeUsage>[]>();

  const rows = await ConsultationInventoryUsage.findAll({
    where: { consultationId: { [Op.in]: consultationIds } },
    include: [{ model: InventoryItem, as: 'inventoryItem', required: true }],
    order: [['createdAt', 'ASC']],
  });

  const map = new Map<string, ReturnType<typeof serializeUsage>[]>();
  for (const row of rows) {
    const key = row.consultationId;
    const list = map.get(key) ?? [];
    list.push(serializeUsage(row));
    map.set(key, list);
  }
  return map;
}
