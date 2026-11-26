import React, { useState } from 'react';
import { FileSignature, Package, Plus, ShoppingCart } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCRM } from '../../contexts/CRMContext';
import { useToast } from '../../contexts/ToastContext';
import { productSchema } from '../../schemas/crm';
import { Button, Input, Modal, Select, StatusLabel } from '../../components/ui/Primitives';

export const ProductsModule: React.FC = () => {
  const { can } = useAuth();
  const { products, orders, contracts, customers, formatMoney, createProduct, createOrder, createContract, updateContract } = useCRM();
  const { addToast } = useToast();

  const [tab, setTab] = useState<'catalog' | 'orders' | 'contracts'>('catalog');
  const [prodOpen, setProdOpen] = useState(false);
  const [orderOpen, setOrderOpen] = useState(false);
  const [contractOpen, setContractOpen] = useState(false);

  // Product form
  const [pSku, setPSku] = useState('');
  const [pName, setPName] = useState('');
  const [pType, setPType] = useState<'product' | 'service'>('service');
  const [pPrice, setPPrice] = useState('25000000');
  const [pCost, setPCost] = useState('8000000');
  const [pStock, setPStock] = useState('100');

  // Order form
  const [oCustId, setOCustId] = useState('');
  const [oProdId, setOProdId] = useState('');
  const [oQty, setOQty] = useState('1');

  // Contract form
  const [cTitle, setCTitle] = useState('');
  const [cCustId, setCCustId] = useState('');
  const [cValue, setCValue] = useState('180000000');

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const parsed = productSchema.parse({
        sku: pSku,
        name: pName,
        type: pType,
        category: 'Giải pháp CRM',
        unit: pType === 'service' ? 'Gói/Năm' : 'Đơn vị',
        price: Number(pPrice) || 0,
        cost: Number(pCost) || 0,
        stock: Number(pStock) || 0,
      });
      await createProduct(parsed);
      addToast('Đã thêm sản phẩm/dịch vụ', parsed.name, 'success');
      setProdOpen(false);
      setPSku('');
      setPName('');
    } catch (err: unknown) {
      addToast('Dữ liệu sản phẩm chưa hợp lệ', err instanceof Error ? err.message : 'Kiểm tra lại.', 'error');
    }
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const cust = customers.find((c) => c.id === (oCustId || customers[0]?.id));
    const prod = products.find((p) => p.id === (oProdId || products[0]?.id));
    if (!cust || !prod) return;
    const qty = Math.max(1, Number(oQty) || 1);
    await createOrder({
      customerId: cust.id,
      customerName: cust.name,
      items: [{ productId: prod.id, productName: prod.name, quantity: qty, unitPrice: prod.price, discountPercent: 0, total: prod.price * qty }],
      paymentStatus: 'unpaid',
      status: 'confirmed',
    });
    addToast('Đã tạo đơn hàng mới', `${cust.name} · ${prod.name}`, 'success');
    setOrderOpen(false);
  };

  const handleCreateContract = async (e: React.FormEvent) => {
    e.preventDefault();
    const cust = customers.find((c) => c.id === (cCustId || customers[0]?.id));
    if (!cust) return;
    await createContract({
      title: cTitle,
      customerId: cust.id,
      customerName: cust.name,
      value: Number(cValue) || 0,
    });
    addToast('Đã tạo hợp đồng mới', cTitle, 'success');
    setContractOpen(false);
    setCTitle('');
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">09. Sản phẩm, Đơn hàng & Hợp đồng</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Danh mục sản phẩm/dịch vụ, đơn hàng, hóa đơn & theo dõi gia hạn hợp đồng.
          </p>
        </div>
        <StatusLabel tone="warning" text="Cổng thanh toán & Ký số VNPT/Viettel CA: Chưa kết nối" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-lg border border-slate-300 dark:border-slate-700 overflow-hidden">
          {[
            { id: 'catalog', label: `Danh mục SP/DV (${products.length})`, icon: <Package className="w-3.5 h-3.5" /> },
            { id: 'orders', label: `Đơn hàng (${orders.length})`, icon: <ShoppingCart className="w-3.5 h-3.5" /> },
            { id: 'contracts', label: `Hợp đồng (${contracts.length})`, icon: <FileSignature className="w-3.5 h-3.5" /> },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as typeof tab)}
              className={`px-3 py-1.5 text-xs flex items-center gap-1.5 cursor-pointer ${
                tab === t.id ? 'bg-[#1951fc] text-white' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300'
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {can('products', 'create') && (
          <div className="flex gap-2">
            {tab === 'catalog' && <Button size="sm" onClick={() => setProdOpen(true)}><Plus className="w-3.5 h-3.5" /> Thêm SP/DV</Button>}
            {tab === 'orders' && <Button size="sm" onClick={() => setOrderOpen(true)}><Plus className="w-3.5 h-3.5" /> Tạo Đơn hàng</Button>}
            {tab === 'contracts' && <Button size="sm" onClick={() => setContractOpen(true)}><Plus className="w-3.5 h-3.5" /> Tạo Hợp đồng</Button>}
          </div>
        )}
      </div>

      {tab === 'catalog' && (
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/90 dark:bg-slate-900/70 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3 font-semibold">SKU & Tên</th>
                  <th className="px-4 py-3 font-semibold">Loại</th>
                  <th className="px-4 py-3 font-semibold">Đơn vị</th>
                  <th className="px-4 py-3 font-semibold text-right">Giá bán</th>
                  <th className="px-4 py-3 font-semibold text-right">Giá vốn</th>
                  <th className="px-4 py-3 font-semibold text-right">Tồn kho</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {products.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900 dark:text-white">{p.name}</p>
                      <p className="text-[11px] font-mono text-slate-400">{p.sku}</p>
                    </td>
                    <td className="px-4 py-3">{p.type}</td>
                    <td className="px-4 py-3">{p.unit}</td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums">{formatMoney(p.price)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-500">{formatMoney(p.cost)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{p.stock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'orders' && (
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/90 dark:bg-slate-900/70 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3 font-semibold">Mã Đơn</th>
                  <th className="px-4 py-3 font-semibold">Khách hàng</th>
                  <th className="px-4 py-3 font-semibold">Ngày đặt</th>
                  <th className="px-4 py-3 font-semibold text-right">Tổng tiền</th>
                  <th className="px-4 py-3 font-semibold">Thanh toán</th>
                  <th className="px-4 py-3 font-semibold">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td className="px-4 py-3 font-mono font-semibold text-slate-900 dark:text-white">{o.code}</td>
                    <td className="px-4 py-3">{o.customerName}</td>
                    <td className="px-4 py-3 tabular-nums">{o.orderDate}</td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums">{formatMoney(o.totalAmount)}</td>
                    <td className="px-4 py-3">
                      <StatusLabel tone={o.paymentStatus === 'paid' ? 'success' : 'warning'} text={o.paymentStatus} />
                    </td>
                    <td className="px-4 py-3">{o.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'contracts' && (
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/90 dark:bg-slate-900/70 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3 font-semibold">Mã & Hợp đồng</th>
                  <th className="px-4 py-3 font-semibold">Khách hàng</th>
                  <th className="px-4 py-3 font-semibold text-right">Giá trị</th>
                  <th className="px-4 py-3 font-semibold">Thời hạn</th>
                  <th className="px-4 py-3 font-semibold">Trạng thái & Ký số</th>
                  <th className="px-4 py-3 font-semibold text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {contracts.map((c) => (
                  <tr key={c.id}>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900 dark:text-white">{c.title}</p>
                      <p className="text-[11px] font-mono text-slate-400">{c.code}</p>
                    </td>
                    <td className="px-4 py-3">{c.customerName}</td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums">{formatMoney(c.value)}</td>
                    <td className="px-4 py-3 tabular-nums">{c.startDate} → {c.endDate}</td>
                    <td className="px-4 py-3">
                      <StatusLabel tone={c.status === 'expiring_soon' ? 'warning' : 'success'} text={`${c.status} · eSign: ${c.eSignStatus}`} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      {c.approvalStatus === 'pending_approval' && can('products', 'approve') && (
                        <button
                          onClick={() => updateContract(c.id, { approvalStatus: 'approved' })}
                          className="text-[#1951fc] hover:underline cursor-pointer"
                        >
                          Phê duyệt
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={prodOpen} onClose={() => setProdOpen(false)} title="Thêm Sản phẩm / Dịch vụ">
        <form onSubmit={handleCreateProduct} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Mã SKU" required value={pSku} onChange={(e) => setPSku(e.target.value)} />
            <Select label="Loại" value={pType} onChange={(e) => setPType(e.target.value as typeof pType)}>
              <option value="service">Dịch vụ / Subscription</option>
              <option value="product">Sản phẩm vật lý</option>
            </Select>
          </div>
          <Input label="Tên sản phẩm / dịch vụ" required value={pName} onChange={(e) => setPName(e.target.value)} />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input label="Giá bán (VND)" type="number" value={pPrice} onChange={(e) => setPPrice(e.target.value)} />
            <Input label="Giá vốn (VND)" type="number" value={pCost} onChange={(e) => setPCost(e.target.value)} />
            <Input label="Tồn kho" type="number" value={pStock} onChange={(e) => setPStock(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setProdOpen(false)}>Hủy</Button>
            <Button type="submit">Lưu</Button>
          </div>
        </form>
      </Modal>

      <Modal open={orderOpen} onClose={() => setOrderOpen(false)} title="Tạo Đơn hàng mới">
        <form onSubmit={handleCreateOrder} className="space-y-4">
          <Select label="Khách hàng" value={oCustId} onChange={(e) => setOCustId(e.target.value)}>
            {customers.map((c) => <option key={c.id} value={c.id}>{c.code} · {c.name}</option>)}
          </Select>
          <Select label="Sản phẩm / Dịch vụ" value={oProdId} onChange={(e) => setOProdId(e.target.value)}>
            {products.map((p) => <option key={p.id} value={p.id}>{p.sku} · {p.name} ({formatMoney(p.price)})</option>)}
          </Select>
          <Input label="Số lượng" type="number" min={1} value={oQty} onChange={(e) => setOQty(e.target.value)} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOrderOpen(false)}>Hủy</Button>
            <Button type="submit">Tạo Đơn</Button>
          </div>
        </form>
      </Modal>

      <Modal open={contractOpen} onClose={() => setContractOpen(false)} title="Tạo Hợp đồng mới">
        <form onSubmit={handleCreateContract} className="space-y-4">
          <Input label="Tiêu đề hợp đồng" required value={cTitle} onChange={(e) => setCTitle(e.target.value)} />
          <Select label="Khách hàng" value={cCustId} onChange={(e) => setCCustId(e.target.value)}>
            {customers.map((c) => <option key={c.id} value={c.id}>{c.code} · {c.name}</option>)}
          </Select>
          <Input label="Giá trị hợp đồng (VND)" type="number" value={cValue} onChange={(e) => setCValue(e.target.value)} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setContractOpen(false)}>Hủy</Button>
            <Button type="submit">Lưu Hợp đồng</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
