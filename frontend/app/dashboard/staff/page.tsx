"use client";
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

const createSchema = z.object({
  name: z.string().min(1, 'Required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Min 6 chars'),
  role: z.enum(['DOCTOR', 'RECEPTIONIST']),
});

const editSchema = z.object({
  name: z.string().min(1, 'Required'),
  email: z.string().email('Invalid email'),
});

type CreateData = z.infer<typeof createSchema>;
type EditData = z.infer<typeof editSchema>;
type DialogState = null | { type: 'add' } | { type: 'edit' | 'reset'; staff: any };

export default function StaffPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [dialog, setDialog] = useState<DialogState>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['staff', page, search, roleFilter],
    queryFn: () => api.get(`/api/users/staff?page=${page}&limit=10&search=${encodeURIComponent(search)}&role=${roleFilter}`),
    placeholderData: keepPreviousData,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['staff'] });

  const createMutation = useMutation({
    mutationFn: (d: CreateData) => api.post('/api/users/staff', d),
    onSuccess: () => { invalidate(); setDialog(null); toast.success('Staff created'); },
    onError: (e: any) => toast.error(e.message),
  });

  const editMutation = useMutation({
    mutationFn: ({ id, d }: { id: string; d: EditData }) => api.patch(`/api/users/staff/${id}`, d),
    onSuccess: () => { invalidate(); setDialog(null); toast.success('Staff updated'); },
    onError: (e: any) => toast.error(e.message),
  });

  const resetMutation = useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) => api.post(`/api/users/staff/${id}/reset-password`, { password }),
    onSuccess: () => { setDialog(null); toast.success('Password reset'); },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/api/users/staff/${id}/toggle-active`, {}),
    onSuccess: () => { invalidate(); toast.success('Status updated'); },
    onError: (e: any) => toast.error(e.message),
  });

  const createForm = useForm<CreateData>({ resolver: zodResolver(createSchema), defaultValues: { role: 'DOCTOR' } });
  const editForm = useForm<EditData>({ resolver: zodResolver(editSchema) });
  const resetForm = useForm<{ password: string }>({ defaultValues: { password: '' } });

  const openEdit = (staff: any) => {
    editForm.reset({ name: staff.name, email: staff.email });
    setDialog({ type: 'edit', staff });
  };

  const openReset = (staff: any) => {
    resetForm.reset({ password: '' });
    setDialog({ type: 'reset', staff });
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold tracking-tight">Staff</h1>
        <Button onClick={() => { createForm.reset({ role: 'DOCTOR' }); setDialog({ type: 'add' }); }}>Add Staff</Button>
      </div>

      <div className="flex gap-4">
        <Input
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="max-w-sm"
        />
        <Select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }} className="w-[180px]">
          <option value="">All Roles</option>
          <option value="DOCTOR">Doctor</option>
          <option value="RECEPTIONIST">Receptionist</option>
        </Select>
      </div>

      {isLoading ? <div className="text-sm text-muted-foreground">Loading...</div> : (
        <div className="border rounded-xl overflow-hidden bg-card">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground text-xs font-medium">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data?.data?.map((s: any) => (
                <tr key={s._id} className="hover:bg-muted/50 h-[44px]">
                  <td className="px-4 py-2 font-medium">{s.name}</td>
                  <td className="px-4 py-2">{s.email}</td>
                  <td className="px-4 py-2">{s.role === 'DOCTOR' ? 'Doctor' : 'Receptionist'}</td>
                  <td className="px-4 py-2">
                    <Badge variant={s.isActive ? 'success' : 'muted'}>
                      {s.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-4 py-2 text-right space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(s)}>Edit</Button>
                    <Button variant="ghost" size="sm" onClick={() => openReset(s)}>Reset PW</Button>
                    <Button variant="ghost" size="sm" onClick={() => toggleMutation.mutate(s._id)}>
                      {s.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                  </td>
                </tr>
              ))}
              {data?.data?.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No staff found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          Showing {((page - 1) * 10) + 1} to {Math.min(page * 10, data?.total || 0)} of {data?.total || 0}
        </span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
          <Button variant="outline" size="sm" disabled={page >= (data?.pages || 1)} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      </div>

      {dialog?.type === 'add' && (
        <Modal title="Add Staff" onClose={() => setDialog(null)}>
          <form onSubmit={createForm.handleSubmit(d => createMutation.mutate(d))} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Name</label>
              <Input {...createForm.register('name')} />
              {createForm.formState.errors.name && <span className="text-xs text-destructive">{createForm.formState.errors.name.message}</span>}
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input {...createForm.register('email')} />
              {createForm.formState.errors.email && <span className="text-xs text-destructive">{createForm.formState.errors.email.message}</span>}
            </div>
            <div>
              <label className="text-sm font-medium">Password</label>
              <Input type="password" {...createForm.register('password')} />
              {createForm.formState.errors.password && <span className="text-xs text-destructive">{createForm.formState.errors.password.message}</span>}
            </div>
            <div>
              <label className="text-sm font-medium">Role</label>
              <Select {...createForm.register('role')}>
                <option value="DOCTOR">Doctor</option>
                <option value="RECEPTIONIST">Receptionist</option>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setDialog(null)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending}>{createMutation.isPending ? 'Saving...' : 'Save'}</Button>
            </div>
          </form>
        </Modal>
      )}

      {dialog?.type === 'edit' && (
        <Modal title="Edit Staff" onClose={() => setDialog(null)}>
          <form onSubmit={editForm.handleSubmit(d => editMutation.mutate({ id: dialog.staff._id, d }))} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Name</label>
              <Input {...editForm.register('name')} />
              {editForm.formState.errors.name && <span className="text-xs text-destructive">{editForm.formState.errors.name.message}</span>}
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input {...editForm.register('email')} />
              {editForm.formState.errors.email && <span className="text-xs text-destructive">{editForm.formState.errors.email.message}</span>}
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setDialog(null)}>Cancel</Button>
              <Button type="submit" disabled={editMutation.isPending}>{editMutation.isPending ? 'Saving...' : 'Save'}</Button>
            </div>
          </form>
        </Modal>
      )}

      {dialog?.type === 'reset' && (
        <Modal title={`Reset Password for ${dialog.staff.name}`} onClose={() => setDialog(null)}>
          <form onSubmit={resetForm.handleSubmit(d => resetMutation.mutate({ id: dialog.staff._id, password: d.password }))} className="space-y-4">
            <div>
              <label className="text-sm font-medium">New Password</label>
              <Input type="password" {...resetForm.register('password', { required: 'Required', minLength: { value: 6, message: 'Min 6 chars' } })} />
              {resetForm.formState.errors.password && <span className="text-xs text-destructive">{resetForm.formState.errors.password.message}</span>}
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setDialog(null)}>Cancel</Button>
              <Button type="submit" disabled={resetMutation.isPending}>{resetMutation.isPending ? 'Resetting...' : 'Reset'}</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-card w-full max-w-lg rounded-xl p-6 shadow-lg space-y-4" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold">{title}</h2>
        {children}
      </div>
    </div>
  );
}