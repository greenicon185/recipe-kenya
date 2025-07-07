
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronRight, Plus, Trash2 } from "lucide-react";
import { Recipe, getCuisines, getCategories, getIngredients, Cuisine, RecipeCategory, Ingredient } from "@/services/recipeService";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";

interface RecipeFormProps {
  initialData?: Partial<Recipe>;
  onSubmit: (data: any) => void;
  buttonText: string;
}

const RecipeForm = ({ initialData = {}, onSubmit, buttonText }: RecipeFormProps) => {
  const { user } = useAuth();
  const [title, setTitle] = useState(initialData.title || "");
  const [description, setDescription] = useState(initialData.description || "");
  const [instructions, setInstructions] = useState<string[]>(
    Array.isArray(initialData.instructions) ? initialData.instructions : [""]
  );
  const [imageUrl, setImageUrl] = useState(initialData.image_url || "");
  const [videoUrl, setVideoUrl] = useState(initialData.video_url || "");
  const [prepTime, setPrepTime] = useState(initialData.prep_time_minutes || 0);
  const [cookTime, setCookTime] = useState(initialData.cook_time_minutes || 0);
  const [servings, setServings] = useState(initialData.servings || 2);
  const [cuisineId, setCuisineId] = useState(initialData.cuisine_id || "");
  const [categoryId, setCategoryId] = useState(initialData.category_id || "");
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>(initialData.difficulty || 'medium');
  const [featured, setFeatured] = useState(initialData.is_featured || false);
  const [published, setPublished] = useState(initialData.is_published !== false);
  
  const [cuisines, setCuisines] = useState<Cuisine[]>([]);
  const [categories, setCategories] = useState<RecipeCategory[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [selectedIngredients, setSelectedIngredients] = useState<Array<{
    ingredient_id: string;
    quantity: number;
    unit: string;
    preparation_note: string;
    is_optional: boolean;
  }>>([{ ingredient_id: "", quantity: 0, unit: "grams", preparation_note: "", is_optional: false }]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cuisinesData, categoriesData, ingredientsData] = await Promise.all([
          getCuisines(),
          getCategories(),
          getIngredients()
        ]);
        setCuisines(cuisinesData);
        setCategories(categoriesData);
        setIngredients(ingredientsData);
      } catch (error) {
        console.error('Error fetching form data:', error);
      }
    };

    fetchData();
  }, []);

  const handleAddInstruction = () => {
    setInstructions([...instructions, ""]);
  };

  const handleInstructionChange = (index: number, value: string) => {
    const newInstructions = [...instructions];
    newInstructions[index] = value;
    setInstructions(newInstructions);
  };

  const handleRemoveInstruction = (index: number) => {
    const newInstructions = [...instructions];
    newInstructions.splice(index, 1);
    setInstructions(newInstructions);
  };

  const handleAddIngredient = () => {
    setSelectedIngredients([...selectedIngredients, {
      ingredient_id: "",
      quantity: 0,
      unit: "grams",
      preparation_note: "",
      is_optional: false
    }]);
  };

  const handleIngredientChange = (index: number, field: string, value: any) => {
    const newIngredients = [...selectedIngredients];
    newIngredients[index] = { ...newIngredients[index], [field]: value };
    setSelectedIngredients(newIngredients);
  };

  const handleRemoveIngredient = (index: number) => {
    const newIngredients = [...selectedIngredients];
    newIngredients.splice(index, 1);
    setSelectedIngredients(newIngredients);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const filteredInstructions = instructions.filter(item => item.trim() !== "");
    const filteredIngredients = selectedIngredients.filter(item => item.ingredient_id && item.quantity > 0);
    
    onSubmit({
      title,
      description,
      instructions: filteredInstructions,
      image_url: imageUrl,
      video_url: videoUrl || null,
      prep_time_minutes: prepTime,
      cook_time_minutes: cookTime,
      servings,
      cuisine_id: cuisineId || null,
      category_id: categoryId || null,
      difficulty,
      is_featured: featured,
      is_published: published,
      created_by: user?.id,
      recipe_ingredients: filteredIngredients
    });
  };

  const units = ["grams", "kg", "ml", "liters", "cups", "tbsp", "tsp", "pieces", "cloves", "pinch"];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="title">Recipe Title</Label>
          <Input 
            id="title" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            required
            placeholder="Enter recipe title"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="difficulty">Difficulty</Label>
          <Select value={difficulty} onValueChange={(value: 'easy' | 'medium' | 'hard') => setDifficulty(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="easy">Easy</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="hard">Hard</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="cuisine">Cuisine</Label>
          <Select value={cuisineId} onValueChange={setCuisineId}>
            <SelectTrigger>
              <SelectValue placeholder="Select cuisine" />
            </SelectTrigger>
            <SelectContent>
              {cuisines.map((cuisine) => (
                <SelectItem key={cuisine.id} value={cuisine.id}>
                  {cuisine.name} {cuisine.is_kenyan_local && '🇰🇪'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.icon} {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea 
          id="description" 
          value={description} 
          onChange={(e) => setDescription(e.target.value)} 
          required
          placeholder="Brief description of the recipe"
          className="h-20"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="prepTime">Prep Time (minutes)</Label>
          <Input 
            id="prepTime" 
            type="number" 
            value={prepTime} 
            onChange={(e) => setPrepTime(parseInt(e.target.value))} 
            min="0"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="cookTime">Cook Time (minutes)</Label>
          <Input 
            id="cookTime" 
            type="number" 
            value={cookTime} 
            onChange={(e) => setCookTime(parseInt(e.target.value))} 
            min="0"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="servings">Servings</Label>
          <Input 
            id="servings" 
            type="number" 
            value={servings} 
            onChange={(e) => setServings(parseInt(e.target.value))} 
            min="1"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="imageUrl">Image URL</Label>
        <Input 
          id="imageUrl" 
          value={imageUrl} 
          onChange={(e) => setImageUrl(e.target.value)} 
          required
          placeholder="Enter a URL for the recipe image"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="videoUrl">Video URL (Optional)</Label>
        <Input 
          id="videoUrl" 
          value={videoUrl} 
          onChange={(e) => setVideoUrl(e.target.value)} 
          placeholder="Enter a URL for the recipe video"
        />
      </div>

      <div className="space-y-2">
        <Label>Ingredients</Label>
        {selectedIngredients.map((ingredient, index) => (
          <div key={index} className="grid grid-cols-12 gap-2 items-center">
            <div className="col-span-5">
              <Select value={ingredient.ingredient_id} onValueChange={(value) => handleIngredientChange(index, 'ingredient_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select ingredient" />
                </SelectTrigger>
                <SelectContent>
                  {ingredients.map((ing) => (
                    <SelectItem key={ing.id} value={ing.id}>
                      {ing.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Input
                type="number"
                value={ingredient.quantity}
                onChange={(e) => handleIngredientChange(index, 'quantity', parseFloat(e.target.value))}
                placeholder="Qty"
                min="0"
                step="0.1"
              />
            </div>
            <div className="col-span-2">
              <Select value={ingredient.unit} onValueChange={(value) => handleIngredientChange(index, 'unit', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {units.map((unit) => (
                    <SelectItem key={unit} value={unit}>
                      {unit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Input
                value={ingredient.preparation_note}
                onChange={(e) => handleIngredientChange(index, 'preparation_note', e.target.value)}
                placeholder="Notes"
              />
            </div>
            <div className="col-span-1 flex justify-center">
              {selectedIngredients.length > 1 && (
                <Button 
                  type="button" 
                  variant="outline" 
                  size="icon" 
                  onClick={() => handleRemoveIngredient(index)}
                >
                  <Trash2 size={16} />
                </Button>
              )}
            </div>
          </div>
        ))}
        <Button 
          type="button" 
          variant="outline" 
          onClick={handleAddIngredient}
          className="mt-2"
        >
          <Plus size={16} className="mr-2" />
          Add Ingredient
        </Button>
      </div>

      <div className="space-y-2">
        <Label>Instructions</Label>
        {instructions.map((instruction, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className="flex-shrink-0 bg-gray-100 rounded-full h-6 w-6 flex items-center justify-center">
              <span className="text-xs font-medium">{index + 1}</span>
            </div>
            <Textarea
              value={instruction}
              onChange={(e) => handleInstructionChange(index, e.target.value)}
              placeholder="Enter an instruction step"
              className="flex-1"
            />
            {instructions.length > 1 && (
              <Button 
                type="button" 
                variant="outline" 
                size="icon" 
                onClick={() => handleRemoveInstruction(index)}
              >
                <Trash2 size={16} />
              </Button>
            )}
          </div>
        ))}
        <Button 
          type="button" 
          variant="outline" 
          onClick={handleAddInstruction}
          className="mt-2"
        >
          <Plus size={16} className="mr-2" />
          Add Step
        </Button>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="featured" 
            checked={featured}
            onCheckedChange={(checked) => setFeatured(checked as boolean)}
          />
          <Label htmlFor="featured">Mark as Featured Recipe</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="published" 
            checked={published}
            onCheckedChange={(checked) => setPublished(checked as boolean)}
          />
          <Label htmlFor="published">Publish Recipe</Label>
        </div>
      </div>

      <Button type="submit" className="w-full sm:w-auto">
        {buttonText}
        <ChevronRight size={16} className="ml-2" />
      </Button>
    </form>
  );
};

export default RecipeForm;
