import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface Sale {
  id: string;
  customerName: string;
  offerOwner: string;
  setter: string;
  salesRep: string;
  date: string;
  revenue: number;
  setterCommission: number;
  commission: number;
  status: 'closed' | 'pending' | 'no-show';
}

interface SalesTableProps {
  sales: Sale[];
  userRole?: string | null;
  currentUserName?: string | null;
  onSaleDeleted?: () => void;
  teamMembers?: Array<{ id: string; name: string }>;
}

export function SalesTable({ sales, userRole, currentUserName, onSaleDeleted, teamMembers = [] }: SalesTableProps) {
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [saleToDelete, setSaleToDelete] = useState<Sale | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editingSetter, setEditingSetter] = useState<string | null>(null);

  const canDelete = (sale: Sale) => {
    return userRole === 'admin' || userRole === 'owner' || sale.offerOwner === currentUserName;
  };

  const handleDeleteClick = (sale: Sale) => {
    setSaleToDelete(sale);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!saleToDelete) return;

    setDeleting(true);
    try {
      // First delete any MRR commissions linked to this sale
      const { error: mrrError } = await supabase
        .from('mrr_commissions')
        .delete()
        .eq('sale_id', saleToDelete.id);

      if (mrrError) throw mrrError;

      // Then delete the sale
      const { error } = await supabase
        .from('sales')
        .delete()
        .eq('id', saleToDelete.id);

      if (error) throw error;

      toast({
        title: 'Sale deleted',
        description: 'The transaction and MRR commissions have been removed successfully',
      });

      onSaleDeleted?.();
    } catch (error: any) {
      toast({
        title: 'Error deleting sale',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setSaleToDelete(null);
    }
  };

  const handleSetterChange = async (saleId: string, newSetter: string) => {
    try {
      const { error } = await supabase
        .from('sales')
        .update({ setter: newSetter })
        .eq('id', saleId);

      if (error) throw error;

      toast({
        title: 'Setter updated',
        description: 'The setter has been updated successfully',
      });

      setEditingSetter(null);
      onSaleDeleted?.(); // Refresh data
    } catch (error: any) {
      toast({
        title: 'Error updating setter',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: Sale['status']) => {
    const variants = {
      closed: 'default',
      pending: 'secondary',
      'no-show': 'destructive',
    } as const;

    const labels = {
      closed: 'Closed',
      pending: 'Pending',
      'no-show': 'No Show',
    };

    return (
      <Badge variant={variants[status]}>
        {labels[status]}
      </Badge>
    );
  };

  return (
    <>
      <div className="rounded-lg border bg-card overflow-x-auto">
        <Table className="min-w-[600px]">
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Offer Owner</TableHead>
              <TableHead>Setter</TableHead>
              <TableHead>Closer</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Revenue</TableHead>
              <TableHead>Setter Commission</TableHead>
              <TableHead>Closer Commission</TableHead>
              <TableHead>Status</TableHead>
              {(userRole === 'admin' || userRole === 'owner') && (
                <TableHead className="w-[100px]">Actions</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sales.map((sale) => (
              <TableRow key={sale.id}>
                <TableCell className="font-medium">{sale.customerName}</TableCell>
                <TableCell>{sale.offerOwner}</TableCell>
                <TableCell>
                  {userRole === 'admin' && editingSetter === sale.id ? (
                    <Select
                      value={sale.setter}
                      onValueChange={(value) => handleSetterChange(sale.id, value)}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {teamMembers.map((member) => (
                          <SelectItem key={member.id} value={member.name}>
                            {member.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div 
                      onClick={() => userRole === 'admin' && setEditingSetter(sale.id)}
                      className={userRole === 'admin' ? 'cursor-pointer hover:text-primary' : ''}
                    >
                      {sale.setter}
                    </div>
                  )}
                </TableCell>
                <TableCell>{sale.salesRep}</TableCell>
                <TableCell>{new Date(sale.date).toLocaleDateString()}</TableCell>
                <TableCell>${sale.revenue.toLocaleString()}</TableCell>
                <TableCell className="text-primary font-semibold">
                  ${sale.setterCommission.toLocaleString()}
                </TableCell>
                <TableCell className="text-accent font-semibold">
                  ${sale.commission.toLocaleString()}
                </TableCell>
                <TableCell>{getStatusBadge(sale.status)}</TableCell>
                {(userRole === 'admin' || userRole === 'owner') && (
                  <TableCell>
                    {canDelete(sale) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(sale)}
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Transaction</AlertDialogTitle>
            <AlertDialogDescription>
            Are you sure you want to delete this transaction for {saleToDelete?.customerName}? 
              This will permanently remove ${saleToDelete?.revenue.toLocaleString()} in revenue, all associated commissions, and any MRR commissions. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
