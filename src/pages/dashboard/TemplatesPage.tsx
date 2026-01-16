import { useState, useEffect } from "react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { HeroButton } from "@/components/ui/button-variants";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Palette, Sparkles, Circle, Check } from "lucide-react";
import { API_BASE_URL } from "@/config";

const TemplatesPage = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [firstTableId, setFirstTableId] = useState<string | null>(null);

    const [initialData, setInitialData] = useState({
        templateStyle: "classic",
        allowOrdering: true,
    });

    const [restaurantInfo, setRestaurantInfo] = useState({
        templateStyle: "classic",
        allowOrdering: true,
    });

    const [hasChanges, setHasChanges] = useState(false);

    // Fetch current restaurant settings
    const fetchSettings = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${API_BASE_URL}/api/restaurant/current`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const text = await response.text();
            if (!response.ok) throw new Error(`Failed to fetch settings: ${response.status} - ${text}`);

            const data = JSON.parse(text);
            if (data.success) {
                const settings = {
                    templateStyle: data.restaurant.templateStyle || "classic",
                    allowOrdering: data.restaurant.allowOrdering !== false,
                };

                setInitialData(settings);
                setRestaurantInfo(settings);
            }
        } catch (error) {
            console.error("❌ Error fetching settings:", error);
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
        setHasChanges(dataChanged);
    }, [restaurantInfo, initialData]);

    const handleTemplateChange = (templateId: string) => {
        setRestaurantInfo({
            ...restaurantInfo,
            templateStyle: templateId,
        });
    };

    const handleSave = async () => {
        setSaving(true);
        setSaveSuccess(false);
        try {
            const token = localStorage.getItem("token");
            const formData = new FormData();
            formData.append('templateStyle', restaurantInfo.templateStyle);
            formData.append('allowOrdering', String(restaurantInfo.allowOrdering));

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

    const templates = [
        {
            id: "classic",
            name: "Classic",
            description: "Traditional card-based layout with full images",
            icon: <Palette className="h-6 w-6" />,
            preview: "Rich visuals, detailed cards, comprehensive filters",
        },
        {
            id: "modern",
            name: "Modern",
            description: "Contemporary design with gradients and smooth animations",
            icon: <Sparkles className="h-6 w-6" />,
            preview: "Sleek interface, gradient accents, floating elements",
        },
        {
            id: "minimal",
            name: "Minimal",
            description: "Clean and simple with focus on content",
            icon: <Circle className="h-6 w-6" />,
            preview: "Stripped down, text-focused, maximum clarity",
        },
        {
            id: "TemplateBurgerBooch",
            name: "Booch",
            description: "Clean and simple with focus on content",
            icon: <Circle className="h-6 w-6" />,
            preview: "Stripped down, text-focused, maximum clarity",
        },
    ];

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
                    Templates & Ordering
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

            {/* Ordering Configuration Card */}
            <Card className="card-glass border-0">
                <CardHeader>
                    <CardTitle>Ordering Configuration</CardTitle>
                    <CardDescription>
                        Manage how customers interact with your digital menu
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2 border p-4 rounded-lg bg-muted/20">
                        <Checkbox
                            id="allowOrdering"
                            checked={restaurantInfo.allowOrdering}
                            onCheckedChange={(checked) => {
                                setRestaurantInfo({
                                    ...restaurantInfo,
                                    allowOrdering: checked as boolean
                                });
                            }}
                        />
                        <div className="grid gap-1 leading-none">
                            <Label
                                htmlFor="allowOrdering"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                                Accept Customer Orders
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                When disabled, customers can view the menu but cannot place orders. (View-Only Mode)
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Template Selection Card */}
            <Card className="card-glass border-0">
                <CardHeader>
                    <CardTitle>Customer Ordering Page Theme</CardTitle>
                    <CardDescription>
                        Choose how your menu appears to customers
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-3">
                        {templates.map((template) => (
                            <button
                                key={template.id}
                                onClick={() => handleTemplateChange(template.id)}
                                className={`relative p-4 border-2 rounded-lg text-left transition-all hover:shadow-md ${restaurantInfo.templateStyle === template.id
                                    ? "border-primary bg-primary/5 shadow-md"
                                    : "border-border hover:border-primary/50"
                                    }`}
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div
                                        className={`p-2 rounded-lg ${restaurantInfo.templateStyle === template.id
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-secondary"
                                            }`}
                                    >
                                        {template.icon}
                                    </div>
                                    {restaurantInfo.templateStyle === template.id && (
                                        <Badge className="bg-primary">Selected</Badge>
                                    )}
                                </div>

                                <h3 className="font-bold text-lg mb-1">{template.name}</h3>
                                <p className="text-sm text-muted-foreground mb-3">
                                    {template.description}
                                </p>
                                <p className="text-xs text-muted-foreground italic">
                                    {template.preview}
                                </p>
                            </button>
                        ))}
                    </div>

                    {/* View Theme Button */}
                    {firstTableId ? (
                        <a
                            href={`/order/${firstTableId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block"
                        >
                            <HeroButton className="w-full" size="lg">
                                <Palette className="h-4 w-4 mr-2" />
                                View Your Theme
                            </HeroButton>
                        </a>
                    ) : (
                        <div className="bg-muted/50 border border-dashed rounded-lg p-4 text-center">
                            <p className="text-sm text-muted-foreground">
                                Create a table first to preview your theme
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default TemplatesPage;
