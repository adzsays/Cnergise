import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useFinancialData } from '@/contexts/FinancialDataContext';
import { useSpaceFilter } from '@/hooks/useSpaceFilter';
import * as XLSX from 'xlsx';

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ImportDialog = ({ open, onOpenChange }: ImportDialogProps) => {
  const { refreshData } = useFinancialData();
  const { getDefaultSpaceId, spaces } = useSpaceFilter();
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [allRows, setAllRows] = useState<any[]>([]);
  const [importType, setImportType] = useState<'transactions' | 'accounts'>('transactions');

  // Helper to find space by name or return default
  const findSpaceIdByName = (spaceName: string | undefined): string | null => {
    if (!spaceName) return getDefaultSpaceId();
    const space = spaces.find(s => s.name.toLowerCase() === spaceName.toLowerCase());
    return space?.id || getDefaultSpaceId();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) {
      console.log('No file selected');
      return;
    }

    console.log('File selected:', selectedFile.name, 'Size:', selectedFile.size);
    setFile(selectedFile);
    
    try {
      const data = await selectedFile.arrayBuffer();
      console.log('File read successfully, size:', data.byteLength);
      
      const workbook = XLSX.read(data);
      console.log('Workbook sheets:', workbook.SheetNames);
      
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      console.log('Parsed data rows:', jsonData.length);
      console.log('First row sample:', jsonData[0]);
      
      setAllRows(jsonData);
      setPreview(jsonData.slice(0, 5));
      
      if (jsonData.length === 0) {
        toast.error('File is empty or has no valid data');
      } else {
        toast.success(`Loaded ${jsonData.length} rows from ${selectedFile.name}`);
      }
    } catch (error) {
      toast.error('Failed to read file. Please check the file format.');
      console.error('File parsing error:', error);
      setAllRows([]);
      setPreview([]);
    }
  };

  const parseTransactionDate = (dateValue: any): number => {
    if (typeof dateValue === 'number') {
      const date = XLSX.SSF.parse_date_code(dateValue);
      return new Date(date.y, date.m - 1, date.d).getTime();
    }
    if (typeof dateValue === 'string') {
      const parsed = new Date(dateValue);
      return isNaN(parsed.getTime()) ? Date.now() : parsed.getTime();
    }
    return Date.now();
  };

  const pick = (row: any, ...keys: string[]) => {
    for (const k of keys) {
      if (row[k] !== undefined && row[k] !== null && row[k] !== '') return row[k];
    }
    return undefined;
  };

  const parseFrequency = (val: any): string => {
    const v = (val ?? '').toString().trim().toLowerCase();
    if (['daily', 'weekly', 'monthly', 'quarterly', 'yearly'].includes(v)) return v;
    return 'monthly';
  };

  const monthlyFromFrequency = (amount: number, freq: string): number => {
    switch (freq) {
      case 'daily': return amount * 30;
      case 'weekly': return amount * 4.345;
      case 'quarterly': return amount / 3;
      case 'yearly': return amount / 12;
      default: return amount;
    }
  };

  const importTransactions = async (data: any[]) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('You must be logged in');
      return;
    }

    const transactions = data.map((row) => {
      const type = (pick(row, 'type', 'Type', 'Type ') || 'expense').toString().toLowerCase();
      const description = pick(row, 'description', 'Description', 'subcategory', 'Subcategory') || '';
      const monthlyInput = pick(row, 'monthly', 'Monthly');
      const amountInput = pick(row, 'amount', 'Amount');
      const amount = parseFloat((amountInput ?? monthlyInput ?? '0').toString()) || 0;
      const frequency = parseFrequency(pick(row, 'frequency', 'Frequency'));

      // Date: full date OR "Recurring Date" (day of month)
      const fullDate = pick(row, 'date', 'Date');
      const recurringDay = pick(row, 'recurring date', 'Recurring Date', 'recurring_date');
      let date: number;
      if (fullDate !== undefined) {
        date = parseTransactionDate(fullDate);
      } else if (recurringDay !== undefined) {
        const day = Math.min(28, Math.max(1, parseInt(recurringDay.toString(), 10) || 1));
        const now = new Date();
        date = new Date(now.getFullYear(), now.getMonth(), day).getTime();
      } else {
        date = Date.now();
      }

      const costCentre = pick(row, 'cost centre', 'Cost Centre', 'cost_centre', 'costCentre', 'Cost Center', 'cost center') || 'Personal';
      const endDateRaw = pick(row, 'end date', 'End Date', 'end_date', 'endDate');
      const endDate = endDateRaw ? new Date(parseTransactionDate(endDateRaw)).toISOString().slice(0, 10) : null;
      const accountName = pick(row, 'account', 'Account');

      // If user supplied "Monthly" directly, use it; otherwise derive from amount+frequency
      const monthly = monthlyInput !== undefined
        ? (parseFloat(monthlyInput.toString()) || 0)
        : monthlyFromFrequency(amount, frequency);
      const daily = monthly / 30;

      const spaceName = pick(row, 'space', 'Space', 'group_name', 'Group Name', 'group');
      const spaceId = findSpaceIdByName(spaceName);

      return {
        user_id: user.id,
        date,
        type: type === 'income' ? 'income' : 'expense',
        category: accountName || costCentre || 'Other',
        subcategory: description,
        space_id: spaceId,
        group_name: 'Personal',
        amount: amount || monthly,
        percentage: 0,
        daily,
        monthly,
        cost_centre: costCentre,
        frequency,
        end_date: endDate,
        projections: [],
      };
    });

    const { error } = await supabase
      .from('financial_transactions')
      .insert(transactions);

    if (error) {
      toast.error('Failed to import transactions');
      console.error(error);
      throw error;
    }

    toast.success(`Successfully imported ${transactions.length} transactions`);
  };

  const importAccounts = async (data: any[]) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('You must be logged in');
      return;
    }

    const accounts = data.map((row) => {
      const spaceName = row.space || row.Space || row.group_name || row['Group Name'] || row.group;
      const spaceId = findSpaceIdByName(spaceName);
      const spaceForGroupName = spaces.find(s => s.id === spaceId);
      
      return {
        user_id: user.id,
        name: row.name || row.Name || 'Unnamed Account',
        type: (row.type || row.Type || 'asset').toLowerCase(),
        category: row.category || row.Category || null,
        space_id: spaceId,
        group_name: 'Personal',
        balance: parseFloat(row.balance || row.Balance || '0'),
        currency: row.currency || row.Currency || 'GBP',
        credit_limit: row.credit_limit || row['Credit Limit'] ? parseFloat(row.credit_limit || row['Credit Limit']) : null,
      };
    });

    const { error } = await supabase
      .from('financial_accounts')
      .insert(accounts);

    if (error) {
      toast.error('Failed to import accounts');
      console.error(error);
      throw error;
    }

    toast.success(`Successfully imported ${accounts.length} accounts`);
  };

  const handleImport = async () => {
    if (preview.length === 0 || allRows.length === 0) {
      toast.error('No valid data to import. Please select a file first.');
      return;
    }

    setLoading(true);

    try {
      const jsonData = allRows;

      if (jsonData.length === 0) {
        toast.error('No data found in file');
        setLoading(false);
        return;
      }

      if (importType === 'transactions') {
        await importTransactions(jsonData);
      } else {
        await importAccounts(jsonData);
      }

      refreshData();
      onOpenChange(false);
      setFile(null);
      setPreview([]);
      setAllRows([]);
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Import failed. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Import from CSV/Excel</DialogTitle>
        </DialogHeader>

        <Tabs value={importType} onValueChange={(v) => setImportType(v as any)} className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="accounts">Accounts</TabsTrigger>
          </TabsList>

          <TabsContent value="transactions" className="space-y-4 mt-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Required:</strong> Type, Description, (Amount or Monthly), (Date or Recurring Date)
                <br />
                <strong>Optional:</strong> Cost Centre, Frequency, End Date, Account
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="transaction-file">Select CSV or Excel file</Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => document.getElementById('transaction-file')?.click()}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {file ? file.name : 'Choose File'}
                </Button>
                <input
                  id="transaction-file"
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            </div>

            {preview.length > 0 && (
              <div className="space-y-2">
                <Label>Preview (first 5 rows)</Label>
                <div className="rounded-md border bg-muted/50 p-4 max-h-[200px] overflow-auto">
                  <pre className="text-xs text-foreground whitespace-pre-wrap">{JSON.stringify(preview, null, 2)}</pre>
                </div>
              </div>
            )}

            {file && preview.length === 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No data could be parsed from the file. Please check the file format.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="accounts" className="space-y-4 mt-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Required columns:</strong> name, type, balance
                <br />
                <strong>Optional:</strong> category, space, currency, credit_limit
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="account-file">Select CSV or Excel file</Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => document.getElementById('account-file')?.click()}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {file ? file.name : 'Choose File'}
                </Button>
                <input
                  id="account-file"
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            </div>

            {preview.length > 0 && (
              <div className="space-y-2">
                <Label>Preview (first 5 rows)</Label>
                <div className="rounded-md border bg-muted/50 p-4 max-h-[200px] overflow-auto">
                  <pre className="text-xs text-foreground whitespace-pre-wrap">{JSON.stringify(preview, null, 2)}</pre>
                </div>
              </div>
            )}

            {file && preview.length === 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No data could be parsed from the file. Please check the file format.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setFile(null);
              setPreview([]);
              setAllRows([]);
            }}
          >
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={!file || loading}>
            {loading ? 'Importing...' : `Import ${importType === 'transactions' ? 'Transactions' : 'Accounts'}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
