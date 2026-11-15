"use client";
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { money } from '@/lib/lab';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { useUser } from '@/hooks/use-user';
import { useDebounce } from '@/hooks/use-debounce';

const schema = z.object({
  name: z.string().min(1, 'Required'),
  code: z.string().min(1, 'Required'),
  category: z.string().optional(),
  sampleType: z.string().min(1, 'Required'),
  unit: z.string().optional(),
  price: z.string().min(1, 'Required'),
  refMin: z.string().optional(),
  refMax: z.string().optional(),
  refText: z.string().optional(),
});

type TestForm = z.infer<typeof schema>;

const toBody = (d: TestForm) => ({
  name: d.name,
  code: d.code,
  category: d.category || '',
  sampleType: d.sampleType,
  unit: d.unit || '',
  price: Number(d.price),
  refMin: d.refMin ? Number(d.refMin) : null,
  refMax: d.refMax ? Number(d.refMax) : null,
  refText: d.refText || '',
});

export default function TestsPage() {
  const user = useUser();
  const qc = useQueryClient();
  const canEdit = user?.role === 'LAB_ADMIN';
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search, 300);
  const [dialog, setDialog] = useState<null | { test?: any }>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['tests', debounced],
    queryFn: () => api.get(`/api/tests?limit=200&search=${encodeURIComponent(debounced)}`),
  });

  const form = useForm<TestForm>({ resolver: zodResolver(schema) });
  const invalidate = () => qc.invalidateQueries({ queryKey: ['tests'] });

  const save = useMutation({
    mutationFn: (d: TestForm) =>
      dialog?.test ? api.patch(`/api/tests/${dialog.test._id}`, toBody(d)) : api.post('/api/tests', toBody(d)),
    onSuccess: () => { invalidate(); setDialog(null); toast.success('Test saved'); },
    onError: (e: any) => toast.error(e.message || 'Failed to save test'),
  });

  const toggle = useMutation({
    mutationFn: (t: any) => api.patch(`/api/tests/${t._id}`, { isActive: !t.isActive }),
    onSuccess: () => { invalidate(); toast.success('Test updated'); },
    onError: (e: any) => toast.error(e.message || 'Failed to update test'),
  });

  const open = (test?: any) => {
    form.reset({
      name: test?.name || '',
      code: test?.code || '',
      category: test?.category || '',
      sampleType: test?.sampleType || '',
      unit: test?.unit || '',
      price: test ? String(test.price) : '',
      refMin: test?.refMin != null ? String(test.refMin) : '',
      refMax: test?.refMax != null ? String(test.refMax) : '',
      refText: test?.refText || '',
    });
    setDialog({ test });
  };

  const err = form.formState.errors;

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold tracking-tight">Test Catalog</h1>
        {canEdit && <Button onClick={() => open()}>Add Test</Button>}
      </div>

      <Input placeholder="Search by name or code..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />

      <div className="border rounded-xl overflow-hidden bg-card">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 text-muted-foreground text-xs font-medium">
            <tr>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Sample</th>
              <th className="px-4 py-3">Reference range</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Status</th>
              {canEdit && <th className="px-4 py-3 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data?.data?.map((t: any) => (
              <tr key={t._id} className="hover:bg-muted/50 h-[44px]">
                <td className="px-4 py-2 font-mono text-xs">{t.code}</td>
                <td className="px-4 py-2 font-medium">{t.name}</td>
                <td className="px-4 py-2">{t.sampleType}</td>
                <td className="px-4 py-2">
                  {t.refText || (t.refMin != null || t.refMax != null ? `${t.refMin ?? ''} - ${t.refMax ?? ''} ${t.unit || ''}` : '-')}
                </td>
                <td className="px-4 py-2">{money(t.price)}</td>
                <td className="px-4 py-2">
                  <Badge variant={t.isActive ? 'success' : 'muted'}>{t.isActive ? 'Active' : 'Inactive'}</Badge>
                </td>
                {canEdit && (
                  <td className="px-4 py-2 text-right space-x-1">
                    <Button variant="ghost" size="sm" onClick={() => open(t)}>Edit</Button>
                    <Button variant="ghost" size="sm" onClick={() => toggle.mutate(t)}>
                      {t.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                  </td>
                )}
              </tr>
            ))}
            {isLoading && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Loading...</td></tr>
            )}
            {!isLoading && data?.data?.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No tests found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {dialog && (
        <Modal title={dialog.test ? 'Edit Test' : 'Add Test'} onClose={() => setDialog(null)}>
          <form onSubmit={form.handleSubmit((d) => save.mutate(d))} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Name</label>
                <Input {...form.register('name')} />
                {err.name && <span className="text-xs text-destructive">{err.name.message}</span>}
              </div>
              <div>
                <label className="text-sm font-medium">Code</label>
                <Input {...form.register('code')} />
                {err.code && <span className="text-xs text-destructive">{err.code.message}</span>}
              </div>
              <div>
                <label className="text-sm font-medium">Category</label>
                <Input {...form.register('category')} />
              </div>
              <div>
                <label className="text-sm font-medium">Sample type</label>
                <Input {...form.register('sampleType')} />
                {err.sampleType && <span className="text-xs text-destructive">{err.sampleType.message}</span>}
              </div>
              <div>
                <label className="text-sm font-medium">Unit</label>
                <Input {...form.register('unit')} />
              </div>
              <div>
                <label className="text-sm font-medium">Price</label>
                <Input type="number" step="0.01" min="0" {...form.register('price')} />
                {err.price && <span className="text-xs text-destructive">{err.price.message}</span>}
              </div>
              <div>
                <label className="text-sm font-medium">Normal min</label>
                <Input type="number" step="any" {...form.register('refMin')} />
              </div>
              <div>
                <label className="text-sm font-medium">Normal max</label>
                <Input type="number" step="any" {...form.register('refMax')} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Reference text (optional)</label>
              <Input {...form.register('refText')} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setDialog(null)}>Cancel</Button>
              <Button type="submit" disabled={save.isPending}>{save.isPending ? 'Saving...' : 'Save'}</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}