import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, Plus, Lock, Unlock } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useAccounting, AccountingPeriod } from '@/hooks/useAccounting';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AccountingPeriodsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AccountingPeriodsDialog = ({ open, onOpenChange }: AccountingPeriodsDialogProps) => {
  const { accountingPeriods, createAccountingPeriod, refreshData } = useAccounting();
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !startDate || !endDate) {
      toast.error('Please fill in all fields');
      return;
    }

    if (endDate <= startDate) {
      toast.error('End date must be after start date');
      return;
    }

    await createAccountingPeriod({
      name,
      start_date: format(startDate, 'yyyy-MM-dd'),
      end_date: format(endDate, 'yyyy-MM-dd'),
      is_closed: false,
      space_id: null,
    });

    setName('');
    setStartDate(undefined);
    setEndDate(undefined);
    setShowAddForm(false);
  };

  const togglePeriodClosed = async (period: AccountingPeriod) => {
    try {
      const { error } = await supabase
        .from('accounting_periods')
        .update({ is_closed: !period.is_closed })
        .eq('id', period.id);

      if (error) throw error;
      await refreshData();
      toast.success(period.is_closed ? 'Period reopened' : 'Period closed');
    } catch (error) {
      console.error('Error toggling period:', error);
      toast.error('Failed to update period');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Accounting Periods</DialogTitle>
        </DialogHeader>

        {/* Existing Periods */}
        <div className="space-y-4">
          {accountingPeriods.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period Name</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[80px]">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accountingPeriods.map(period => (
                  <TableRow key={period.id}>
                    <TableCell className="font-medium">{period.name}</TableCell>
                    <TableCell>{format(new Date(period.start_date), 'PP')}</TableCell>
                    <TableCell>{format(new Date(period.end_date), 'PP')}</TableCell>
                    <TableCell>
                      <Badge variant={period.is_closed ? 'secondary' : 'default'}>
                        {period.is_closed ? 'Closed' : 'Open'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => togglePeriodClosed(period)}
                      >
                        {period.is_closed ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No accounting periods defined yet
            </div>
          )}

          {/* Add Form */}
          {showAddForm ? (
            <form onSubmit={handleSubmit} className="space-y-4 border rounded-lg p-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Period Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., FY 2025-26 Q1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full justify-start", !startDate && "text-muted-foreground")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {startDate ? format(startDate, 'PPP') : 'Select date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={setStartDate}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full justify-start", !endDate && "text-muted-foreground")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {endDate ? format(endDate, 'PPP') : 'Select date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={setEndDate}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Period</Button>
              </div>
            </form>
          ) : (
            <Button onClick={() => setShowAddForm(true)} className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Add Accounting Period
            </Button>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
