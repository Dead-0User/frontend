import { useState, useEffect, useCallback } from "react";
import { useCurrency } from "../../contexts/CurrencyContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HeroButton, GlassButton } from "@/components/ui/button-variants";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Edit, Trash2, Eye, EyeOff, Upload, Image as ImageIcon, Loader2, X, GripVertical, Check } from "lucide-react";

import { API_BASE_URL } from "@/config";
const API_URL = API_BASE_URL;

const sectionSchema = z.object({
  name: z.string().min(1, "Category name is required").max(50, "Category name must be less than 50 characters"),
});

const menuItemSchema = z.object({
  name: z.string().min(1, "Item name is required").max(100, "Item name must be less than 100 characters"),
  description: z.string().min(1, "Description is required").max(500, "Description must be less than 500 characters"),
  price: z.string().min(1, "Price is required").regex(/^\d+\.?\d{0,2}$/, "Invalid price format"),
  sectionId: z.string().min(1, "Please select a Category"),
  isVeg: z.boolean(),
});

const MenuManagementPage = () => {
  const { toast } = useToast();
  const { currency } = useCurrency();

  // Get appropriate token from localStorage (owner token or staff token)
  const getAuthHeader = () => {
    // Check for staff token first (manager access)
    const staffToken = localStorage.getItem("staffToken");
    if (staffToken) {
      console.log("Using staff token for authentication");
      return { Authorization: `Bearer ${staffToken}` };
    }
    // Fallback to owner token
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("No authentication token found in localStorage");
      return { Authorization: "" };
    }
    console.log("Using owner token for authentication");
    return { Authorization: `Bearer ${token}` };
  };

  // Get token for use in the component (for backward compatibility)
  const getToken = () => {
    const staffToken = localStorage.getItem("staffToken");
    if (staffToken) return staffToken;
    return localStorage.getItem("token");
  };

  const token = getToken();
  const [menuSections, setMenuSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState(null);
  const [editingSection, setEditingSection] = useState(null);
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [isSectionDialogOpen, setIsSectionDialogOpen] = useState(false);

  const [draggedSection, setDraggedSection] = useState(null);
  const [draggedItem, setDraggedItem] = useState(null);
  const [draggedItemSection, setDraggedItemSection] = useState(null);

  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Addon state
  const [addonGroups, setAddonGroups] = useState([]);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [newGroupTitle, setNewGroupTitle] = useState("");
  const [newGroupMultiSelect, setNewGroupMultiSelect] = useState(false);
  const [newGroupAddons, setNewGroupAddons] = useState([]);
  const [tempAddonName, setTempAddonName] = useState("");
  const [tempAddonPrice, setTempAddonPrice] = useState("");

  // Edit group states
  const [editingGroupIndex, setEditingGroupIndex] = useState(null);
  const [editingGroupTitle, setEditingGroupTitle] = useState("");
  const [editingGroupMultiSelect, setEditingGroupMultiSelect] = useState(false);
  const [editingGroupAddons, setEditingGroupAddons] = useState([]);
  const [editingAddonIndex, setEditingAddonIndex] = useState(null);
  const [editingAddonName, setEditingAddonName] = useState("");
  const [editingAddonPrice, setEditingAddonPrice] = useState("");

  const [sectionToDelete, setSectionToDelete] = useState(null);
  const [isDeleteSectionDialogOpen, setIsDeleteSectionDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isDeleteItemDialogOpen, setIsDeleteItemDialogOpen] = useState(false);

  const sectionForm = useForm({
    resolver: zodResolver(sectionSchema),
    defaultValues: { name: "" }
  });

  const itemForm = useForm({
    resolver: zodResolver(menuItemSchema),
    defaultValues: {
      name: "",
      description: "",
      price: "",
      sectionId: "",
      isVeg: false,
    }
  });

  // Start creating a new addon group
  const handleStartNewGroup = () => {
    setIsCreatingGroup(true);
    setNewGroupTitle("");
    setNewGroupMultiSelect(false);
    setNewGroupAddons([]);
    setTempAddonName("");
    setTempAddonPrice("");
  };

  // Add addon to the group being created
  const handleAddAddonToNewGroup = () => {
    if (!tempAddonName.trim()) {
      toast({
        title: "Error",
        description: "Addon name is required",
        variant: "destructive"
      });
      return;
    }

    const price = parseFloat(tempAddonPrice) || 0;
    if (price < 0) {
      toast({
        title: "Error",
        description: "Addon price cannot be negative",
        variant: "destructive"
      });
      return;
    }

    setNewGroupAddons([...newGroupAddons, {
      name: tempAddonName.trim(),
      price
    }]);

    setTempAddonName("");
    setTempAddonPrice("");
  };

  // Save the new group
  const handleSaveNewGroup = () => {
    const finalTitle = newGroupTitle.trim() || "Add-ons";

    if (newGroupAddons.length === 0) {
      toast({
        title: "Error",
        description: "Add at least one addon to the group",
        variant: "destructive"
      });
      return;
    }

    setAddonGroups([...addonGroups, {
      title: finalTitle,
      multiSelect: newGroupMultiSelect,
      items: newGroupAddons
    }]);

    setIsCreatingGroup(false);
    setNewGroupTitle("");
    setNewGroupMultiSelect(false);
    setNewGroupAddons([]);
    setTempAddonName("");
    setTempAddonPrice("");

    toast({
      title: "Success",
      description: "Addon group created successfully"
    });
  };

  // Cancel creating group
  const handleCancelNewGroup = () => {
    setIsCreatingGroup(false);
    setNewGroupTitle("");
    setNewGroupMultiSelect(false);
    setNewGroupAddons([]);
    setTempAddonName("");
    setTempAddonPrice("");
  };

  // Remove addon from new group being created
  const handleRemoveAddonFromNewGroup = (index) => {
    setNewGroupAddons(newGroupAddons.filter((_, i) => i !== index));
  };

  // Remove entire group
  const handleRemoveGroup = (index) => {
    setAddonGroups(addonGroups.filter((_, i) => i !== index));
  };

  // Start editing an existing group
  const handleStartEditGroup = (groupIndex) => {
    const group = addonGroups[groupIndex];
    setEditingGroupIndex(groupIndex);
    setEditingGroupTitle(group.title);
    setEditingGroupMultiSelect(group.multiSelect);
    setEditingGroupAddons([...group.items]);
    setIsCreatingGroup(false);
  };

  // Save edited group
  const handleSaveEditedGroup = () => {
    if (editingGroupAddons.length === 0) {
      toast({
        title: "Error",
        description: "Add at least one addon to the group",
        variant: "destructive"
      });
      return;
    }

    const updatedGroups = addonGroups.map((group, index) =>
      index === editingGroupIndex
        ? {
          title: editingGroupTitle.trim() || "Add-ons",
          multiSelect: editingGroupMultiSelect,
          items: editingGroupAddons
        }
        : group
    );

    setAddonGroups(updatedGroups);
    handleCancelEditGroup();

    toast({
      title: "Success",
      description: "Addon group updated successfully"
    });
  };

  // Cancel editing group
  const handleCancelEditGroup = () => {
    setEditingGroupIndex(null);
    setEditingGroupTitle("");
    setEditingGroupMultiSelect(false);
    setEditingGroupAddons([]);
    setEditingAddonIndex(null);
    setEditingAddonName("");
    setEditingAddonPrice("");
  };

  // Start editing a specific addon within the editing group
  const handleStartEditAddon = (addonIndex) => {
    const addon = editingGroupAddons[addonIndex];
    setEditingAddonIndex(addonIndex);
    setEditingAddonName(addon.name);
    setEditingAddonPrice(addon.price.toString());
  };

  // Save edited addon
  const handleSaveEditedAddon = () => {
    if (!editingAddonName.trim()) {
      toast({
        title: "Error",
        description: "Addon name is required",
        variant: "destructive"
      });
      return;
    }

    const price = parseFloat(editingAddonPrice) || 0;
    if (price < 0) {
      toast({
        title: "Error",
        description: "Addon price cannot be negative",
        variant: "destructive"
      });
      return;
    }

    const updatedAddons = editingGroupAddons.map((addon, index) =>
      index === editingAddonIndex
        ? { name: editingAddonName.trim(), price }
        : addon
    );

    setEditingGroupAddons(updatedAddons);
    setEditingAddonIndex(null);
    setEditingAddonName("");
    setEditingAddonPrice("");
  };

  // Cancel editing addon
  const handleCancelEditAddon = () => {
    setEditingAddonIndex(null);
    setEditingAddonName("");
    setEditingAddonPrice("");
  };

  // Remove addon from editing group
  const handleRemoveAddonFromEditGroup = (index) => {
    setEditingGroupAddons(editingGroupAddons.filter((_, i) => i !== index));
  };

  // Add new addon to editing group
  const handleAddAddonToEditGroup = () => {
    if (!tempAddonName.trim()) {
      toast({
        title: "Error",
        description: "Addon name is required",
        variant: "destructive"
      });
      return;
    }

    const price = parseFloat(tempAddonPrice) || 0;
    if (price < 0) {
      toast({
        title: "Error",
        description: "Addon price cannot be negative",
        variant: "destructive"
      });
      return;
    }

    setEditingGroupAddons([...editingGroupAddons, {
      name: tempAddonName.trim(),
      price
    }]);

    setTempAddonName("");
    setTempAddonPrice("");
  };

  // Section Drag & Drop
  const handleSectionDragStart = (e, section) => {
    setDraggedSection(section);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleSectionDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleSectionDrop = async (e, targetSection) => {
    e.preventDefault();

    if (!draggedSection || draggedSection.id === targetSection.id) {
      setDraggedSection(null);
      return;
    }

    const newSections = [...menuSections];
    const draggedIndex = newSections.findIndex(s => s.id === draggedSection.id);
    const targetIndex = newSections.findIndex(s => s.id === targetSection.id);

    const [removed] = newSections.splice(draggedIndex, 1);
    newSections.splice(targetIndex, 0, removed);

    const updatedSections = newSections.map((section, index) => ({
      ...section,
      sequence: index
    }));

    setMenuSections(updatedSections);
    setDraggedSection(null);

    try {
      await fetch(`${API_URL}/api/sections/reorder`, {
        method: "POST",
        headers: {
          ...getAuthHeader(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sections: updatedSections.map(s => ({ id: s._id || s.id, sequence: s.sequence }))
        }),
      });
    } catch (error) {
      console.error("Reorder sections error:", error);
    }
  };

  // Item Drag & Drop
  const handleItemDragStart = (e, item, section) => {
    setDraggedItem(item);
    setDraggedItemSection(section);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleItemDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleItemDrop = async (e, targetItem, targetSection) => {
    e.preventDefault();

    if (!draggedItem || draggedItem.id === targetItem.id) {
      setDraggedItem(null);
      setDraggedItemSection(null);
      return;
    }

    if (draggedItemSection.id !== targetSection.id) {
      toast({
        title: "Info",
        description: "Items can only be reordered within the same category",
        variant: "default"
      });
      setDraggedItem(null);
      setDraggedItemSection(null);
      return;
    }

    const newSections = menuSections.map(section => {
      if (section.id === targetSection.id) {
        const newItems = [...section.items];
        const draggedIndex = newItems.findIndex(i => i.id === draggedItem.id);
        const targetIndex = newItems.findIndex(i => i.id === targetItem.id);

        const [removed] = newItems.splice(draggedIndex, 1);
        newItems.splice(targetIndex, 0, removed);

        return {
          ...section,
          items: newItems.map((item, index) => ({
            ...item,
            sequence: index
          }))
        };
      }
      return section;
    });

    setMenuSections(newSections);
    setDraggedItem(null);
    setDraggedItemSection(null);

    try {
      const section = newSections.find(s => s.id === targetSection.id);
      await fetch(`${API_URL}/api/menuitems/reorder`, {
        method: "POST",
        headers: {
          ...getAuthHeader(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: section.items.map(i => ({ id: i._id || i.id, sequence: i.sequence }))
        }),
      });
    } catch (error) {
      console.error("Reorder items error:", error);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Error",
          description: "Please select an image file",
          variant: "destructive"
        });
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "Image size should be less than 5MB",
          variant: "destructive"
        });
        return;
      }

      setSelectedImage(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const fetchSections = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/sections`, {
        headers: {
          ...getAuthHeader(),
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      if (data.success) {
        return data.data;
      }
      return [];
    } catch (error) {
      console.error("Fetch sections error:", error);
      return [];
    }
  }, [token]);

  const fetchMenuItems = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/menuitems`, {
        headers: {
          ...getAuthHeader(),
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      if (data.success) {
        return data.data;
      }
      return [];
    } catch (error) {
      console.error("Fetch menu items error:", error);
      return [];
    }
  }, [token]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [sections, menuItems] = await Promise.all([
        fetchSections(),
        fetchMenuItems()
      ]);

      const sortedSections = sections.sort((a, b) => (a.sequence || 0) - (b.sequence || 0));

      const sectionsWithItems = sortedSections.map(section => ({
        ...section,
        id: section._id,
        items: menuItems
          .filter(item => {
            const itemSectionId = typeof item.sectionId === 'object' ? item.sectionId._id : item.sectionId;
            return itemSectionId === section._id;
          })
          .map(item => ({
            ...item,
            id: item._id,
            sectionId: typeof item.sectionId === 'object' ? item.sectionId._id : item.sectionId,
            addonGroups: Array.isArray(item.addonGroups) ? item.addonGroups : []
          }))
          .sort((a, b) => (a.sequence || 0) - (b.sequence || 0))
      }));

      setMenuSections(sectionsWithItems);
    } catch (error) {
      console.error('Load data error:', error);
    } finally {
      setLoading(false);
    }
  }, [fetchSections, fetchMenuItems]);

  const handleAddSection = async (data) => {
    try {
      const response = await fetch(`${API_URL}/api/sections`, {
        method: "POST",
        headers: {
          ...getAuthHeader(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          sequence: menuSections.length
        }),
      });

      const result = await response.json();
      if (result.success) {
        const newSection = {
          ...result.data,
          id: result.data._id,
          items: [],
          sequence: menuSections.length
        };
        setMenuSections([...menuSections, newSection]);
        sectionForm.reset();
        setIsSectionDialogOpen(false);
        toast({
          title: "Success",
          description: `${data.name} section has been added successfully.`
        });
      }
    } catch (error) {
      console.error("Add section error:", error);
    }
  };

  const handleEditSection = (section) => {
    setEditingSection(section);
    sectionForm.setValue("name", section.name);
    setIsSectionDialogOpen(true);
  };

  const handleUpdateSection = async (data) => {
    if (editingSection) {
      try {
        const response = await fetch(`${API_URL}/api/sections/${editingSection._id || editingSection.id}`, {
          method: "PUT",
          headers: {
            ...getAuthHeader(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        const result = await response.json();
        if (result.success) {
          setMenuSections(menuSections.map(section =>
            section.id === editingSection.id
              ? { ...section, name: data.name }
              : section
          ));
          sectionForm.reset();
          setEditingSection(null);
          setIsSectionDialogOpen(false);
          toast({
            title: "Success",
            description: `${data.name} section has been updated successfully.`
          });
        }
      } catch (error) {
        console.error("Update section error:", error);
      }
    }
  };

  const handleDeleteSection = async () => {
    if (!sectionToDelete) return;
    try {
      const response = await fetch(`${API_URL}/api/sections/${sectionToDelete._id || sectionToDelete.id}`, {
        method: "DELETE",
        headers: {
          ...getAuthHeader(),
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();
      if (result.success) {
        setMenuSections(menuSections.filter(section => section.id !== (sectionToDelete._id || sectionToDelete.id)));
        setIsDeleteSectionDialogOpen(false);
        setSectionToDelete(null);
        toast({
          title: "Success",
          description: "Section has been deleted successfully."
        });
      }
    } catch (error) {
      console.error("Delete section error:", error);
    }
  };

  const handleAddItem = async (data) => {
    try {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('description', data.description);
      formData.append('price', data.price);
      formData.append('sectionId', data.sectionId);
      formData.append('isVeg', data.isVeg.toString());
      formData.append('addonGroups', JSON.stringify(addonGroups));

      if (selectedImage) {
        formData.append('image', selectedImage);
      }

      const response = await fetch(`${API_URL}/api/menuitems`, {
        method: "POST",
        headers: {
          ...getAuthHeader(),
        },
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        const newItem = {
          ...result.data,
          id: result.data._id,
          sectionId: data.sectionId,
          addonGroups: addonGroups,
          sequence: result.data.sequence || 0
        };

        setMenuSections(menuSections.map(section =>
          section.id === data.sectionId
            ? { ...section, items: [...section.items, newItem] }
            : section
        ));

        itemForm.reset();
        setAddonGroups([]);
        setSelectedImage(null);
        setImagePreview(null);
        setIsItemDialogOpen(false);
        toast({
          title: "Success",
          description: `${data.name} has been added successfully.`
        });
      }
    } catch (error) {
      console.error("Add menu item error:", error);
    }
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    itemForm.setValue("name", item.name);
    itemForm.setValue("description", item.description);
    itemForm.setValue("price", item.price.toString());
    itemForm.setValue("sectionId", item.sectionId);
    itemForm.setValue("isVeg", item.isVeg);
    setAddonGroups(Array.isArray(item.addonGroups) ? item.addonGroups : []);

    if (item.image) {
      setImagePreview(`${API_URL}${item.image}`);
    }

    setIsItemDialogOpen(true);
  };

  const handleUpdateItem = async (data) => {
    if (editingItem) {
      try {
        const formData = new FormData();
        formData.append('name', data.name);
        formData.append('description', data.description);
        formData.append('price', data.price);
        formData.append('sectionId', data.sectionId);
        formData.append('isVeg', data.isVeg.toString());
        formData.append('addonGroups', JSON.stringify(addonGroups));

        if (selectedImage) {
          formData.append('image', selectedImage);
        }

        const response = await fetch(`${API_URL}/api/menuitems/${editingItem._id || editingItem.id}`, {
          method: "PUT",
          headers: {
            ...getAuthHeader(),
          },
          body: formData,
        });

        const result = await response.json();

        if (result.success) {
          const updatedItem = {
            ...result.data,
            id: result.data._id || editingItem.id,
            sectionId: data.sectionId,
            addonGroups: addonGroups
          };

          setMenuSections(menuSections.map(section => ({
            ...section,
            items: section.items.map(item =>
              item.id === editingItem.id ? updatedItem : item
            )
          })));

          itemForm.reset();
          setAddonGroups([]);
          setSelectedImage(null);
          setImagePreview(null);
          setEditingItem(null);
          setIsItemDialogOpen(false);
          toast({
            title: "Success",
            description: `${data.name} has been updated successfully.`
          });
        }
      } catch (error) {
        console.error("Update menu item error:", error);
      }
    }
  };

  const handleDeleteItem = async () => {
    if (!itemToDelete) return;
    try {
      const response = await fetch(`${API_URL}/api/menuitems/${itemToDelete._id || itemToDelete.id}`, {
        method: "DELETE",
        headers: {
          ...getAuthHeader(),
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();
      if (result.success) {
        setMenuSections(menuSections.map(section => ({
          ...section,
          items: section.items.filter(item => item.id !== (itemToDelete._id || itemToDelete.id))
        })));
        setIsDeleteItemDialogOpen(false);
        setItemToDelete(null);
        toast({
          title: "Success",
          description: "Menu item has been deleted successfully."
        });
      }
    } catch (error) {
      console.error("Delete menu item error:", error);
    }
  };

  const toggleItemActive = async (itemId) => {
    try {
      const item = menuSections
        .flatMap(section => section.items)
        .find(item => item.id === itemId);

      if (item) {
        const response = await fetch(`${API_URL}/api/menuitems/${itemId}`, {
          method: "PUT",
          headers: {
            ...getAuthHeader(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...item,
            isActive: !item.isActive
          }),
        });

        const result = await response.json();
        if (result.success) {
          setMenuSections(menuSections.map(section => ({
            ...section,
            items: section.items.map(item =>
              item.id === itemId ? { ...item, isActive: !item.isActive } : item
            )
          })));

          toast({
            title: "Success",
            description: `Item ${item.isActive ? 'hidden' : 'shown'} successfully.`
          });
        }
      }
    } catch (error) {
      console.error("Toggle item active error:", error);
    }
  };

  useEffect(() => {
    if (token) {
      loadData();
    }
  }, [token, loadData]);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-lg">Loading menu data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground">Menu Management</h2>
        <div className="flex space-x-2 w-full sm:w-auto">
          <Dialog open={isSectionDialogOpen} onOpenChange={setIsSectionDialogOpen}>
            <DialogTrigger asChild>
              <GlassButton onClick={() => { setEditingSection(null); sectionForm.reset(); }} className="w-full sm:w-auto justify-center">
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </GlassButton>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingSection ? "Edit Category" : "Add New Category"}</DialogTitle>
              </DialogHeader>
              <Form {...sectionForm}>
                <form onSubmit={sectionForm.handleSubmit(editingSection ? handleUpdateSection : handleAddSection)} className="space-y-4">
                  <FormField
                    control={sectionForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter category name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsSectionDialogOpen(false)}>
                      Cancel
                    </Button>
                    <HeroButton type="submit">
                      {editingSection ? "Update" : "Add"} Category
                    </HeroButton>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Dialog
        open={isDeleteSectionDialogOpen}
        onOpenChange={(open) => {
          setIsDeleteSectionDialogOpen(open);
          if (!open) {
            setSectionToDelete(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>
              This action will permanently remove {sectionToDelete?.name ?? "this category"} and all associated menu items. Are you sure?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteSectionDialogOpen(false);
                setSectionToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteSection}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isDeleteItemDialogOpen}
        onOpenChange={(open) => {
          setIsDeleteItemDialogOpen(open);
          if (!open) {
            setItemToDelete(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Menu Item</DialogTitle>
            <DialogDescription>
              This action will permanently remove {itemToDelete?.name ?? "this menu item"} from the menu. Are you sure?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteItemDialogOpen(false);
                setItemToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteItem}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="space-y-6">
        {menuSections.length === 0 ? (
          <Card className="card-glass border-0">
            <CardContent className="flex flex-col items-center justify-center py-16 space-y-4">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold text-foreground">No menu sections yet</h3>
                <p className="text-muted-foreground">Get started by creating your first menu category</p>
              </div>
              <GlassButton onClick={() => { setEditingSection(null); sectionForm.reset(); setIsSectionDialogOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Category
              </GlassButton>
            </CardContent>
          </Card>
        ) : (
          menuSections.map((section) => (
            <Card
              key={section.id}
              className="card-glass border-0"
              draggable
              onDragStart={(e) => handleSectionDragStart(e, section)}
              onDragOver={handleSectionDragOver}
              onDrop={(e) => handleSectionDrop(e, section)}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
                    <CardTitle className="text-foreground">{section.name}</CardTitle>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditSection(section)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSectionToDelete(section);
                        setIsDeleteSectionDialogOpen(true);
                      }}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  {section.items.length === 0 ? (
                    <div className="text-center py-8 space-y-2">
                      <p className="text-muted-foreground">No items in this category yet</p>
                    </div>
                  ) : (
                    section.items.map((item) => (
                      <div
                        key={item.id}
                        className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border border-border rounded-lg cursor-move hover:bg-muted/20 transition gap-4 ${!item.isActive ? 'opacity-50' : ''}`}
                        draggable
                        onDragStart={(e) => handleItemDragStart(e, item, section)}
                        onDragOver={handleItemDragOver}
                        onDrop={(e) => handleItemDrop(e, item, section)}
                      >
                        <div className="flex items-start sm:items-center space-x-4 w-full sm:w-auto">
                          <GripVertical className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-2 sm:mt-0" />
                          <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                            {item.image ? (
                              <img
                                src={`${API_URL}${item.image}`}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <ImageIcon className="h-6 w-6 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="font-semibold text-foreground truncate">{item.name}</h4>
                              <div className={`w-3 h-3 rounded-full flex-shrink-0 ${item.isVeg ? 'bg-green-500' : 'bg-red-500'}`}></div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => toggleItemActive(item.id)}
                                className="h-6 w-6 p-0"
                              >
                                {item.isActive ? (
                                  <Eye className="h-4 w-4 text-green-500" />
                                ) : (
                                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                                )}
                              </Button>
                            </div>
                            <p className="text-muted-foreground text-sm line-clamp-2">{item.description}</p>
                            <p className="font-semibold text-primary mt-1">{currency.symbol}{item.price.toFixed(2)}</p>
                            {item.addonGroups && item.addonGroups.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-2">
                                {item.addonGroups.map((group, groupIndex) => (
                                  <div key={groupIndex} className="inline-flex items-center gap-1">
                                    <Badge variant="outline" className="text-xs font-semibold whitespace-nowrap">
                                      {group.title} {group.multiSelect && "✓"}
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-end w-full sm:w-auto space-x-2 ml-0 sm:ml-4 border-t sm:border-t-0 pt-4 sm:pt-0 mt-2 sm:mt-0">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditItem(item)}
                            className="flex-1 sm:flex-none"
                          >
                            <Edit className="h-4 w-4 sm:mr-0" />
                            <span className="sm:hidden ml-2">Edit</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setItemToDelete(item);
                              setIsDeleteItemDialogOpen(true);
                            }}
                            className="flex-1 sm:flex-none text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 sm:mr-0" />
                            <span className="sm:hidden ml-2">Delete</span>
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
                  <DialogTrigger asChild>
                    <HeroButton
                      className="w-full"
                      onClick={() => {
                        setEditingItem(null);
                        itemForm.reset();
                        itemForm.setValue("price", "");
                        setAddonGroups([]);
                        setSelectedImage(null);
                        setImagePreview(null);
                        setIsCreatingGroup(false);
                        setNewGroupTitle("");
                        setNewGroupMultiSelect(false);
                        setNewGroupAddons([]);
                        setTempAddonName("");
                        setTempAddonPrice("");
                        itemForm.setValue("sectionId", section.id);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Menu Item
                    </HeroButton>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{editingItem ? "Edit Menu Item" : "Add New Menu Item"}</DialogTitle>
                    </DialogHeader>
                    <Form {...itemForm}>
                      <form onSubmit={itemForm.handleSubmit(editingItem ? handleUpdateItem : handleAddItem)} className="space-y-4">

                        {/* Image Upload Section */}
                        <div className="space-y-2">
                          <FormLabel>Menu Item Image (Optional)</FormLabel>

                          {imagePreview ? (
                            <div className="relative inline-block w-full">
                              <img
                                src={imagePreview}
                                alt="Preview"
                                className="w-full max-w-xs h-48 object-cover rounded-lg border-2 border-border mx-auto"
                              />
                              <button
                                type="button"
                                onClick={handleRemoveImage}
                                className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-2 hover:bg-destructive/90 transition"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center w-full">
                              <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-border rounded-lg cursor-pointer bg-muted/20 hover:bg-muted/40 transition">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                  <Upload className="w-10 h-10 mb-3 text-muted-foreground" />
                                  <p className="mb-2 text-sm text-muted-foreground">
                                    <span className="font-semibold">Click to upload</span> or drag and drop
                                  </p>
                                  <p className="text-xs text-muted-foreground">PNG, JPG, GIF, WEBP (MAX. 5MB)</p>
                                </div>
                                <input
                                  type="file"
                                  className="hidden"
                                  accept="image/*"
                                  onChange={handleImageChange}
                                />
                              </label>
                            </div>
                          )}
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                          <FormField
                            control={itemForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Item Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter item name" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={itemForm.control}
                            name="price"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Price ({currency.symbol})</FormLabel>
                                <FormControl>
                                  <Input
                                    type="text"
                                    placeholder="0.00"
                                    {...field}
                                    value={field.value}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
                                        field.onChange(value);
                                      }
                                    }}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={itemForm.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Textarea placeholder="Enter item description" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid md:grid-cols-2 gap-4">
                          <FormField
                            control={itemForm.control}
                            name="sectionId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Category</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {menuSections.map((section) => (
                                      <SelectItem key={section.id} value={section.id}>
                                        {section.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={itemForm.control}
                            name="isVeg"
                            render={({ field }) => (
                              <FormItem className="flex items-center space-x-2 pt-6">
                                <FormControl>
                                  <Switch
                                    checked={!field.value}
                                    onCheckedChange={(checked) => field.onChange(!checked)}
                                    className="data-[state=checked]:bg-red-500 data-[state=unchecked]:bg-green-500"
                                  />
                                </FormControl>
                                <FormLabel className="!mt-0">
                                  {!field.value ? "Non-Vegetarian" : "Vegetarian"}
                                </FormLabel>
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Addon Groups Section */}
                        <div className="space-y-4 border-t pt-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <FormLabel className="text-base">Customization Options</FormLabel>
                              <p className="text-sm text-muted-foreground">Add size options, toppings, extras, etc.</p>
                            </div>
                            {!isCreatingGroup && editingGroupIndex === null && (
                              <Button
                                type="button"
                                onClick={handleStartNewGroup}
                                variant="outline"
                                size="sm"
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                New Group
                              </Button>
                            )}
                          </div>

                          {/* Show existing groups */}
                          {addonGroups.length > 0 && (
                            <div className="space-y-3">
                              {addonGroups.map((group, groupIndex) => (
                                <div key={groupIndex}>
                                  {editingGroupIndex === groupIndex ? (
                                    // EDITING MODE
                                    <div className="p-4 border-2 border-primary rounded-lg bg-primary/5 space-y-4">
                                      <div className="space-y-3">
                                        <div>
                                          <label className="text-sm font-medium mb-2 block">
                                            Group Name <span className="text-destructive">*</span>
                                          </label>
                                          <Input
                                            placeholder='Type here: "Size", "Toppings", "Extras", etc.'
                                            value={editingGroupTitle}
                                            onChange={(e) => setEditingGroupTitle(e.target.value)}
                                            className="text-base"
                                          />
                                        </div>

                                        <div className="flex items-center justify-between p-3 bg-background rounded-lg border border-border">
                                          <div>
                                            <p className="text-sm font-medium">Allow multiple selections?</p>
                                            <p className="text-xs text-muted-foreground">Turn on if customers can pick more than one</p>
                                          </div>
                                          <Switch
                                            checked={editingGroupMultiSelect}
                                            onCheckedChange={setEditingGroupMultiSelect}
                                          />
                                        </div>

                                        <div className="space-y-2">
                                          <label className="text-sm font-medium block">
                                            Manage Options <span className="text-destructive">*</span>
                                          </label>

                                          {editingGroupAddons.length > 0 && (
                                            <div className="space-y-2 mb-3">
                                              {editingGroupAddons.map((addon, index) => (
                                                <div key={index}>
                                                  {editingAddonIndex === index ? (
                                                    // EDITING INDIVIDUAL ADDON
                                                    <div className="flex gap-2 p-3 bg-muted rounded-lg border-2 border-primary">
                                                      <Input
                                                        placeholder="Addon name"
                                                        value={editingAddonName}
                                                        onChange={(e) => setEditingAddonName(e.target.value)}
                                                        className="flex-1"
                                                      />
                                                      <Input
                                                        type="text"
                                                        placeholder="Price"
                                                        value={editingAddonPrice}
                                                        onChange={(e) => {
                                                          const value = e.target.value;
                                                          if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
                                                            setEditingAddonPrice(value);
                                                          }
                                                        }}
                                                        className="w-28"
                                                      />
                                                      <Button
                                                        type="button"
                                                        onClick={handleSaveEditedAddon}
                                                        size="icon"
                                                        className="bg-green-600 hover:bg-green-700"
                                                      >
                                                        <Check className="h-4 w-4" />
                                                      </Button>
                                                      <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="icon"
                                                        onClick={handleCancelEditAddon}
                                                      >
                                                        <X className="h-4 w-4" />
                                                      </Button>
                                                    </div>
                                                  ) : (
                                                    // DISPLAYING ADDON WITH EDIT BUTTON
                                                    <div className="flex items-center justify-between p-3 bg-background rounded-lg border border-border">
                                                      <div className="flex items-center gap-2 flex-1">
                                                        <span className="font-medium">{addon.name}</span>
                                                        <span className="text-sm text-muted-foreground">
                                                          {addon.price > 0 ? `+${addon.price.toFixed(2)}` : 'Free'}
                                                        </span>
                                                      </div>
                                                      <div className="flex gap-1">
                                                        <Button
                                                          type="button"
                                                          variant="ghost"
                                                          size="sm"
                                                          onClick={() => handleStartEditAddon(index)}
                                                        >
                                                          <Edit className="h-4 w-4 text-primary" />
                                                        </Button>
                                                        <Button
                                                          type="button"
                                                          variant="ghost"
                                                          size="sm"
                                                          onClick={() => handleRemoveAddonFromEditGroup(index)}
                                                        >
                                                          <X className="h-4 w-4 text-destructive" />
                                                        </Button>
                                                      </div>
                                                    </div>
                                                  )}
                                                </div>
                                              ))}
                                            </div>
                                          )}

                                          {/* Add new addon to editing group */}
                                          <div className="flex gap-2">
                                            <Input
                                              placeholder="Add new option"
                                              value={tempAddonName}
                                              onChange={(e) => setTempAddonName(e.target.value)}
                                              onKeyPress={(e) => {
                                                if (e.key === 'Enter') {
                                                  e.preventDefault();
                                                  handleAddAddonToEditGroup();
                                                }
                                              }}
                                              className="flex-1"
                                            />
                                            <Input
                                              type="text"
                                              placeholder="Price"
                                              value={tempAddonPrice}
                                              onChange={(e) => {
                                                const value = e.target.value;
                                                if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
                                                  setTempAddonPrice(value);
                                                }
                                              }}
                                              onKeyPress={(e) => {
                                                if (e.key === 'Enter') {
                                                  e.preventDefault();
                                                  handleAddAddonToEditGroup();
                                                }
                                              }}
                                              className="w-28"
                                            />
                                            <Button
                                              type="button"
                                              onClick={handleAddAddonToEditGroup}
                                              size="icon"
                                            >
                                              <Plus className="h-4 w-4" />
                                            </Button>
                                          </div>
                                        </div>
                                      </div>

                                      <div className="flex gap-2 pt-2">
                                        <Button
                                          type="button"
                                          variant="outline"
                                          onClick={handleCancelEditGroup}
                                          className="flex-1"
                                        >
                                          Cancel
                                        </Button>
                                        <Button
                                          type="button"
                                          onClick={handleSaveEditedGroup}
                                          className="flex-1"
                                          disabled={editingGroupAddons.length === 0}
                                        >
                                          <Check className="h-4 w-4 mr-1" />
                                          Save Changes
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    // VIEW MODE - Show group with edit/delete buttons
                                    <div className="p-4 border-2 border-primary/20 rounded-lg bg-primary/5">
                                      <div className="flex items-start justify-between mb-3">
                                        <div>
                                          <div className="flex items-center gap-2">
                                            <h4 className="font-semibold text-base">{group.title}</h4>
                                            {group.multiSelect && (
                                              <Badge variant="default" className="text-xs">
                                                Multiple Choice
                                              </Badge>
                                            )}
                                            {!group.multiSelect && (
                                              <Badge variant="secondary" className="text-xs">
                                                Single Choice
                                              </Badge>
                                            )}
                                          </div>
                                          <p className="text-xs text-muted-foreground mt-1">
                                            {group.items.length} option{group.items.length !== 1 ? 's' : ''}
                                          </p>
                                        </div>
                                        <div className="flex gap-1">
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleStartEditGroup(groupIndex)}
                                            className="text-primary hover:text-primary"
                                          >
                                            <Edit className="h-4 w-4" />
                                          </Button>
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleRemoveGroup(groupIndex)}
                                            className="text-destructive hover:text-destructive"
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      </div>
                                      <div className="grid grid-cols-2 gap-2">
                                        {group.items.map((addon, addonIndex) => (
                                          <div key={addonIndex} className="flex items-center justify-between p-2 bg-background rounded border border-border">
                                            <span className="text-sm font-medium">{addon.name}</span>
                                            <span className="text-sm text-muted-foreground">
                                              {addon.price > 0 ? `+${addon.price.toFixed(2)}` : 'Free'}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Creating new group UI */}
                          {isCreatingGroup && (
                            <div className="p-4 border-2 border-dashed border-primary rounded-lg bg-primary/5 space-y-4">
                              <div className="space-y-3">
                                <div>
                                  <label className="text-sm font-medium mb-2 block">
                                    Group Name <span className="text-destructive">*</span>
                                  </label>
                                  <Input
                                    placeholder='Type here: "Size", "Toppings", "Extras", etc.'
                                    value={newGroupTitle}
                                    onChange={(e) => setNewGroupTitle(e.target.value)}
                                    className="text-base placeholder:text-muted-foreground/50 placeholder:italic"
                                  />
                                  <p className="text-xs text-muted-foreground mt-1.5">
                                    💡 This is what customers will see (e.g., "Choose Size", "Select Toppings")
                                  </p>
                                </div>

                                <div className="flex items-center justify-between p-3 bg-background rounded-lg border border-border">
                                  <div>
                                    <p className="text-sm font-medium">Allow multiple selections?</p>
                                    <p className="text-xs text-muted-foreground">Turn on if customers can pick more than one option</p>
                                  </div>
                                  <Switch
                                    checked={newGroupMultiSelect}
                                    onCheckedChange={setNewGroupMultiSelect}
                                  />
                                </div>

                                <div className="space-y-2">
                                  <label className="text-sm font-medium block">
                                    Add Options <span className="text-destructive">*</span>
                                  </label>

                                  {newGroupAddons.length > 0 && (
                                    <div className="space-y-2 mb-3">
                                      {newGroupAddons.map((addon, index) => (
                                        <div key={index} className="flex items-center justify-between p-3 bg-background rounded-lg border border-border">
                                          <div className="flex items-center gap-2">
                                            <Check className="h-4 w-4 text-green-500" />
                                            <span className="font-medium">{addon.name}</span>
                                            <span className="text-sm text-muted-foreground">
                                              {addon.price > 0 ? `+${addon.price.toFixed(2)}` : 'Free'}
                                            </span>
                                          </div>
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleRemoveAddonFromNewGroup(index)}
                                          >
                                            <X className="h-4 w-4 text-destructive" />
                                          </Button>
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  <div className="flex gap-2">
                                    <Input
                                      placeholder="Option name (e.g., Large, Extra Cheese)"
                                      value={tempAddonName}
                                      onChange={(e) => setTempAddonName(e.target.value)}
                                      onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                          e.preventDefault();
                                          handleAddAddonToNewGroup();
                                        }
                                      }}
                                      className="flex-1"
                                    />
                                    <Input
                                      type="text"
                                      placeholder="Extra price"
                                      value={tempAddonPrice}
                                      onChange={(e) => {
                                        const value = e.target.value;
                                        if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
                                          setTempAddonPrice(value);
                                        }
                                      }}
                                      onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                          e.preventDefault();
                                          handleAddAddonToNewGroup();
                                        }
                                      }}
                                      className="w-28"
                                    />
                                    <Button
                                      type="button"
                                      onClick={handleAddAddonToNewGroup}
                                      size="icon"
                                    >
                                      <Plus className="h-4 w-4" />
                                    </Button>
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    Press Enter or click + to add each option
                                  </p>
                                </div>
                              </div>

                              <div className="flex gap-2 pt-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={handleCancelNewGroup}
                                  className="flex-1"
                                >
                                  Cancel
                                </Button>
                                <Button
                                  type="button"
                                  onClick={handleSaveNewGroup}
                                  className="flex-1"
                                  disabled={newGroupAddons.length === 0}
                                >
                                  <Check className="h-4 w-4 mr-1" />
                                  Save Group
                                </Button>
                              </div>
                            </div>
                          )}

                          {!isCreatingGroup && editingGroupIndex === null && addonGroups.length === 0 && (
                            <div className="text-center py-8 border-2 border-dashed border-border rounded-lg">
                              <p className="text-sm text-muted-foreground mb-3">
                                No customization options yet
                              </p>
                              <Button
                                type="button"
                                onClick={handleStartNewGroup}
                                variant="outline"
                                size="sm"
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Add First Group
                              </Button>
                            </div>
                          )}
                        </div>

                        <div className="flex justify-end space-x-2 pt-4 border-t">
                          <Button type="button" variant="outline" onClick={() => {
                            setIsItemDialogOpen(false);
                            setAddonGroups([]);
                            setIsCreatingGroup(false);
                            setNewGroupTitle("");
                            setNewGroupMultiSelect(false);
                            setNewGroupAddons([]);
                            setTempAddonName("");
                            setTempAddonPrice("");
                            setSelectedImage(null);
                            setImagePreview(null);
                            setEditingGroupIndex(null);
                            setEditingGroupTitle("");
                            setEditingGroupMultiSelect(false);
                            setEditingGroupAddons([]);
                          }}>
                            Cancel
                          </Button>
                          <HeroButton type="submit">
                            {editingItem ? "Update" : "Add"} Item
                          </HeroButton>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default MenuManagementPage;