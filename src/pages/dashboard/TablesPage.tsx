import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HeroButton, GlassButton, GhostButton } from "@/components/ui/button-variants";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { QrCode, Plus, Trash2, Download, Edit3, X, Check, Zap, Eye } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { QRCodeCanvas } from "qrcode.react";
import { API_BASE_URL } from "@/config";

interface Table {
  _id: string;
  tableName: string;
  qrCodeUrl: string;
  seats: number;
  createdAt: string;
  hasActiveOrders?: boolean;
  allowOrdering?: boolean;
}

const TablesPage = () => {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTable, setEditingTable] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ tableName: "", seats: 4, allowOrdering: true });
  const [createForm, setCreateForm] = useState({ tableName: "", seats: 4, allowOrdering: true });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isQuickCreating, setIsQuickCreating] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ tableId: string; tableName: string } | null>(null);
  const { token } = useAuth();
  const { toast } = useToast();

  // API base URL from environment variable
  const API_URL = API_BASE_URL;

  // Fetch tables with order status
  const fetchTables = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/tables`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      if (data.success) {
        // Fetch active orders for each table
        const tablesWithOrderStatus = await Promise.all(
          data.data.map(async (table: Table) => {
            try {
              const ordersResponse = await fetch(
                `${API_URL}/api/orders/table/${table._id}?excludeStatus=paid,cancelled`,
                {
                  headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                  },
                }
              );
              const ordersData = await ordersResponse.json();

              // Table has active orders if there are any orders returned (excluding served/cancelled)
              const hasActiveOrders = ordersData.success &&
                ordersData.data &&
                ordersData.data.length > 0;

              return {
                ...table,
                hasActiveOrders
              };
            } catch (error) {
              console.error(`Error fetching orders for table ${table._id}:`, error);
              return { ...table, hasActiveOrders: false };
            }
          })
        );

        setTables(tablesWithOrderStatus);
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to fetch tables",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Fetch tables error:", error);
      toast({
        title: "Error",
        description: "Failed to connect to server",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [token, toast, API_URL]);

  // Generate next table name
  const getNextTableName = () => {
    const tableNumbers = tables
      .map(t => {
        const match = t.tableName.match(/^Table (\d+)$/i);
        return match ? parseInt(match[1]) : 0;
      })
      .filter(n => n > 0);

    const maxNumber = tableNumbers.length > 0 ? Math.max(...tableNumbers) : 0;
    return `Table ${maxNumber + 1}`;
  };

  // Quick create table
  const handleQuickCreate = async () => {
    setIsQuickCreating(true);
    const tableName = getNextTableName();

    try {
      const response = await fetch(`${API_URL}/api/tables`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tableName: tableName,
          seats: 4,
          allowOrdering: true,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setTables([{ ...data.data, hasActiveOrders: false }, ...tables]);
        toast({
          title: "Success",
          description: `${tableName} created successfully`,
        });
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to create table",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Quick create table error:", error);
      toast({
        title: "Error",
        description: "Failed to create table",
        variant: "destructive",
      });
    } finally {
      setIsQuickCreating(false);
    }
  };

  // Create new table
  const handleCreateTable = async () => {
    if (!createForm.tableName.trim()) {
      toast({
        title: "Error",
        description: "Table name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/tables`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tableName: createForm.tableName.trim(),
          seats: createForm.seats,
          allowOrdering: createForm.allowOrdering,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setTables([{ ...data.data, hasActiveOrders: false }, ...tables]);
        setCreateForm({ tableName: "", seats: 4, allowOrdering: true });
        setShowCreateModal(false);
        toast({
          title: "Success",
          description: "Table created successfully",
        });
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to create table",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Create table error:", error);
      toast({
        title: "Error",
        description: "Failed to create table",
        variant: "destructive",
      });
    }
  };

  // Edit table
  const handleEditTable = async (tableId: string) => {
    if (!editForm.tableName.trim()) {
      toast({
        title: "Error",
        description: "Table name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/tables/${tableId}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tableName: editForm.tableName.trim(),
          seats: editForm.seats,
          allowOrdering: editForm.allowOrdering,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setTables(tables.map(table =>
          table._id === tableId ? { ...data.data, hasActiveOrders: table.hasActiveOrders } : table
        ));
        setEditingTable(null);
        toast({
          title: "Success",
          description: "Table updated successfully",
        });
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to update table",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Update table error:", error);
      toast({
        title: "Error",
        description: "Failed to update table",
        variant: "destructive",
      });
    }
  };

  // Delete table
  const handleDeleteTable = async (tableId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/tables/${tableId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      if (data.success) {
        setTables(tables.filter(table => table._id !== tableId));
        setDeleteConfirm(null);
        toast({
          title: "Success",
          description: "Table deleted successfully",
        });
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to delete table",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Delete table error:", error);
      toast({
        title: "Error",
        description: "Failed to delete table",
        variant: "destructive",
      });
    }
  };

  // Download QR code as PNG
  const handleDownloadQR = (tableId: string, tableName: string) => {
    try {
      const canvas = document.getElementById(`qr-${tableId}`) as HTMLCanvasElement;
      if (!canvas) {
        toast({
          title: "Error",
          description: "QR code not found",
          variant: "destructive",
        });
        return;
      }

      canvas.toBlob((blob) => {
        if (blob) {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${tableName}-QR.png`;
          a.click();
          window.URL.revokeObjectURL(url);
          toast({
            title: "Success",
            description: "QR code downloaded successfully",
          });
        }
      });
    } catch (error) {
      console.error("Download QR error:", error);
      toast({
        title: "Error",
        description: "Failed to download QR code",
        variant: "destructive",
      });
    }
  };

  // Start editing
  const startEditing = (table: Table) => {
    setEditingTable(table._id);
    setEditForm({ tableName: table.tableName, seats: table.seats, allowOrdering: table.allowOrdering !== false });
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingTable(null);
    setEditForm({ tableName: "", seats: 4, allowOrdering: true });
  };

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed top-0 left-0 right-0 bottom-0 bg-black/60 flex items-center justify-center z-[9999] p-4" style={{ margin: 0 }}>
          <div className="bg-background border border-border rounded-lg shadow-2xl max-w-md w-full animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-border">
              <h3 className="text-xl font-semibold text-foreground">Delete Table</h3>
              <p className="text-sm text-muted-foreground mt-1">This action cannot be undone</p>
            </div>
            <div className="p-6">
              <p className="text-foreground">
                Are you sure you want to delete <strong>{deleteConfirm.tableName}</strong>? All associated QR codes will be invalidated.
              </p>
            </div>
            <div className="p-6 border-t border-border flex justify-end gap-2">
              <GhostButton onClick={() => setDeleteConfirm(null)}>
                Cancel
              </GhostButton>
              <button
                onClick={() => handleDeleteTable(deleteConfirm.tableId)}
                className="inline-flex items-center justify-center h-10 px-4 rounded-md text-sm font-medium transition-colors bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                <Trash2 className="h-4 w-4 mr-2 text-white" />
                Delete Table
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Table Modal */}
      {showCreateModal && (
        <div className="fixed top-0 left-0 right-0 bottom-0 bg-black/60 flex items-center justify-center z-[9999] p-4" style={{ margin: 0 }}>
          <div className="bg-background border border-border rounded-lg shadow-2xl max-w-md w-full animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-border">
              <h3 className="text-xl font-semibold text-foreground">Create New Table</h3>
              <p className="text-sm text-muted-foreground mt-1">Add a new table with custom settings</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <Label htmlFor="createTableName">Table Name</Label>
                <Input
                  id="createTableName"
                  placeholder="e.g., Table 1, VIP Table"
                  value={createForm.tableName}
                  onChange={(e) => setCreateForm({ ...createForm, tableName: e.target.value })}
                  onKeyPress={(e) => e.key === 'Enter' && handleCreateTable()}
                  autoFocus
                />
              </div>
              <div>
                <Label htmlFor="createSeats">Number of Seats</Label>
                <Input
                  id="createSeats"
                  type="number"
                  min="1"
                  max="20"
                  value={createForm.seats}
                  onChange={(e) => setCreateForm({ ...createForm, seats: parseInt(e.target.value) || 4 })}
                />
              </div>
              <div className="flex items-center justify-between space-x-2 pt-2">
                <div className="space-y-0.5">
                  <Label htmlFor="allowOrdering" className="text-sm font-medium">Allow Orders</Label>
                  <p className="text-xs text-muted-foreground">Customers can place orders</p>
                </div>
                <Switch
                  id="allowOrdering"
                  checked={createForm.allowOrdering}
                  onCheckedChange={(checked) => setCreateForm({ ...createForm, allowOrdering: checked })}
                />
              </div>
            </div>
            <div className="p-6 border-t border-border flex justify-end gap-2">
              <GhostButton onClick={() => {
                setShowCreateModal(false);
                setCreateForm({ tableName: "", seats: 4, allowOrdering: true });
              }}>
                Cancel
              </GhostButton>
              <HeroButton onClick={handleCreateTable}>
                <Check className="h-4 w-4 mr-2" />
                Create Table
              </HeroButton>
            </div>
          </div>
        </div>
      )}

      <div className="p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">Table QR Codes</h2>
            <p className="text-muted-foreground mt-1">Manage your restaurant tables and QR codes</p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <GlassButton
              onClick={handleQuickCreate}
              disabled={isQuickCreating}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2"
            >
              {isQuickCreating ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
              ) : (
                <Zap className="h-4 w-4" />
              )}
              Quick Create
            </GlassButton>
            <HeroButton onClick={() => setShowCreateModal(true)} className="flex-1 sm:flex-none justify-center">
              <Plus className="h-4 w-4 mr-2" />
              Create Table
            </HeroButton>
          </div>
        </div>

        {/* Tables Grid */}
        <Card className="card-glass border-0 shadow-lg">
          <CardHeader className="border-b border-border/50">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">Active Tables</CardTitle>
              <Badge variant="secondary" className="text-sm">
                {tables.length} {tables.length === 1 ? 'table' : 'tables'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {tables.length === 0 ? (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
                  <QrCode className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">No tables yet</h3>
                <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                  Get started by creating your first table to generate QR codes for your restaurant
                </p>
                <div className="flex gap-2 justify-center">
                  <GlassButton onClick={handleQuickCreate} disabled={isQuickCreating}>
                    <Zap className="h-4 w-4 mr-2" />
                    Quick Create
                  </GlassButton>
                  <HeroButton onClick={() => setShowCreateModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Table
                  </HeroButton>
                </div>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {tables.map((table) => (
                  <Card
                    key={table._id}
                    className={`border hover:shadow-lg transition-all duration-200 ${table.hasActiveOrders
                      ? 'bg-green-50 dark:bg-green-950/20 border-green-300 dark:border-green-800'
                      : ''
                      }`}
                  >
                    <CardContent className="p-6 text-center space-y-4">
                      {/* Active Order Badge */}
                      {table.hasActiveOrders && (
                        <div className="flex justify-center">
                          <Badge variant="default" className="bg-green-600 hover:bg-green-700 text-white">
                            Active Orders
                          </Badge>
                        </div>
                      )}

                      {/* QR Code */}
                      <div className="w-36 h-36 mx-auto bg-white rounded-xl flex items-center justify-center border-2 border-border p-3 shadow-sm">
                        <QRCodeCanvas
                          id={`qr-${table._id}`}
                          value={table.qrCodeUrl}
                          size={130}
                          level="H"
                          includeMargin={false}
                        />
                      </div>

                      {editingTable === table._id ? (
                        <div className="space-y-2">
                          <Input
                            placeholder="Table name"
                            value={editForm.tableName}
                            onChange={(e) => setEditForm({ ...editForm, tableName: e.target.value })}
                          />
                          <Input
                            type="number"
                            min="1"
                            max="20"
                            value={editForm.seats}
                            onChange={(e) => setEditForm({ ...editForm, seats: parseInt(e.target.value) || 4 })}
                          />
                          <div className="flex items-center justify-between space-x-2 py-2">
                            <Label htmlFor={`allowOrdering-${table._id}`} className="text-sm">Allow Orders</Label>
                            <Switch
                              id={`allowOrdering-${table._id}`}
                              checked={editForm.allowOrdering}
                              onCheckedChange={(checked) => setEditForm({ ...editForm, allowOrdering: checked })}
                            />
                          </div>
                          <div className="flex gap-2">
                            <GlassButton size="sm" className="flex-1" onClick={() => handleEditTable(table._id)}>
                              <Check className="h-4 w-4 mr-1" />
                              Save
                            </GlassButton>
                            <GhostButton size="sm" onClick={cancelEditing}>
                              <X className="h-4 w-4" />
                            </GhostButton>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <h4 className="font-semibold text-lg text-foreground">{table.tableName}</h4>
                          <Badge variant="outline" className="mt-1">
                            {table.seats} {table.seats === 1 ? 'seat' : 'seats'}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-2 break-all px-2">
                            {table.qrCodeUrl}
                          </p>
                          {table.allowOrdering === false && (
                            <div className="mt-3 flex justify-center">
                              <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                                <Eye className="w-3 h-3 mr-1" />
                                View Only
                              </Badge>
                            </div>
                          )}
                        </div>
                      )}

                      {editingTable !== table._id && (
                        <div className="flex gap-2">
                          <GlassButton
                            size="sm"
                            className="flex-1"
                            onClick={() => handleDownloadQR(table._id, table.tableName)}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </GlassButton>
                          <GlassButton
                            size="sm"
                            onClick={() => startEditing(table)}
                          >
                            <Edit3 className="h-4 w-4" />
                          </GlassButton>
                          <button
                            onClick={() => setDeleteConfirm({ tableId: table._id, tableName: table.tableName })}
                            className="inline-flex items-center justify-center h-9 px-3 rounded-md text-sm font-medium transition-colors hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400 text-muted-foreground"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default TablesPage;