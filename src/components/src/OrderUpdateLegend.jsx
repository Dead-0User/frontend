import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Plus, 
  Minus, 
  TrendingUp, 
  TrendingDown, 
  Info,
  X,
  Sparkles,
  Edit
} from "lucide-react";

const OrderUpdateLegend = () => {
  const [isVisible, setIsVisible] = useState(false);

  const changeTypes = [
    {
      icon: <Plus className="h-4 w-4" />,
      label: "New Item Added",
      color: "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300",
      badgeColor: "bg-green-500 text-white",
      description: "A completely new item was added to the order",
      example: "Added 2× Margherita Pizza"
    },
    {
      icon: <Minus className="h-4 w-4" />,
      label: "Item Removed",
      color: "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300",
      badgeColor: "bg-red-500 text-white",
      description: "An item was completely removed from the order",
      example: "Removed 1× Caesar Salad"
    },
    {
      icon: <TrendingUp className="h-4 w-4" />,
      label: "Quantity Increased",
      color: "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300",
      badgeColor: "bg-blue-500 text-white",
      description: "The quantity of an existing item was increased",
      example: "Increased from 2 to 3"
    },
    {
      icon: <TrendingDown className="h-4 w-4" />,
      label: "Quantity Decreased",
      color: "bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800 text-orange-800 dark:text-orange-300",
      badgeColor: "bg-orange-500 text-white",
      description: "The quantity of an existing item was decreased",
      example: "Decreased from 3 to 1"
    }
  ];

  if (!isVisible) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsVisible(true)}
        className="gap-2 shadow-sm"
      >
        <Info className="h-4 w-4" />
        What do these colors mean?
      </Button>
    );
  }

  return (
    <Card className="border-2 border-blue-200 dark:border-blue-800 shadow-lg animate-in slide-in-from-top-2 duration-300">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <div className="bg-blue-500 text-white rounded-full p-1.5">
              <Sparkles className="h-4 w-4" />
            </div>
            Understanding Order Updates
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsVisible(false)}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground mb-4">
            When customers or staff modify an order, different colors and icons help you quickly identify what changed:
          </p>
          
          {changeTypes.map((type, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg border ${type.color} transition-all hover:shadow-sm`}
            >
              <div className="flex items-start gap-3">
                <div className={`${type.badgeColor} rounded-full p-1.5 flex-shrink-0 shadow-sm`}>
                  {type.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-sm">{type.label}</h4>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      {type.icon}
                    </Badge>
                  </div>
                  <p className="text-xs mb-2 opacity-90">
                    {type.description}
                  </p>
                  <div className="bg-background/60 rounded px-2 py-1 text-xs font-mono">
                    <Edit className="h-3 w-3 inline mr-1" />
                    {type.example}
                  </div>
                </div>
              </div>
            </div>
          ))}

          <div className="mt-4 pt-4 border-t">
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm text-amber-900 dark:text-amber-100 mb-1">
                    Recently Updated Orders
                  </h4>
                  <p className="text-xs text-amber-800 dark:text-amber-300">
                    Orders with a glowing amber border have <strong>new unseen changes</strong>. 
                    Click "Mark as Seen" to acknowledge the updates.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsVisible(false)}
            className="w-full mt-2"
          >
            Got it!
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderUpdateLegend;