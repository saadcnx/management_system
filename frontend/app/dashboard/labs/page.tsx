"use client";
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

const labSchema = z.object({
  labName: z.string().min(1, 'Required'),
  contactEmail: z.string().email('Invalid email'),
  contactPhone: z.string().min(1, 'Required'),
  adminName: z.string().min(1, 'Required'),
  adminEmail: z.string().email('Invalid email'),
  adminPassword: z.string().min(6, 'Min 6 chars'),
});

type LabFormData = z.infer<typeof labSchema>;

export default function LabsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['labs', page, search, status],
    queryFn: () => api.get(`/api/labs?page=${page}&limit=10&search=${search}&status=${status}`),
  });

  const createMutation = useMutation({
    mutationFn: (newLab: LabFormData) => api.post('/api/labs', newLab),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labs'] });
      setIsFormOpen(false);
      toast.success('Lab created successfully');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to create lab'),
  });

  const { register, handleSubmit, formState: { errors }, reset } = useForm<LabFormData>({
    resolver: zodResolver(labSchema),
  });

  const onSubmit = (data: LabFormData) => {
    createMutation.mutate(data);
    reset();
  };

  if (isLoading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold tracking-tight">Labs</h1>
        <Button onClick={() => setIsFormOpen(true)}>Add Lab</Button>
      </div>

      <div className="flex gap-4">
        <Input 
          placeholder="Search labs..." 
          value={search} 
          onChange={(e) => { setSearch(e.target.value); setPage(1); }} 
          className="max-w-sm"
        />
        <Select 
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="w-[180px]"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </Select>
      </div>

      <div className="border rounded-xl overflow-hidden bg-card">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 text-muted-foreground text-xs font-medium">
            <tr>
              <th className="px-4 py-3">Lab Name</th>
              <th className="px-4 py-3">Contact Email</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data?.data?.map((lab: any) => (
              <tr key={lab._id} className="hover:bg-muted/50 h-[44px]">
                <td className="px-4 py-2 font-medium">{lab.name}</td>
                <td className="px-4 py-2">{lab.contactEmail}</td>
                <td className="px-4 py-2">{lab.contactPhone}</td>
                <td className="px-4 py-2">
                  <Badge variant={lab.isActive ? 'success' : 'muted'}>
                    {lab.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </td>
                <td className="px-4 py-2 text-muted-foreground">{new Date(lab.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
            {data?.data?.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No labs found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          Showing {((page - 1) * 10) + 1} to {Math.min(page * 10, data?.total || 0)} of {data?.total || 0}
        </span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
          <Button variant="outline" size="sm" disabled={page >= (data?.pages || 1)} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card w-full max-w-lg rounded-xl p-6 shadow-lg space-y-4">
            <h2 className="text-lg font-semibold">Create New Lab & Admin</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Lab Name</label>
                  <Input {...register('labName')} />
                  {errors.labName && <span className="text-xs text-destructive">{errors.labName.message}</span>}
                </div>
                <div>
                  <label className="text-sm font-medium">Contact Email</label>
                  <Input {...register('contactEmail')} />
                  {errors.contactEmail && <span className="text-xs text-destructive">{errors.contactEmail.message}</span>}
                </div>
                <div>
                  <label className="text-sm font-medium">Contact Phone</label>
                  <Input {...register('contactPhone')} />
                  {errors.contactPhone && <span className="text-xs text-destructive">{errors.contactPhone.message}</span>}
                </div>
              </div>
              <hr className="border-border" />
              <h3 className="text-sm font-medium">Lab Admin Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Admin Name</label>
                  <Input {...register('adminName')} />
                  {errors.adminName && <span className="text-xs text-destructive">{errors.adminName.message}</span>}
                </div>
                <div>
                  <label className="text-sm font-medium">Admin Email</label>
                  <Input {...register('adminEmail')} />
                  {errors.adminEmail && <span className="text-xs text-destructive">{errors.adminEmail.message}</span>}
                </div>
                <div>
                  <label className="text-sm font-medium">Admin Password</label>
                  <Input type="password" {...register('adminPassword')} />
                  {errors.adminPassword && <span className="text-xs text-destructive">{errors.adminPassword.message}</span>}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="ghost" onClick={() => setIsFormOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Saving...' : 'Create Lab'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}