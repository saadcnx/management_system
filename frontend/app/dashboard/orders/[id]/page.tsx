"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { STATUS_LABEL, statusVariant, payVariant, money } from '@/lib/lab';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useUser } from '@/hooks/use-user';

const when = (d?: string) => (d ? new Date(d).toLocaleString() : '-');
const refOf = (i: any) =>
  i.refText || (i.refMin != null || i.refMax != null ? `${i.refMin ?? ''} - ${i.refMax ?? ''}` : '-');

export default function OrderPage() {
  const { id } = useParams<{ id: string }>();
  const user = useUser();
  const qc = useQueryClient();
  const canFront = user?.role === 'LAB_ADMIN' || user?.role === 'RECEPTIONIST';
  const canLab = user?.role === 'LAB_ADMIN' || user?.role === 'DOCTOR';

  const { data, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => api.get(`/api/orders/${id}`),
  });
  const order = data?.data;

  const [results, setResults] = useState<Record<string, string>>({});
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('CASH');

  useEffect(() => {
    if (order) setResults(Object.fromEntries(order.items.map((i: any) => [i._id, i.result || ''])));
  }, [order?.updatedAt]);

  const run = useMutation({
    mutationFn: (v: { method: 'patch' | 'post'; path: string; body?: any }) =>
      api[v.method](`/api/orders/${id}/${v.path}`, v.body ?? {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['order', id] });
      qc.invalidateQueries({ queryKey: ['orders'] });
      setAmount('');
      toast.success('Saved');
    },
    onError: (e: any) => toast.error(e.message || 'Action failed'),
  });

  if (isLoading || !order) {
    return <div className="p-6 text-muted-foreground">{isLoading ? 'Loading...' : 'Order not found'}</div>;
  }

  const editing = canLab && (order.status === 'SAMPLE_COLLECTED' || order.status === 'RESULTS_ENTERED');
  const due = order.total - order.paid;
  const patient = order.patient || {};

  const saveResults = () =>
    run.mutate({
      method: 'patch',
      path: 'results',
      body: { results: order.items.map((i: any) => ({ itemId: i._id, result: results[i._id] ?? '' })) },
    });

  return (
    <div className="p-6 space-y-4 max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
        <Link href="/dashboard/orders" className="text-sm text-muted-foreground hover:underline">← Orders</Link>
        <div className="flex gap-2">
          {canFront && order.status === 'ORDERED' && (
            <Button disabled={run.isPending} onClick={() => run.mutate({ method: 'patch', path: 'collect' })}>
              Collect sample
            </Button>
          )}
          {editing && (
            <Button variant="outline" disabled={run.isPending} onClick={saveResults}>Save results</Button>
          )}
          {canLab && order.status === 'RESULTS_ENTERED' && (
            <Button disabled={run.isPending} onClick={() => run.mutate({ method: 'patch', path: 'verify' })}>
              Verify
            </Button>
          )}
          {order.status === 'VERIFIED' && <Button onClick={() => window.print()}>Print report</Button>}
        </div>
      </div>

      <div className="border rounded-xl bg-card p-6 space-y-5">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-xl font-semibold">Laboratory Report</h1>
            <p className="text-sm text-muted-foreground">Order {order.orderNumber} · Invoice {order.invoiceNumber}</p>
          </div>
          <Badge variant={statusVariant(order.status)}>{STATUS_LABEL[order.status]}</Badge>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><span className="text-muted-foreground">Patient:</span> {patient.name || order.patientName}</div>
          <div><span className="text-muted-foreground">Code:</span> <span className="font-mono">{patient.patientCode || order.patientCode}</span></div>
          <div><span className="text-muted-foreground">Gender:</span> {patient.gender || '-'}</div>
          <div><span className="text-muted-foreground">DOB:</span> {patient.dateOfBirth ? new Date(patient.dateOfBirth).toISOString().split('T')[0] : '-'}</div>
          <div><span className="text-muted-foreground">Referred by:</span> {order.referredBy || '-'}</div>
          <div><span className="text-muted-foreground">Ordered:</span> {when(order.createdAt)}</div>
          <div><span className="text-muted-foreground">Sample barcode:</span> <span className="font-mono">{order.sample?.barcode || '-'}</span></div>
          <div><span className="text-muted-foreground">Collected:</span> {when(order.sample?.collectedAt)}</div>
        </div>

        <table className="w-full text-sm text-left">
          <thead className="text-muted-foreground text-xs font-medium border-b">
            <tr>
              <th className="py-2 pr-2">Test</th>
              <th className="py-2 pr-2">Result</th>
              <th className="py-2 pr-2">Unit</th>
              <th className="py-2 pr-2">Reference</th>
              <th className="py-2">Flag</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {order.items.map((i: any) => (
              <tr key={i._id}>
                <td className="py-2 pr-2 font-medium">{i.name}</td>
                <td className="py-2 pr-2">
                  {editing ? (
                    <Input
                      className="w-32"
                      value={results[i._id] ?? ''}
                      onChange={(e) => setResults((r) => ({ ...r, [i._id]: e.target.value }))}
                    />
                  ) : (
                    i.result || '-'
                  )}
                </td>
                <td className="py-2 pr-2">{i.unit || '-'}</td>
                <td className="py-2 pr-2">{refOf(i)}</td>
                <td className={`py-2 ${i.flag === 'HIGH' || i.flag === 'LOW' ? 'text-destructive font-semibold' : ''}`}>
                  {i.flag || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {order.status === 'VERIFIED' ? (
          <p className="text-sm text-muted-foreground">
            Verified by {order.verifiedBy?.name || '-'} on {when(order.verifiedAt)}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">Report not verified yet.</p>
        )}
      </div>

      <div className="border rounded-xl bg-card p-6 space-y-3 text-sm">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Billing</h2>
          <Badge variant={payVariant(order.paymentStatus)}>{order.paymentStatus}</Badge>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div><span className="text-muted-foreground">Subtotal:</span> {money(order.subtotal)}</div>
          <div><span className="text-muted-foreground">Discount:</span> {money(order.discount)}</div>
          <div><span className="text-muted-foreground">Total:</span> {money(order.total)}</div>
          <div><span className="text-muted-foreground">Due:</span> {money(due)}</div>
        </div>
        {order.payments.length > 0 && (
          <ul className="divide-y divide-border border rounded-md">
            {order.payments.map((p: any) => (
              <li key={p._id} className="flex justify-between px-3 py-2">
                <span>{p.method} · {when(p.paidAt)}</span>
                <span>{money(p.amount)}</span>
              </li>
            ))}
          </ul>
        )}
        {canFront && due > 0 && (
          <div className="flex gap-2 print:hidden">
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder={`Amount (due ${due})`}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="max-w-[200px]"
            />
            <Select value={method} onChange={(e) => setMethod(e.target.value)} className="w-[140px]">
              <option value="CASH">Cash</option>
              <option value="CARD">Card</option>
              <option value="ONLINE">Online</option>
            </Select>
            <Button
              disabled={!Number(amount) || run.isPending}
              onClick={() => run.mutate({ method: 'post', path: 'payments', body: { amount: Number(amount), method } })}
            >
              Add payment
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}