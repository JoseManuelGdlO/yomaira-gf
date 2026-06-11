import { Request, Response } from 'express';
import { z } from 'zod';
import { InventoryItem } from '../models';
import { requireBrandingId, tenantWhere } from '../middleware/tenant';
import {
  getLowStockItems,
  restockItem,
  serializeInventoryItem,
} from '../services/inventory/inventoryService';
import { NotFound } from '../utils/errors';

async function findTenantItem(req: Request, id: string): Promise<InventoryItem> {
  const item = await InventoryItem.findOne({ where: { id, ...tenantWhere(req) } });
  if (!item) throw NotFound('Insumo no encontrado');
  return item;
}

export async function list(req: Request, res: Response): Promise<void> {
  const q = req.query as { lowStock?: string; active?: string };
  const brandingId = requireBrandingId(req);

  if (q.lowStock === 'true') {
    const items = await getLowStockItems(brandingId);
    res.json({ data: items.map(serializeInventoryItem) });
    return;
  }

  const where: Record<string, unknown> = { brandingId };
  if (q.active === 'true') where.active = true;
  if (q.active === 'false') where.active = false;

  const items = await InventoryItem.findAll({
    where,
    order: [
      ['active', 'DESC'],
      ['name', 'ASC'],
    ],
  });
  res.json({ data: items.map(serializeInventoryItem) });
}

export async function lowStock(req: Request, res: Response): Promise<void> {
  const brandingId = requireBrandingId(req);
  const items = await getLowStockItems(brandingId);
  res.json({ data: items.map(serializeInventoryItem) });
}

export async function get(req: Request, res: Response): Promise<void> {
  const item = await findTenantItem(req, req.params.id);
  res.json({ data: serializeInventoryItem(item) });
}

export const createSchema = z.object({
  name: z.string().min(1),
  unit: z.string().default('unidades'),
  quantity: z.number().min(0).default(0),
  minQuantity: z.number().min(0).default(5),
  category: z.string().default(''),
  active: z.boolean().default(true),
});

export const updateSchema = createSchema.partial();

export async function create(req: Request, res: Response): Promise<void> {
  const body = req.body as z.infer<typeof createSchema>;
  const item = await InventoryItem.create({ ...body, brandingId: req.user!.brandingId });
  res.status(201).json({ data: serializeInventoryItem(item) });
}

export async function update(req: Request, res: Response): Promise<void> {
  const item = await findTenantItem(req, req.params.id);
  await item.update(req.body);
  res.json({ data: serializeInventoryItem(item) });
}

export const restockSchema = z.object({
  addQuantity: z.number().positive(),
});

export async function restock(req: Request, res: Response): Promise<void> {
  const { addQuantity } = req.body as z.infer<typeof restockSchema>;
  const item = await restockItem(req.params.id, req.user!.brandingId, addQuantity);
  res.json({ data: serializeInventoryItem(item) });
}

export async function remove(req: Request, res: Response): Promise<void> {
  const item = await findTenantItem(req, req.params.id);
  await item.update({ active: false });
  res.json({ data: serializeInventoryItem(item) });
}
