import { z } from 'zod';

export const financialAccountSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  balance: z.number().min(-1_000_000_000).max(1_000_000_000).finite(),
  category: z.string().trim().min(1, 'Category is required').max(50),
  group: z.string().trim().max(50),
});

export const transactionSchema = z.object({
  category: z.string().trim().min(1, 'Category is required').max(50),
  subcategory: z.string().trim().min(1, 'Subcategory is required').max(100),
  monthly: z.number().min(-1_000_000_000).max(1_000_000_000).finite(),
  type: z.enum(['income', 'expense', 'asset', 'liability']),
  group: z.string().trim().max(50),
});

export const categoryUpdateSchema = z.object({
  oldCategory: z.string().trim().min(1),
  newCategory: z.string().trim().min(1).max(50),
});
