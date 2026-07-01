import { Request, Response } from 'express';
import { z } from 'zod';
import { Branding } from '../models';
import { requireBrandingId } from '../middleware/tenant';
import { NotFound } from '../utils/errors';

const consentPointSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  subPoints: z.array(z.string()).optional(),
  note: z.string().optional(),
  italic: z.boolean().optional(),
});

async function findOwnBranding(req: Request): Promise<Branding> {
  const item = await Branding.findByPk(requireBrandingId(req));
  if (!item) throw NotFound('Branding not found');
  return item;
}

export async function me(req: Request, res: Response): Promise<void> {
  const item = await findOwnBranding(req);
  res.json({ data: item });
}

export async function get(req: Request, res: Response): Promise<void> {
  const item = await findOwnBranding(req);
  if (item.id !== req.params.id) throw NotFound('Branding not found');
  res.json({ data: item });
}

const fields = {
  slug: z.string().min(1).optional(),
  clinicName: z.string().min(1),
  doctorName: z.string().min(1),
  specialty: z.string().default(''),
  cedula: z.string().default(''),
  email: z.string().default(''),
  phone: z.string().default(''),
  address: z.string().default(''),
  logoEmoji: z.string().default('🩺'),
  signatureName: z.string().default(''),
  primary: z.string(),
  secondary: z.string(),
  accent: z.string(),
  surface: z.string(),
  sidebar: z.string(),
  primaryHex: z.string(),
  secondaryHex: z.string(),
  accentHex: z.string(),
  fontDisplay: z.string().default('Fraunces'),
  rxFooter: z.string().default(''),
  consentTitle: z.string().min(1).max(500).optional(),
  consentPoints: z.array(consentPointSchema).optional(),
};

export const updateSchema = z.object(fields).partial();

export async function update(req: Request, res: Response): Promise<void> {
  const item = await findOwnBranding(req);
  if (item.id !== req.params.id) throw NotFound('Branding not found');
  const body = req.body as z.infer<typeof updateSchema>;
  if (body.slug !== undefined) delete body.slug;
  await item.update(body);
  res.json({ data: item });
}
