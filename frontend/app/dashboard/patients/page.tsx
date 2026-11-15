"use client";
import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useQueryState, parseAsInteger, parseAsString } from 'nuqs';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useDebounce } from '@/hooks/use-debounce';
import { useUser } from '@/hooks/use-user';

const patientSchema = z.object({
  name: z.string().min(1, 'Required'),
  phone: z.string().min(1, 'Required'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  dateOfBirth: z.string().min(1, 'Required'),
  address: z.string().optional(),
});

type PatientFormData = z.infer<typeof patientSchema>;
type DialogState = null | { type: 'add' } | { type: 'edit'; patient: any } | { type: 'view'; patient: any };

export default function PatientsPage() {
  const user = useUser();
  const queryClient = useQueryClient();
  const canEdit = user?.role === 'LAB_ADMIN' || user?.role === 'RECEPTIONIST';
  const canDeactivate = user?.role === 'LAB_ADMIN';

  const [search, setSearch] = useQueryState('search', parseAsString.withDefault(''));
  const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(1));
  const [gender, setGender] = useQueryState('gender', parseAsString.withDefault(''));
  const [sortBy, setSortBy] = useQueryState('sortBy', parseAsString.withDefault('createdAt'));

  const [searchInput, setSearchInput] = useState(search);
  const debouncedSearch = useDebounce(searchInput, 300);

  useEffect(() => {
    if (debouncedSearch !== search) {
      setSearch(debouncedSearch || null);
      setPage(1);
    }
  }, [debouncedSearch]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['patients', page, search, gender, sortBy],
    queryFn: () => api.get(`/api/patients?page=${page}&limit=10&search=${search}&gender=${gender}&sortBy=${sortBy}`),
    placeholderData: keepPreviousData,
  });

  const [dialog, setDialog] = useState<DialogState>(null);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['patients'] });

  const createMutation = useMutation({
    mutationFn: (d: PatientFormData) => api.post('/api/patients', d),
    onSuccess: () => { invalidate(); setDialog(null); toast.success('Patient registered'); },
    onError: (e: any) => toast.error(e.message || 'Failed to register patient'),
  });

  const editMutation = useMutation({
    mutationFn: ({ id, d }: { id: string; d: PatientFormData }) => api.patch(`/api/patients/${id}`, d),
    onSuccess: () => { invalidate(); setDialog(null); toast.success('Patient updated'); },
    onError: (e: any) => toast.error(e.message || 'Failed to update patient'),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/api/patients/${id}/deactivate`, {}),
    onSuccess: () => { invalidate(); setDialog(null); toast.success('Patient deactivated'); },
    onError: (e: any) => toast.error(e.message || 'Failed to deactivate'),
  });

  const form = useForm<PatientFormData>({ resolver: zodResolver(patientSchema) });

  const openAdd = () => {
    form.reset({ name: '', phone: '', gender: 'MALE', dateOfBirth: '', address: '' });
    setDialog({ type: 'add' });
  };

  const openEdit = (patient: any) => {
    form.reset({
      name: patient.name,
      phone: patient.phone,
      gender: patient.gender,
      dateOfBirth: new Date(patient.dateOfBirth).toISOString().split('T')[0],
      address: patient.address || '',
    });
    setDialog({ type: 'edit', patient });
  };

  const onSubmit = (d: PatientFormData) => {
    if (dialog?.type === 'edit') {
      editMutation.mutate({ id: dialog.patient._id, d });
    } else {
      createMutation.mutate(d);
    }
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold tracking-tight">Patients</h1>
        {canEdit && <Button onClick={openAdd}>Add Patient</Button>}
      </div>

      <div className="flex flex-wrap gap-4">
        <Input
          placeholder="Search by name or phone..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="max-w-sm"
        />
        <Select value={gender} onChange={(e) => { setGender(e.target.value || null); setPage(1); }} className="w-[160px]">
          <option value="">All Genders</option>
          <option value="MALE">Male</option>
          <option value="FEMALE">Female</option>
          <option value="OTHER">Other</option>
        </Select>
        <Select value={sortBy} onChange={(e) => { setSortBy(e.target.value); setPage(1); }} className="w-[180px]">
          <option value="createdAt">Newest first</option>
          <option value="name">Name (A-Z)</option>
        </Select>
      </div>

      <div className={`border rounded-xl overflow-hidden bg-card ${isFetching ? 'opacity-60 transition-opacity' : ''}`}>
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 text-muted-foreground text-xs font-medium">
            <tr>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Gender</th>
              <th className="px-4 py-3">DOB</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data?.data?.map((p: any) => (
              <tr key={p._id} className="hover:bg-muted/50 h-[44px]">
                <td className="px-4 py-2 font-mono text-xs">{p.patientCode}</td>
                <td className="px-4 py-2 font-medium">{p.name}</td>
                <td className="px-4 py-2">{p.phone}</td>
                <td className="px-4 py-2">{p.gender}</td>
                <td className="px-4 py-2">{new Date(p.dateOfBirth).toISOString().split('T')[0]}</td>
                <td className="px-4 py-2">
                  <Badge variant={p.isActive ? 'success' : 'muted'}>{p.isActive ? 'Active' : 'Inactive'}</Badge>
                </td>
                <td className="px-4 py-2 text-right space-x-1">
                  <Button variant="ghost" size="sm" onClick={() => setDialog({ type: 'view', patient: p })}>View</Button>
                  {canEdit && <Button variant="ghost" size="sm" onClick={() => openEdit(p)}>Edit</Button>}
                  {canDeactivate && p.isActive && (
                    <Button variant="ghost" size="sm" onClick={() => deactivateMutation.mutate(p._id)}>Deactivate</Button>
                  )}
                </td>
              </tr>
            ))}
            {!isLoading && data?.data?.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  {search ? 'No results for your search' : 'No patients found'}
                </td>
              </tr>
            )}
            {isLoading && !data && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Loading...</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          Showing {data?.total ? ((page - 1) * 10) + 1 : 0} to {Math.min(page * 10, data?.total || 0)} of {data?.total || 0}
        </span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
          <Button variant="outline" size="sm" disabled={page >= (data?.pages || 1)} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      </div>

      {(dialog?.type === 'add' || dialog?.type === 'edit') && (
        <Modal title={dialog.type === 'edit' ? 'Edit Patient' : 'Register Patient'} onClose={() => setDialog(null)}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Name</label>
                <Input {...form.register('name')} />
                {form.formState.errors.name && <span className="text-xs text-destructive">{form.formState.errors.name.message}</span>}
              </div>
              <div>
                <label className="text-sm font-medium">Phone</label>
                <Input {...form.register('phone')} />
                {form.formState.errors.phone && <span className="text-xs text-destructive">{form.formState.errors.phone.message}</span>}
              </div>
              <div>
                <label className="text-sm font-medium">Gender</label>
                <Select {...form.register('gender')}>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Date of Birth</label>
                <Input type="date" {...form.register('dateOfBirth')} />
                {form.formState.errors.dateOfBirth && <span className="text-xs text-destructive">{form.formState.errors.dateOfBirth.message}</span>}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Address (optional)</label>
              <Input {...form.register('address')} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setDialog(null)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending || editMutation.isPending}>
                {(createMutation.isPending || editMutation.isPending) ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {dialog?.type === 'view' && (
        <Modal title="Patient Details" onClose={() => setDialog(null)}>
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div><span className="text-muted-foreground">Code:</span> <span className="font-mono">{dialog.patient.patientCode}</span></div>
              <div><span className="text-muted-foreground">Name:</span> {dialog.patient.name}</div>
              <div><span className="text-muted-foreground">Phone:</span> {dialog.patient.phone}</div>
              <div><span className="text-muted-foreground">Gender:</span> {dialog.patient.gender}</div>
              <div><span className="text-muted-foreground">DOB:</span> {new Date(dialog.patient.dateOfBirth).toISOString().split('T')[0]}</div>
              <div><span className="text-muted-foreground">Status:</span> {dialog.patient.isActive ? 'Active' : 'Inactive'}</div>
            </div>
            {dialog.patient.address && (
              <div><span className="text-muted-foreground">Address:</span> {dialog.patient.address}</div>
            )}
            <div className="flex justify-end pt-2">
              <Button variant="outline" onClick={() => setDialog(null)}>Close</Button>
            </div>
          </div>
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