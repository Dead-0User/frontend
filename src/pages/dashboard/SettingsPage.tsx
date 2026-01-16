import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { HeroButton } from "@/components/ui/button-variants";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CURRENCIES } from "@/constants/currencies";
import { Palette, Circle, Check, Upload, X, Image as ImageIcon, Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { API_BASE_URL } from "@/config";

interface Tax {
  name: string;
  rate: number;
}

interface DayHours {
  day: string;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

interface LicenseField {
  id: string;
  label: string;
  value: string;
  order: number;
}

const SettingsPage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // State for new tax input
  const [newTaxName, setNewTaxName] = useState("");
  const [newTaxRate, setNewTaxRate] = useState("");

  const defaultWeekHours: DayHours[] = [
    { day: "Monday", isOpen: true, openTime: "09:00", closeTime: "22:00" },
    { day: "Tuesday", isOpen: true, openTime: "09:00", closeTime: "22:00" },
    { day: "Wednesday", isOpen: true, openTime: "09:00", closeTime: "22:00" },
    { day: "Thursday", isOpen: true, openTime: "09:00", closeTime: "22:00" },
    { day: "Friday", isOpen: true, openTime: "09:00", closeTime: "22:00" },
    { day: "Saturday", isOpen: true, openTime: "10:00", closeTime: "23:00" },
    { day: "Sunday", isOpen: true, openTime: "10:00", closeTime: "23:00" },
  ];

  const [initialData, setInitialData] = useState({
    restaurantName: "",
    name: "",
    currency: "INR",
    googleMapsUrl: "",
    operationalHours: "",
    templateStyle: "classic",
    logo: "",
    address: "",
    fssai: "",
    gstNo: "",
    receiptFooter: "",
    taxes: [] as Tax[],
    fssaiLabel: "FSSAI Number",
    gstLabel: "GST/Tax Number",
    allowOrdering: true,
  });
  const [restaurantInfo, setRestaurantInfo] = useState({
    restaurantName: "",
    name: "",
    currency: "INR",
    googleMapsUrl: "",
    operationalHours: "",
    templateStyle: "classic",
    logo: "",
    address: "",
    fssai: "",
    gstNo: "",
    receiptFooter: "",
    taxes: [] as Tax[],
    fssaiLabel: "FSSAI Number",
    gstLabel: "GST/Tax Number",
  });
  const [weekHours, setWeekHours] = useState<DayHours[]>(defaultWeekHours);
  const [licenseFields, setLicenseFields] = useState<LicenseField[]>([]);
  const [firstTableId, setFirstTableId] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [removeLogo, setRemoveLogo] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Helper function to parse operational hours string into structured format
  const parseOperationalHours = (hoursString: string): DayHours[] => {
    if (!hoursString) return defaultWeekHours;

    try {
      // Try to parse as JSON first (new format)
      const parsed = JSON.parse(hoursString);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // Legacy text format - return default
      return defaultWeekHours;
    }

    return defaultWeekHours;
  };

  // Helper function to convert structured hours to string for storage
  const formatOperationalHours = (hours: DayHours[]): string => {
    return JSON.stringify(hours);
  };

  // License field management functions
  const addLicenseField = () => {
    const newField: LicenseField = {
      id: `license-${Date.now()}`,
      label: "",
      value: "",
      order: licenseFields.length
    };
    setLicenseFields([...licenseFields, newField]);
  };

  const removeLicenseField = (id: string) => {
    const updated = licenseFields.filter(f => f.id !== id);
    // Reorder remaining fields
    const reordered = updated.map((f, idx) => ({ ...f, order: idx }));
    setLicenseFields(reordered);
  };

  const updateLicenseField = (id: string, field: 'label' | 'value', newValue: string) => {
    setLicenseFields(licenseFields.map(f =>
      f.id === id ? { ...f, [field]: newValue } : f
    ));
  };

  const moveLicenseField = (id: string, direction: 'up' | 'down') => {
    const index = licenseFields.findIndex(f => f.id === id);
    if (index === -1) return;

    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === licenseFields.length - 1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const updated = [...licenseFields];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];

    // Update order values
    const reordered = updated.map((f, idx) => ({ ...f, order: idx }));
    setLicenseFields(reordered);
  };

  // Fetch current restaurant settings
  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_BASE_URL}/api/restaurant/current`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const text = await response.text();

      if (!response.ok) {
        throw new Error(
          `Failed to fetch settings: ${response.status} - ${text}`
        );
      }

      const data = JSON.parse(text);
      if (data.success) {
        const logoUrl = data.restaurant.logo
          ? `${API_BASE_URL}${data.restaurant.logo}`
          : null;

        // Handle legacy taxName/taxRate if taxes array is empty/missing but legacy fields exist
        let taxes = data.restaurant.taxes || [];
        if (taxes.length === 0 && data.restaurant.taxName && data.restaurant.taxRate) {
          taxes = [{ name: data.restaurant.taxName, rate: Number(data.restaurant.taxRate) }];
        }

        const settings = {
          restaurantName: data.restaurant.restaurantName,
          name: data.restaurant.name,
          currency: data.restaurant.currency || "INR",
          googleMapsUrl: data.restaurant.googleMapsUrl || "",
          operationalHours: data.restaurant.operationalHours || "",
          logo: data.restaurant.logo || "",
          address: data.restaurant.address || "",
          fssai: data.restaurant.fssai || "",
          gstNo: data.restaurant.gstNo || "",
          receiptFooter: data.restaurant.receiptFooter || "Thank You Visit Again",
          taxes: taxes,
          fssaiLabel: data.restaurant.fssaiLabel || "",
          gstLabel: data.restaurant.gstLabel || "",
        };

        setInitialData(settings);
        setRestaurantInfo(settings);

        // Parse operational hours
        const parsedHours = parseOperationalHours(data.restaurant.operationalHours || "");
        setWeekHours(parsedHours);

        // Parse license fields
        const parsedLicenseFields = (data.restaurant.licenseFields || []).map((f: any, idx: number) => ({
          id: `license-${idx}-${Date.now()}`,
          label: f.label || "",
          value: f.value || "",
          order: f.order !== undefined ? f.order : idx
        }));
        setLicenseFields(parsedLicenseFields);

        if (logoUrl) {
          setLogoPreview(logoUrl);
        }
      }
    } catch (error) {
      console.error("❌ Error fetching settings:", error);
      alert(`Failed to load settings: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Fetch first table for theme preview
  const fetchFirstTable = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/tables`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success && data.data && data.data.length > 0) {
        setFirstTableId(data.data[0]._id);
      }
    } catch (error) {
      console.error("Error fetching tables:", error);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchFirstTable();
  }, []);

  // Check if there are any changes
  useEffect(() => {
    const dataChanged = JSON.stringify(initialData) !== JSON.stringify(restaurantInfo);
    const logoChanged = logoFile !== null || removeLogo;
    const hoursChanged = JSON.stringify(parseOperationalHours(initialData.operationalHours)) !== JSON.stringify(weekHours);
    const licenseChanged = licenseFields.length > 0;
    // dataChanged covers allowOrdering change since it's in restaurantInfo
    setHasChanges(dataChanged || logoChanged || hoursChanged || licenseChanged);
  }, [restaurantInfo, initialData, logoFile, removeLogo, weekHours, licenseFields]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setRestaurantInfo({
      ...restaurantInfo,
      [e.target.name]: e.target.value,
    });
  };

  const handleCurrencyChange = (value: string) => {
    setRestaurantInfo({
      ...restaurantInfo,
      currency: value,
    });
  };



  // Tax Management
  const handleAddTax = () => {
    if (!newTaxName || !newTaxRate) return;

    const rate = parseFloat(newTaxRate);
    if (isNaN(rate) || rate < 0) {
      alert("Please enter a valid tax rate");
      return;
    }

    setRestaurantInfo({
      ...restaurantInfo,
      taxes: [...restaurantInfo.taxes, { name: newTaxName, rate }]
    });

    setNewTaxName("");
    setNewTaxRate("");
  };

  const handleRemoveTax = (index: number) => {
    const newTaxes = [...restaurantInfo.taxes];
    newTaxes.splice(index, 1);
    setRestaurantInfo({
      ...restaurantInfo,
      taxes: newTaxes
    });
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please upload a valid image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Logo size should be less than 5MB');
        return;
      }

      setLogoFile(file);
      setRemoveLogo(false);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    setRemoveLogo(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      const token = localStorage.getItem("token");

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('restaurantName', restaurantInfo.restaurantName);
      formData.append('name', restaurantInfo.name);
      formData.append('currency', restaurantInfo.currency);
      formData.append('googleMapsUrl', restaurantInfo.googleMapsUrl);
      formData.append('operationalHours', formatOperationalHours(weekHours));
      formData.append('address', restaurantInfo.address);
      formData.append('fssai', restaurantInfo.fssai);
      formData.append('gstNo', restaurantInfo.gstNo);
      formData.append('receiptFooter', restaurantInfo.receiptFooter);
      formData.append('fssaiLabel', restaurantInfo.fssaiLabel);
      formData.append('gstLabel', restaurantInfo.gstLabel);

      // Send taxes as JSON string
      formData.append('taxes', JSON.stringify(restaurantInfo.taxes));

      // Send license fields as JSON string
      const licenseFieldsToSave = licenseFields.map(f => ({
        label: f.label,
        value: f.value,
        order: f.order
      }));
      formData.append('licenseFields', JSON.stringify(licenseFieldsToSave));

      if (logoFile) {
        formData.append('logo', logoFile);
      }

      if (removeLogo) {
        formData.append('removeLogo', 'true');
      }

      const response = await fetch(
        `${API_BASE_URL}/api/restaurant/update`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to update");

      setSaveSuccess(true);

      // Reset states
      setLogoFile(null);
      setRemoveLogo(false);

      // Reload settings after successful save
      setTimeout(async () => {
        await fetchSettings();
        setSaveSuccess(false);
      }, 1500);

    } catch (error) {
      console.error(error);
      alert("Something went wrong.");
    } finally {
      setSaving(false);
    }
  };



  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 pb-24">
      {/* Header with Title and Save Button */}
      <div className="flex items-center justify-between sticky top-0 bg-background z-10 py-4 -mt-4 -mx-6 px-6 border-b">
        <h2 className="text-2xl font-bold text-foreground">
          Restaurant Settings
        </h2>
        <HeroButton
          onClick={handleSave}
          disabled={saving || saveSuccess || !hasChanges}
        >
          {saving ? (
            "Saving..."
          ) : saveSuccess ? (
            <>
              <Check className="h-4 w-4 mr-2" />
              Saved!
            </>
          ) : (
            "Save Changes"
          )}
        </HeroButton>
      </div>

      {/* Success Message */}
      {saveSuccess && (
        <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg p-4">
          <p className="text-sm text-green-900 dark:text-green-100 font-medium">
            ✅ Settings saved successfully! Reloading...
          </p>
        </div>
      )}

      {/* Basic Information Card */}
      <Card className="card-glass border-0">
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="text-foreground">Restaurant Name</Label>
              <Input
                name="restaurantName"
                value={restaurantInfo.restaurantName}
                onChange={handleChange}
                className="mt-1"
                placeholder="Enter restaurant name"
              />
            </div>
            <div>
              <Label className="text-foreground">Owner Name</Label>
              <Input
                name="name"
                value={restaurantInfo.name}
                onChange={handleChange}
                className="mt-1"
                placeholder="Enter owner name"
              />
            </div>
          </div>



          {/* Logo Upload Section */}
          <div>
            <Label className="text-foreground mb-2 block">Restaurant Logo</Label>

            {!logoPreview ? (
              <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
                <input
                  type="file"
                  id="logo-upload"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                />
                <label htmlFor="logo-upload" className="cursor-pointer">
                  <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground mb-1">
                    Click to upload logo
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG up to 5MB
                  </p>
                </label>
              </div>
            ) : (
              <div className="relative border-2 border-muted rounded-lg p-4 flex items-center gap-4">
                <img
                  src={logoPreview}
                  alt="Logo preview"
                  className="w-24 h-24 object-cover rounded-lg border-2 border-border"
                />
                <div className="flex-1">
                  <p className="font-semibold text-sm mb-1">Current Logo</p>
                  <p className="text-xs text-muted-foreground">
                    Your restaurant logo will appear in the customer menu and dashboard
                  </p>
                </div>
                <div className="flex gap-2">
                  <label htmlFor="logo-upload">
                    <Button variant="outline" size="sm" type="button" asChild>
                      <span className="cursor-pointer">
                        <ImageIcon className="h-4 w-4 mr-1" />
                        Change
                      </span>
                    </Button>
                  </label>
                  <input
                    type="file"
                    id="logo-upload"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleRemoveLogo}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div>
            <Label className="text-foreground">Currency</Label>
            <Select
              value={restaurantInfo.currency}
              onValueChange={handleCurrencyChange}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((currency) => (
                  <SelectItem key={currency.code} value={currency.code}>
                    {currency.symbol} - {currency.name} ({currency.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-foreground">Google Maps URL</Label>
            <Input
              name="googleMapsUrl"
              value={restaurantInfo.googleMapsUrl}
              onChange={handleChange}
              className="mt-1"
              placeholder="https://maps.google.com/..."
              type="url"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Paste your Google Maps share link here
            </p>
          </div>

          <div>
            <Label className="text-foreground text-lg mb-3 block">Operational Hours</Label>
            <p className="text-sm text-muted-foreground mb-4">
              Set your restaurant's operating hours for each day of the week
            </p>
            <div className="space-y-3">
              {weekHours.map((dayHour, index) => (
                <div
                  key={dayHour.day}
                  className="flex items-center gap-4 p-3 border rounded-lg bg-muted/20"
                >
                  <div className="flex items-center gap-2 w-32">
                    <Checkbox
                      id={`open-${dayHour.day}`}
                      checked={dayHour.isOpen}
                      onCheckedChange={(checked) => {
                        const newHours = [...weekHours];
                        newHours[index].isOpen = checked as boolean;
                        setWeekHours(newHours);
                      }}
                    />
                    <Label
                      htmlFor={`open-${dayHour.day}`}
                      className="font-medium cursor-pointer"
                    >
                      {dayHour.day}
                    </Label>
                  </div>

                  {dayHour.isOpen ? (
                    <>
                      <div className="flex items-center gap-2">
                        <Label className="text-sm text-muted-foreground w-12">
                          From
                        </Label>
                        <Select
                          value={dayHour.openTime}
                          onValueChange={(value) => {
                            const newHours = [...weekHours];
                            newHours[index].openTime = value;
                            setWeekHours(newHours);
                          }}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 24 }, (_, i) => {
                              const hour = i.toString().padStart(2, '0');
                              return [
                                <SelectItem key={`${hour}:00`} value={`${hour}:00`}>
                                  {i === 0 ? '12:00 AM' : i < 12 ? `${i}:00 AM` : i === 12 ? '12:00 PM' : `${i - 12}:00 PM`}
                                </SelectItem>,
                                <SelectItem key={`${hour}:30`} value={`${hour}:30`}>
                                  {i === 0 ? '12:30 AM' : i < 12 ? `${i}:30 AM` : i === 12 ? '12:30 PM' : `${i - 12}:30 PM`}
                                </SelectItem>
                              ];
                            }).flat()}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center gap-2">
                        <Label className="text-sm text-muted-foreground w-12">
                          To
                        </Label>
                        <Select
                          value={dayHour.closeTime}
                          onValueChange={(value) => {
                            const newHours = [...weekHours];
                            newHours[index].closeTime = value;
                            setWeekHours(newHours);
                          }}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 24 }, (_, i) => {
                              const hour = i.toString().padStart(2, '0');
                              return [
                                <SelectItem key={`${hour}:00`} value={`${hour}:00`}>
                                  {i === 0 ? '12:00 AM' : i < 12 ? `${i}:00 AM` : i === 12 ? '12:00 PM' : `${i - 12}:00 PM`}
                                </SelectItem>,
                                <SelectItem key={`${hour}:30`} value={`${hour}:30`}>
                                  {i === 0 ? '12:30 AM' : i < 12 ? `${i}:30 AM` : i === 12 ? '12:30 PM' : `${i - 12}:30 PM`}
                                </SelectItem>
                              ];
                            }).flat()}
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 text-sm text-muted-foreground italic">
                      Closed
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-foreground">Full Address (Branch)</Label>
            <Textarea
              name="address"
              value={restaurantInfo.address}
              onChange={handleChange}
              className="mt-1"
              placeholder="Flat No, Building, Street, City, State, Zip"
              rows={3}
            />
          </div>

          {/* License & Registration Numbers Section */}
          <div className="space-y-4 border-t pt-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-1">License & Registration Numbers</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Add your business license and registration numbers. These will appear as static information on receipts.
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-3">
              <p className="text-xs text-blue-700 dark:text-blue-300">
                💡 Add as many fields as needed for your country (e.g., "FSSAI Number" for India, "Business License" for Canada, "Health Permit" for USA)
              </p>
            </div>

            {/* Dynamic License Fields List */}
            <div className="space-y-3">
              {licenseFields.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-3">No license fields added yet</p>
                  <Button onClick={addLicenseField} variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First License Field
                  </Button>
                </div>
              ) : (
                <>
                  {licenseFields.map((field, index) => (
                    <div
                      key={field.id}
                      className="border-2 border-muted rounded-lg p-4 space-y-3 bg-muted/10 relative"
                    >
                      {/* Field Header with Reorder Controls */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-primary"></div>
                          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            License Field {index + 1}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          {/* Move Up */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => moveLicenseField(field.id, 'up')}
                            disabled={index === 0}
                            className="h-7 w-7 p-0"
                            title="Move up"
                          >
                            <ArrowUp className="h-3.5 w-3.5" />
                          </Button>
                          {/* Move Down */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => moveLicenseField(field.id, 'down')}
                            disabled={index === licenseFields.length - 1}
                            className="h-7 w-7 p-0"
                            title="Move down"
                          >
                            <ArrowDown className="h-3.5 w-3.5" />
                          </Button>
                          {/* Delete */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeLicenseField(field.id)}
                            className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                            title="Remove field"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>

                      {/* Field Inputs */}
                      <div className="grid md:grid-cols-2 gap-3">
                        <div>
                          <Label className="text-foreground text-sm font-medium">Label Name</Label>
                          <Input
                            value={field.label}
                            onChange={(e) => updateLicenseField(field.id, 'label', e.target.value)}
                            className="mt-1.5"
                            placeholder="e.g., FSSAI Number, Health License"
                          />
                        </div>
                        <div>
                          <Label className="text-foreground text-sm font-medium">Registration Number</Label>
                          <Input
                            value={field.value}
                            onChange={(e) => updateLicenseField(field.id, 'value', e.target.value)}
                            className="mt-1.5"
                            placeholder="Enter your license number..."
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Add More Button */}
                  <Button onClick={addLicenseField} variant="outline" className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Another License Field
                  </Button>
                </>
              )}
            </div>
          </div>

          <div>
            <Label className="text-foreground">Receipt Footer Message</Label>
            <Input
              name="receiptFooter"
              value={restaurantInfo.receiptFooter}
              onChange={handleChange}
              className="mt-1"
              placeholder="Thank You Visit Again"
            />
          </div>

          {/* Tax Configuration Section */}
          <div className="border-t pt-6 mt-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-foreground mb-1">Tax Configuration</h3>
              <p className="text-sm text-muted-foreground">
                Configure taxes that are <strong>automatically calculated and added to bills</strong> (e.g., VAT 20%, SGST 9%, Service Charge 10%).
              </p>
              <p className="text-xs text-muted-foreground mt-1 italic">
                Note: This is different from license numbers above - these are percentages applied to order totals.
              </p>
            </div>

            {/* List of current taxes */}
            <div className="space-y-2 mb-4">
              {restaurantInfo.taxes.length === 0 ? (
                <p className="text-sm italic text-muted-foreground text-center py-2 border border-dashed rounded-md">
                  No taxes configured
                </p>
              ) : (
                restaurantInfo.taxes.map((tax, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border">
                    <div>
                      <span className="font-semibold mr-2">{tax.name}</span>
                      <Badge variant="outline">{tax.rate}%</Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveTax(index)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>

            {/* Add New Tax Form */}
            <div className="grid grid-cols-[1fr,100px,auto] gap-2 items-end">
              <div>
                <Label className="text-xs text-muted-foreground">Tax Name</Label>
                <Input
                  placeholder="e.g. VAT"
                  value={newTaxName}
                  onChange={(e) => setNewTaxName(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Rate (%)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  min="0"
                  max="100"
                  step="0.01"
                  value={newTaxRate}
                  onChange={(e) => setNewTaxRate(e.target.value)}
                />
              </div>
              <Button
                type="button"
                onClick={handleAddTax}
                disabled={!newTaxName || !newTaxRate}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>


    </div>
  );
};

export default SettingsPage;