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
      
      setPreview(jsonData.slice(0, 5));
      
      if (jsonData.length === 0) {
        toast.error('File is empty or has no valid data');
      } else {
        toast.success(`Loaded ${jsonData.length} rows from ${selectedFile.name}`);
      }
    } catch (error) {
      toast.error('Failed to read file. Please check the file format.');
      console.error('File parsing error:', error);
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

  const importTransactions = async (data: any[]) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('You must be logged in');
      return;
    }

    const transactions = data.map((row) => {
      const amount = parseFloat(row.amount || row.Amount || '0');
      const monthly = parseFloat(row.monthly || row.Monthly || amount.toString());
      const daily = parseFloat(row.daily || row.Daily || (amount / 30).toString());
      const spaceName = row.space || row.Space || row.group_name || row['Group Name'] || row.group;
      const spaceId = findSpaceIdByName(spaceName);
      const spaceForGroupName = spaces.find(s => s.id === spaceId);
      
      return {
        user_id: user.id,
        date: parseTransactionDate(row.date || row.Date),
        type: (row.type || row.Type || 'expense').toLowerCase(),
        category: row.category || row.Category || 'Other',
        subcategory: row.subcategory || row.Subcategory || '',
        space_id: spaceId,
        group_name: spaceForGroupName?.name || 'General',
        amount,
        percentage: parseFloat(row.percentage || row.Percentage || '0'),
        daily,
        monthly,
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
        group_name: spaceForGroupName?.name || 'General',
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
    if (!file) {
      toast.error('Please select a file');
      return;
    }

    if (preview.length === 0) {
      toast.error('No valid data to import');
      return;
    }

    setLoading(true);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

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
                <strong>Required columns:</strong> date, type, category, amount
                <br />
                <strong>Optional:</strong> subcategory, space, monthly, daily, percentage
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
