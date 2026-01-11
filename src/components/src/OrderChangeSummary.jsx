import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Plus, Minus, TrendingUp, TrendingDown, Edit, AlertCircle } from "lucide-react";

const OrderChangeSummary = ({ items, updateCount }) => {
  // Analyze changes in detail
  const addedItems = items.filter(item => item.isNew && !item.isRemoved);
  const removedItems = items.filter(item => item.isRemoved);
  
  // Count quantity changes (items that exist in both but with different quantities)
  const modifiedItems = items.filter(item => !item.isNew && !item.isRemoved);
  
  const totalChanges = addedItems.length + removedItems.length;

  if (totalChanges === 0 && updateCount === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-l-4 border-amber-500 rounded-lg p-4 mb-4 shadow-sm">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="bg-amber-500 text-white rounded-full p-1">
              <Edit className="h-4 w-4" />
            </div>
            <span className="text-sm font-bold text-amber-900 dark:text-amber-100">
              Update #{updateCount}
            </span>
          </div>
          
          <span className="text-xs text-amber-700 dark:text-amber-300 font-medium bg-amber-100 dark:bg-amber-900/40 px-2 py-1 rounded">
            {totalChanges} {totalChanges === 1 ? 'Change' : 'Changes'}
          </span>
        </div>

        {/* Change Breakdown */}
        <div className="flex flex-wrap gap-2">
          {addedItems.length > 0 && (
            <Badge className="bg-green-500/20 text-green-800 dark:text-green-300 border-green-500/40 text-xs gap-1.5 px-3 py-1 shadow-sm">
              <div className="bg-green-500 text-white rounded-full p-0.5">
                <Plus className="h-3 w-3" />
              </div>
              <span className="font-semibold">{addedItems.length} Added</span>
            </Badge>
          )}
          
          {removedItems.length > 0 && (
            <Badge className="bg-red-500/20 text-red-800 dark:text-red-300 border-red-500/40 text-xs gap-1.5 px-3 py-1 shadow-sm">
              <div className="bg-red-500 text-white rounded-full p-0.5">
                <Minus className="h-3 w-3" />
              </div>
              <span className="font-semibold">{removedItems.length} Removed</span>
            </Badge>
          )}
        </div>

        {/* Quick Preview of Changes */}
        <div className="space-y-1.5">
          {addedItems.slice(0, 2).map((item, idx) => (
            <div key={idx} className="flex items-center gap-2 text-xs bg-green-500/10 dark:bg-green-900/20 px-2 py-1 rounded border border-green-500/20">
              <Plus className="h-3 w-3 text-green-600 dark:text-green-400 flex-shrink-0" />
              <span className="text-green-800 dark:text-green-300 font-medium">
                Added: {item.name} ×{item.quantity}
              </span>
            </div>
          ))}
          
          {addedItems.length > 2 && (
            <div className="text-xs text-green-700 dark:text-green-400 pl-5">
              +{addedItems.length - 2} more items added
            </div>
          )}

          {removedItems.slice(0, 2).map((item, idx) => (
            <div key={idx} className="flex items-center gap-2 text-xs bg-red-500/10 dark:bg-red-900/20 px-2 py-1 rounded border border-red-500/20">
              <Minus className="h-3 w-3 text-red-600 dark:text-red-400 flex-shrink-0" />
              <span className="text-red-800 dark:text-red-300 font-medium line-through">
                Removed: {item.name} ×{item.quantity}
              </span>
            </div>
          ))}
          
          {removedItems.length > 2 && (
            <div className="text-xs text-red-700 dark:text-red-400 pl-5">
              +{removedItems.length - 2} more items removed
            </div>
          )}
        </div>

        {/* Call to Action */}
        <div className="flex items-center gap-2 pt-2 border-t border-amber-200 dark:border-amber-800">
          <AlertCircle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
          <span className="text-xs text-amber-700 dark:text-amber-300 font-medium">
            Expand order details below to see full changes
          </span>
        </div>
      </div>
    </div>
  );
};

export default OrderChangeSummary;