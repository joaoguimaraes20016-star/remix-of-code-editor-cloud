import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";

interface AddSaleDialogProps {
  onAddSale: (sale: {
    customerName: string;
    setter: string;
    salesRep: string;
    offerOwner: string;
    date: string;
    revenue: number;
    setterCommission: number;
    commission: number;
    status: 'closed' | 'pending' | 'no-show';
  }) => void;
}

export function AddSaleDialog({ onAddSale }: AddSaleDialogProps) {
  const [open, setOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [offerOwner, setOfferOwner] = useState("");
  const [setter, setSetter] = useState("");
  const [salesRep, setSalesRep] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [revenue, setRevenue] = useState("");
  const [setterCommission, setSetterCommission] = useState("");
  const [commission, setCommission] = useState("");
  const [status, setStatus] = useState<'closed' | 'pending' | 'no-show'>("pending");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddSale({
      customerName,
      setter,
      salesRep,
      offerOwner,
      date,
      revenue: parseFloat(revenue),
      setterCommission: parseFloat(setterCommission),
      commission: parseFloat(commission),
      status,
    });
    setOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setCustomerName("");
    setOfferOwner("");
    setSetter("");
    setSalesRep("");
    setDate(new Date().toISOString().split('T')[0]);
    setRevenue("");
    setSetterCommission("");
    setCommission("");
    setStatus("pending");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="text-sm md:text-base w-full sm:w-auto">
          <Plus className="mr-2 h-3.5 w-3.5 md:h-4 md:w-4" />
          Add Sale
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto w-[95vw] md:w-full">
        <DialogHeader>
          <DialogTitle>Add New Sale</DialogTitle>
          <DialogDescription>
            Enter the details of the new sale transaction.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="customerName">Customer Name</Label>
              <Input
                id="customerName"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="John Doe"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="offerOwner">Offer Owner</Label>
              <Input
                id="offerOwner"
                value={offerOwner}
                onChange={(e) => setOfferOwner(e.target.value)}
                placeholder="Jane Smith"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="setter">Setter</Label>
              <Input
                id="setter"
                value={setter}
                onChange={(e) => setSetter(e.target.value)}
                placeholder="Mike Johnson"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="salesRep">Closer</Label>
              <Input
                id="salesRep"
                value={salesRep}
                onChange={(e) => setSalesRep(e.target.value)}
                placeholder="Sarah Williams"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="revenue">Revenue</Label>
              <Input
                id="revenue"
                type="number"
                step="0.01"
                value={revenue}
                onChange={(e) => setRevenue(e.target.value)}
                placeholder="10000"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="setterCommission">Setter Commission</Label>
              <Input
                id="setterCommission"
                type="number"
                step="0.01"
                value={setterCommission}
                onChange={(e) => setSetterCommission(e.target.value)}
                placeholder="500"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="commission">Closer Commission</Label>
              <Input
                id="commission"
                type="number"
                step="0.01"
                value={commission}
                onChange={(e) => setCommission(e.target.value)}
                placeholder="1000"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={(value) => setStatus(value as 'closed' | 'pending' | 'no-show')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="closed">Closed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="no-show">No Show</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Add Sale</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
