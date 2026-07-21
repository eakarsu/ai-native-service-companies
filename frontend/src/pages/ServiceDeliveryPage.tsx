import { FormEvent, useEffect, useState } from 'react';
import { CalendarClock, CreditCard, RefreshCw, Wrench } from 'lucide-react';
import { api } from '../api';

const nextStates: Record<string, string[]> = {
  draft_quote: ['quote_sent', 'cancelled'], quote_sent: ['booked', 'cancelled'], booked: ['dispatched', 'cancelled'],
  dispatched: ['in_progress', 'no_show', 'booked', 'cancelled'], in_progress: ['partially_completed', 'completed'],
  partially_completed: ['in_progress', 'invoiced'], completed: ['invoiced'], paid: ['refund_pending'], refund_failed: ['refund_pending']
};

export default function ServiceDeliveryPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true); setError('');
    try { setOrders(await api.getDeliveryOrders()); } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  }
  useEffect(() => { refresh(); }, []);

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const startsAt = new Date(String(data.get('startsAt'))).toISOString();
    const endsAt = new Date(String(data.get('endsAt'))).toISOString();
    try {
      await api.createDeliveryOrder({
        resourceId: data.get('resourceId'), requiredSkills: String(data.get('skills')).split(',').map((value) => value.trim()).filter(Boolean),
        serviceAddressRef: data.get('addressRef'), serviceLocation: { latitude: Number(data.get('latitude')), longitude: Number(data.get('longitude')) },
        startsAt, endsAt, inventory: [], lines: [{ kind: 'labor', description: data.get('description'), quantity: 1, unitCents: Math.round(Number(data.get('price')) * 100) }],
        taxBasisPoints: Number(data.get('taxBasisPoints')), currency: 'USD'
      }, crypto.randomUUID());
      form.reset(); await refresh();
    } catch (err: any) { setError(err.message); }
  }

  async function transition(order: any, toStatus: string) {
    try { await api.transitionDeliveryOrder(order.id, { expectedVersion: order.version, toStatus, reason: 'Operator-confirmed transition' }); await refresh(); }
    catch (err: any) { setError(err.message); }
  }

  async function pay(order: any) {
    const paymentMethodRef = window.prompt('Enter the tokenized payment-method reference');
    if (!paymentMethodRef) return;
    try { await api.requestDeliveryPayment(order.id, { expectedVersion: order.version, paymentMethodRef }); await refresh(); }
    catch (err: any) { setError(err.message); }
  }

  return <div className="p-8 space-y-6">
    <header className="flex items-center justify-between"><div><h2 className="text-2xl font-bold">Governed service delivery</h2><p className="text-gray-500">Quotes, booking, dispatch, work, invoices, payments, refunds, and cancellation use versioned durable state.</p></div><button onClick={refresh} className="flex gap-2 items-center border rounded-lg px-3 py-2"><RefreshCw className="w-4 h-4"/>Refresh</button></header>
    {error && <div role="alert" className="rounded-lg bg-red-50 border border-red-200 p-3 text-red-800">{error}</div>}
    <form onSubmit={create} className="bg-white border rounded-xl p-5 grid grid-cols-2 lg:grid-cols-4 gap-3">
      <h3 className="font-semibold col-span-full flex gap-2"><Wrench className="w-5 h-5"/>Create validated quote</h3>
      <label className="text-sm">Resource ID<input required name="resourceId" className="block w-full border rounded p-2 mt-1"/></label>
      <label className="text-sm">Required skills<input required name="skills" placeholder="electrical, inspection" className="block w-full border rounded p-2 mt-1"/></label>
      <label className="text-sm">Address reference<input required name="addressRef" className="block w-full border rounded p-2 mt-1"/></label>
      <label className="text-sm">Description<input required minLength={2} name="description" className="block w-full border rounded p-2 mt-1"/></label>
      <label className="text-sm">Latitude<input required step="any" min="-90" max="90" type="number" name="latitude" className="block w-full border rounded p-2 mt-1"/></label>
      <label className="text-sm">Longitude<input required step="any" min="-180" max="180" type="number" name="longitude" className="block w-full border rounded p-2 mt-1"/></label>
      <label className="text-sm">Starts<input required type="datetime-local" name="startsAt" className="block w-full border rounded p-2 mt-1"/></label>
      <label className="text-sm">Ends<input required type="datetime-local" name="endsAt" className="block w-full border rounded p-2 mt-1"/></label>
      <label className="text-sm">Price USD<input required min="0" step="0.01" type="number" name="price" className="block w-full border rounded p-2 mt-1"/></label>
      <label className="text-sm">Tax basis points<input required min="0" max="10000" type="number" defaultValue="0" name="taxBasisPoints" className="block w-full border rounded p-2 mt-1"/></label>
      <button className="self-end bg-blue-600 text-white rounded-lg p-2 font-semibold" type="submit">Create quote</button>
    </form>
    <section className="space-y-3" aria-busy={loading}>{orders.map((order) => <article key={order.id} className="bg-white border rounded-xl p-5 grid md:grid-cols-[1fr_auto] gap-4">
      <div><div className="flex items-center gap-2"><CalendarClock className="w-4 h-4"/><strong>{order.service_address_ref}</strong><span className="rounded-full bg-blue-50 text-blue-800 px-2 py-0.5 text-xs">{order.status}</span></div>
        <p className="text-sm text-gray-500 mt-2">{new Date(order.starts_at).toLocaleString()} · resource {order.resource_id} · version {order.version}</p>
        <p className="font-semibold">{(Number(order.total_cents) / 100).toLocaleString(undefined, { style: 'currency', currency: order.currency })}</p></div>
      <div className="flex flex-wrap gap-2 items-center justify-end">{(nextStates[order.status] || []).map((state) => <button key={state} onClick={() => transition(order, state)} className="border rounded-lg px-3 py-2 text-sm">{state.split('_').join(' ')}</button>)}
        {order.status === 'invoiced' && <button onClick={() => pay(order)} className="flex gap-1 items-center bg-emerald-600 text-white rounded-lg px-3 py-2 text-sm"><CreditCard className="w-4 h-4"/>Pay</button>}</div>
    </article>)}{!loading && !orders.length && <p className="text-gray-500">No delivery orders are visible for this identity.</p>}</section>
  </div>;
}
