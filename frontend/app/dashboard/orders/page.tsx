"use client";
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, keepPreviousData } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { STATUS_LABEL, statusVariant, payVariant, money } from '@/lib/lab';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { useUser } from '@/hooks/use-user';
import { useDebounce } from '@/hooks/use-debounce';

function NewOrder({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [ps, setPs] = useState('');
  const dps = useDebounce(ps, 300);
  const [patientId, setPatientId] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [referredBy, setReferredBy] = useState('');
  const [discount, setDiscount] = useState('');

  const patients = useQuery({
    queryKey: ['order-patients', dps],
    queryFn: () => api.get(`/api/patients?limit=8&search=${encodeURIComponent(dps)}`),
  });
  const tests = useQuery({
    queryKey: ['order-tests'],
    queryFn: () => api.get('/api/tests?limit=200&active=true'),
  });

  const list: any[] = tests.data?.data || [];
  const subtotal = list.filter((t) => selected.includes(t._id)).reduce((s, t) => s + t.price, 0);
  const disc = Math.min(Number(discount) || 0, subtotal);

  const create = useMutation({
    mutationFn: () =>
      api.post('/api/orders', { patientId, testIds: selected, referredBy: referredBy || undefined, discount: disc }),
    onSuccess: (res) => { toast.success('Order created'); router.push(`/dashboard/orders/${res.data._id}`); },
    onError: (e: any) => toast.error(e.message || 'Failed to create order'),
  });

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  return (
    <Modal title="New Order" onClose={onClose} wide>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Find patient</label>
            <Input placeholder="Name or phone..." value={ps} onChange={(e) => setPs(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium">Patient</label>
            <Select value={patientId} onChange={(e) => setPatientId(e.target.value)}>
              <option value="">Select patient</option>
              {patients.data?.data?.map((p: any) => (
                <option key={p._id} value={p._id}>{p.patientCode} — {p.name}</option>
              ))}
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Referred by (doctor)</label>
            <Input value={referredBy} onChange={(e) => setReferredBy(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium">Discount</label>
            <Input type="number" min="0" value={discount} onChange={(e) => setDiscount(e.target.value)} />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">Tests</label>
          <div className="border rounded-md max-h-48 overflow-y-auto divide-y divide-border">
            {list.map((t) => (
              <label key={t._id} className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-muted/50">
                <input type="checkbox" checked={selected.includes(t._id)} onChange={() => toggle(t._id)} />
                <span className="flex-1">{t.name} <span className="text-muted-foreground font-mono text-xs">{t.code}</span></span>
                <span>{money(t.price)}</span>
              </label>
            ))}
            {tests.isLoading && <div className="px-3 py-4 text-sm text-muted-foreground">Loading...</div>}
            {!tests.isLoading && list.length === 0 && (
              <div className="px-3 py-4 text-sm text-muted-foreground">No active tests in catalog</div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm">Total: <span className="font-semibold">{money(subtotal - disc)}</span></span>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button onClick={() => create.mutate()} disabled={!patientId || selected.length === 0 || create.isPending}>
              {create.isPending ? 'Creating...' : 'Create Order'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default function OrdersPage() {
  const user = useUser();
  const canCreate = user?.role === 'LAB_ADMIN' || user?.role === 'RECEPTIONIST';
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search, 300);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['orders', page, debounced, status],
    queryFn: () =>
      api.get(`/api/orders?page=${page}&limit=10&search=${encodeURIComponent(debounced)}&status=${status}`),
    placeholderData: keepPreviousData,
  });

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
        {canCreate && <Button onClick={() => setOpen(true)}>New Order</Button>}
      </div>

      <div className="flex flex-wrap gap-4">
        <Input
          placeholder="Search by order no, patient name or code..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="max-w-sm"
        />
        <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="w-[200px]">
          <option value="">All statuses</option>
          {Object.entries(STATUS_LABEL).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </Select>
      </div>

      <div className={`border rounded-xl overflow-hidden bg-card ${isFetching ? 'opacity-60 transition-opacity' : ''}`}>
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 text-muted-foreground text-xs font-medium">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Patient</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data?.data?.map((o: any) => (
              <tr key={o._id} className="hover:bg-muted/50 h-[44px]">
                <td className="px-4 py-2 font-mono text-xs">{o.orderNumber}</td>
                <td className="px-4 py-2">
                  <span className="font-medium">{o.patientName}</span>{' '}
                  <span className="text-muted-foreground font-mono text-xs">{o.patientCode}</span>
                </td>
                <td className="px-4 py-2"><Badge variant={statusVariant(o.status)}>{STATUS_LABEL[o.status]}</Badge></td>
                <td className="px-4 py-2"><Badge variant={payVariant(o.paymentStatus)}>{o.paymentStatus}</Badge></td>
                <td className="px-4 py-2">{money(o.total)}</td>
                <td className="px-4 py-2">{new Date(o.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-2 text-right">
                  <Link href={`/dashboard/orders/${o._id}`}>
                    <Button variant="ghost" size="sm">Open</Button>
                  </Link>
                </td>
              </tr>
            ))}
            {isLoading && !data && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Loading...</td></tr>
            )}
            {!isLoading && data?.data?.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No orders found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          Showing {data?.total ? (page - 1) * 10 + 1 : 0} to {Math.min(page * 10, data?.total || 0)} of {data?.total || 0}
        </span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
          <Button variant="outline" size="sm" disabled={page >= (data?.pages || 1)} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      </div>

      {open && <NewOrder onClose={() => setOpen(false)} />}
    </div>
  );
}