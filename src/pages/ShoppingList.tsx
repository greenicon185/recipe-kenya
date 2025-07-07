import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2, RefreshCw, Trash2, Plus } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import {
  getShoppingLists,
  getShoppingList,
  toggleShoppingListItem,
  removeShoppingListItem,
  addCustomItemToShoppingList,
  clearCheckedItems,
  optimizeShoppingList,
  ShoppingList as ShoppingListType,
  ShoppingListItem,
} from '@/services/shoppingListService';
import { getIngredientAvailability, SupermarketIngredient } from '@/services/supermarketService';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function ShoppingList() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [shoppingList, setShoppingList] = useState<ShoppingListType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ShoppingListItem | null>(null);
  const [newItem, setNewItem] = useState({
    ingredient_id: '',
    quantity: 0,
    unit: 'grams',
    custom_note: '',
  });

  useEffect(() => {
    if (user && id) {
      fetchShoppingList();
    } else {
      setLoading(false);
    }
  }, [user, id]);

  const fetchShoppingList = async () => {
    if (!user || !id) return;

    try {
      setLoading(true);
      setError(null);
      const list = await getShoppingList(id);
      setShoppingList(list);
    } catch (err) {
      console.error('Error fetching shopping list:', err);
      setError('Failed to load shopping list. Please try again.');
      toast({
        title: 'Error',
        description: 'Failed to load shopping list. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleItem = async (itemId: string, isChecked: boolean) => {
    try {
      await toggleShoppingListItem(itemId, isChecked);
      setShoppingList(prev => {
        if (!prev) return null;
        return {
          ...prev,
          items: prev.items.map(item =>
            item.id === itemId ? { ...item, is_checked: isChecked } : item
          ),
        };
      });
    } catch (err) {
      console.error('Error toggling item:', err);
      toast({
        title: 'Error',
        description: 'Failed to update item. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    try {
      await removeShoppingListItem(itemId);
      setShoppingList(prev => {
        if (!prev) return null;
        return {
          ...prev,
          items: prev.items.filter(item => item.id !== itemId),
        };
      });
      toast({
        title: 'Success',
        description: 'Item removed from shopping list.',
      });
    } catch (err) {
      console.error('Error removing item:', err);
      toast({
        title: 'Error',
        description: 'Failed to remove item. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleAddCustomItem = async () => {
    if (!shoppingList || !newItem.ingredient_id || newItem.quantity <= 0) return;

    try {
      const item = await addCustomItemToShoppingList(shoppingList.id, newItem);
      setShoppingList(prev => {
        if (!prev) return null;
        return {
          ...prev,
          items: [...prev.items, item],
        };
      });
      setNewItem({
        ingredient_id: '',
        quantity: 0,
        unit: 'grams',
        custom_note: '',
      });
      toast({
        title: 'Success',
        description: 'Item added to shopping list.',
      });
    } catch (err) {
      console.error('Error adding item:', err);
      toast({
        title: 'Error',
        description: 'Failed to add item. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleClearChecked = async () => {
    if (!shoppingList) return;

    try {
      await clearCheckedItems(shoppingList.id);
      setShoppingList(prev => {
        if (!prev) return null;
        return {
          ...prev,
          items: prev.items.filter(item => !item.is_checked),
        };
      });
      toast({
        title: 'Success',
        description: 'Checked items cleared from shopping list.',
      });
    } catch (err) {
      console.error('Error clearing checked items:', err);
      toast({
        title: 'Error',
        description: 'Failed to clear checked items. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleOptimize = async () => {
    if (!shoppingList) return;

    try {
      setIsOptimizing(true);
      await optimizeShoppingList(shoppingList.id);
      await fetchShoppingList();
      toast({
        title: 'Success',
        description: 'Shopping list optimized successfully.',
      });
    } catch (err) {
      console.error('Error optimizing shopping list:', err);
      toast({
        title: 'Error',
        description: 'Failed to optimize shopping list. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsOptimizing(false);
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please sign in to access shopping lists. You can sign in using the button in the top right corner.
            </AlertDescription>
          </Alert>
        </main>
        <Footer />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading shopping list...</span>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
          <div className="mt-4">
            <Button onClick={fetchShoppingList} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!shoppingList) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Shopping list not found.
            </AlertDescription>
          </Alert>
          <div className="mt-4">
            <Button onClick={() => navigate('/meal-planner')} variant="outline">
              Return to Meal Planner
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">{shoppingList.name}</h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleClearChecked}
              disabled={!shoppingList.items.some(item => item.is_checked)}
            >
              Clear Checked
            </Button>
            <Button
              variant="outline"
              onClick={handleOptimize}
              disabled={isOptimizing}
            >
              {isOptimizing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Optimizing...
                </>
              ) : (
                'Optimize List'
              )}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Shopping List Items */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {shoppingList.items.length > 0 ? (
                    shoppingList.items.map(item => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 bg-card rounded-lg border"
                      >
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            checked={item.is_checked}
                            onCheckedChange={(checked) =>
                              handleToggleItem(item.id, checked as boolean)
                            }
                          />
                          <div>
                            <p className="font-medium">
                              {item.quantity} {item.unit} {item.ingredient?.name}
                            </p>
                            {item.custom_note && (
                              <p className="text-sm text-muted-foreground">
                                {item.custom_note}
                              </p>
                            )}
                            {item.recipe && (
                              <p className="text-sm text-muted-foreground">
                                For: {item.recipe.title}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedItem(item)}
                              >
                                Where to Buy
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>
                                  Where to buy {item.ingredient?.name}
                                </DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                {selectedItem?.ingredient && (
                                  <SupermarketAvailability
                                    ingredientId={selectedItem.ingredient.id}
                                  />
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleRemoveItem(item.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center p-6 bg-muted rounded-lg">
                      <p className="text-muted-foreground">No items in shopping list</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Add Custom Item */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Add Custom Item</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Input
                        placeholder="Item name"
                        value={newItem.ingredient_id}
                        onChange={(e) =>
                          setNewItem({ ...newItem, ingredient_id: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Input
                        type="number"
                        placeholder="Quantity"
                        value={newItem.quantity}
                        onChange={(e) =>
                          setNewItem({
                            ...newItem,
                            quantity: parseFloat(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Select
                        value={newItem.unit}
                        onValueChange={(value) =>
                          setNewItem({ ...newItem, unit: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="grams">Grams</SelectItem>
                          <SelectItem value="kg">Kilograms</SelectItem>
                          <SelectItem value="ml">Milliliters</SelectItem>
                          <SelectItem value="liters">Liters</SelectItem>
                          <SelectItem value="cups">Cups</SelectItem>
                          <SelectItem value="tbsp">Tablespoons</SelectItem>
                          <SelectItem value="tsp">Teaspoons</SelectItem>
                          <SelectItem value="pieces">Pieces</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      <Input
                        placeholder="Custom note (optional)"
                        value={newItem.custom_note}
                        onChange={(e) =>
                          setNewItem({ ...newItem, custom_note: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <Button
                    onClick={handleAddCustomItem}
                    disabled={!newItem.ingredient_id || newItem.quantity <= 0}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Item
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

interface SupermarketAvailabilityProps {
  ingredientId: string;
}

function SupermarketAvailability({ ingredientId }: SupermarketAvailabilityProps) {
  const [availability, setAvailability] = useState<SupermarketIngredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getIngredientAvailability(ingredientId);
        setAvailability(data);
      } catch (err) {
        console.error('Error fetching ingredient availability:', err);
        setError('Failed to load supermarket availability.');
      } finally {
        setLoading(false);
      }
    };

    fetchAvailability();
  }, [ingredientId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="w-4 h-4 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (availability.length === 0) {
    return (
      <p className="text-center text-muted-foreground">
        No supermarket availability information found
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {availability.map((item) => (
        <div
          key={item.id}
          className="flex items-center justify-between p-4 border rounded-lg"
        >
          <div className="flex items-center space-x-4">
            <img
              src={item.supermarket?.logo_url}
              alt={item.supermarket?.name}
              className="w-12 h-12 object-contain"
            />
            <div>
              <p className="font-semibold">{item.supermarket?.name}</p>
              <p className="text-sm text-muted-foreground">
                {item.price} {item.currency} per {item.quantity} {item.unit}
              </p>
            </div>
          </div>
          <a
            href={item.product_url}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button>View Product</Button>
          </a>
        </div>
      ))}
    </div>
  );
} 